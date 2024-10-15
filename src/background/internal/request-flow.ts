import {ethErrors} from 'eth-rpc-errors';
import compose from 'koa-compose';
import 'reflect-metadata';

import providerController from './controller';
import {
  authService,
  notificationService,
  permissionService,
} from '../service/singleton';
import {EVENTS} from '@/src/wallet-instance';
import {underline2CamelCase} from '../utils';
import eventBus from '@/src/gateway/event-bus';
export class PromiseFlow {
  private _tasks: ((args: any) => void)[] = [];
  _context: any = {};
  requestedApproval = false;

  use(fn): PromiseFlow {
    if (typeof fn !== 'function') {
      throw new Error('promise need function to handle');
    }
    this._tasks.push(fn);

    return this;
  }

  callback() {
    return compose(this._tasks);
  }
}

const isSignApproval = (type: string) => {
  const SIGN_APPROVALS = ['SignMessage', 'SignPsbt', 'SignTx', 'SignData'];
  return SIGN_APPROVALS.includes(type);
};
const windowHeight = 600;
const flow = new PromiseFlow();
const flowContext = flow
  .use(async (ctx, next) => {
    // check method
    const {
      data: {method},
    } = ctx.request;
    ctx.mapMethod = underline2CamelCase(method);

    if (!providerController[ctx.mapMethod]) {
      throw ethErrors.rpc.methodNotFound({
        message: `method [${method}] doesn't has corresponding handler`,
        data: ctx.request.data,
      });
    }

    return next();
  })
  .use(async (ctx, next) => {
    const {mapMethod} = ctx;
    if (!Reflect.getMetadata('SAFE', providerController, mapMethod)) {
      // check lock
      const isUnlock = authService.memStore.getState().isUnlocked;

      if (!isUnlock) {
        ctx.request.requestedApproval = true;
        await notificationService.requestApproval({lock: true});
      }
    }

    return next();
  })
  .use(async (ctx, next) => {
    // check connect
    const {
      request: {
        session: {origin, name, icon},
      },
      mapMethod,
    } = ctx;
    if (!Reflect.getMetadata('SAFE', providerController, mapMethod)) {
      if (!permissionService.hasPermission(origin)) {
        ctx.request.requestedApproval = true;
        await notificationService.requestApproval(
          {
            params: {
              method: 'connect',
              data: {},
              session: {origin, name, icon},
            },
            approvalComponent: 'Connect',
          },
          {height: windowHeight},
        );
        permissionService.addConnectedSite(origin, name, icon);
      }
    }

    return next();
  })
  .use(async (ctx, next) => {
    const {
      request: {
        data: {params, method},
        session: {origin, name, icon},
      },
      mapMethod,
    } = ctx;
    const [approvalType, condition, options = {}] =
      Reflect.getMetadata('APPROVAL', providerController, mapMethod) || [];

    if (approvalType && (!condition || !condition(ctx.request))) {
      ctx.request.requestedApproval = true;
      ctx.approvalRes = await notificationService.requestApproval(
        {
          approvalComponent: approvalType,
          params: {
            method,
            data: params,
            session: {origin, name, icon},
          },
          origin,
        },
        {height: windowHeight},
      );
      if (isSignApproval(approvalType)) {
        permissionService.updateConnectSite(origin, {isSigned: true}, true);
      } else {
        permissionService.touchConnectedSite(origin);
      }
    }

    return next();
  })
  .use(async ctx => {
    const {approvalRes, mapMethod, request} = ctx;
    const [approvalType] =
      Reflect.getMetadata('APPROVAL', providerController, mapMethod) || [];

    const {uiRequestComponent, ...rest} = approvalRes || {};
    const {
      session: {origin},
    } = request;
    const requestDefer = Promise.resolve(
      providerController[mapMethod]({
        ...request,
        approvalRes,
      }),
    );

    requestDefer
      .then(result => {
        if (isSignApproval(approvalType)) {
          eventBus.emit(EVENTS.broadcastToUI, {
            method: EVENTS.SIGN_FINISHED,
            params: {
              success: true,
              data: result,
            },
          });
        }
        return result;
      })
      .catch((e: any) => {
        if (isSignApproval(approvalType)) {
          eventBus.emit(EVENTS.broadcastToUI, {
            method: EVENTS.SIGN_FINISHED,
            params: {
              success: false,
              errorMsg: JSON.stringify(e),
            },
          });
        }
      });
    async function requestApprovalLoop({uiRequestComponent, ...rest}) {
      ctx.request.requestedApproval = true;
      const res = await notificationService.requestApproval({
        approvalComponent: uiRequestComponent,
        params: rest,
        origin,
        approvalType,
      });
      if (res.uiRequestComponent) {
        return await requestApprovalLoop(res);
      } else {
        return res;
      }
    }
    if (uiRequestComponent) {
      ctx.request.requestedApproval = true;
      return await requestApprovalLoop({uiRequestComponent, ...rest});
    }

    return requestDefer;
  })
  .callback();

export default request => {
  const ctx: any = {request: {...request, requestedApproval: false}};
  return flowContext(ctx).finally(() => {
    if (ctx.request.requestedApproval) {
      flow.requestedApproval = false;
      notificationService.unLock();
    }
  });
};
