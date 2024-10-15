import {ethErrors} from 'eth-rpc-errors';

import internalMethod from './internal-method';
import rpcFlow from './request-flow';
import {sessionService, walletService} from '../service/singleton';
import {tab} from '../browser-api';

tab.on('tabRemove', id => {
  sessionService.deleteSession(id);
});

export const internalProvide = async (req: {data: {method: any}}) => {
  const {
    data: {method},
  } = req;
  if (internalMethod[method]) {
    return internalMethod[method](req);
  }

  const hasWallet = walletService.hasWallet();
  if (!hasWallet) {
    throw ethErrors.provider.userRejectedRequest({
      message: 'wallet must has at least one account',
    });
  }
  return rpcFlow(req);
};
