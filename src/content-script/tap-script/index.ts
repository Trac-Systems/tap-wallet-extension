// WeakMap polyfill to ensure compatibility
if (
  typeof WeakMap === 'undefined' ||
  (typeof window !== 'undefined' && typeof window.WeakMap === 'undefined')
) {
  const WeakMapPolyfill = class WeakMap<K extends object, V> {
    private _keys: K[] = [];
    private _values: V[] = [];

    has(key: K): boolean {
      return this._keys.indexOf(key) !== -1;
    }

    get(key: K): V | undefined {
      const index = this._keys.indexOf(key);
      return index !== -1 ? this._values[index] : undefined;
    }

    set(key: K, value: V): this {
      const index = this._keys.indexOf(key);
      if (index !== -1) {
        this._values[index] = value;
      } else {
        this._keys.push(key);
        this._values.push(value);
      }
      return this;
    }

    delete(key: K): boolean {
      const index = this._keys.indexOf(key);
      if (index !== -1) {
        this._keys.splice(index, 1);
        this._values.splice(index, 1);
        return true;
      }
      return false;
    }
  };

  if (typeof global !== 'undefined') {
    (global as any).WeakMap = WeakMapPolyfill;
  }
  if (typeof window !== 'undefined') {
    (window as any).WeakMap = WeakMapPolyfill;
  }
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).WeakMap = WeakMapPolyfill;
  }
}

// this script is injected into webpage's context
import { ethErrors, serializeError } from 'eth-rpc-errors';
import { EventEmitter } from 'events';

import ReadyPromise from './ready-promise';
import { $, domReadyCall } from './utils';
import BroadcastChannelMessage from '@/src/gateway/message/broadcast-chanel';
import { TxType } from '@/src/wallet-instance';
import MessageHandlers from './message-handler';

const script = document.currentScript;
const channelName = script?.getAttribute('channel') || 'TAP';

export interface Interceptor {
  onRequest?: (data: any) => any;
  onResponse?: (res: any, data: any) => any;
}

interface StateProvider {
  accounts: string[] | null;
  isConnected: boolean;
  isUnlocked: boolean;
  initialized: boolean;
  isPermanentlyDisconnected: boolean;
}

export class TapProvider extends EventEmitter {
  _selectedAddress: string | null = null;
  _network: string | null = null;
  _isConnected = false;
  _initialized = false;
  _isUnlocked = false;

  _state: StateProvider = {
    accounts: null,
    isConnected: false,
    isUnlocked: false,
    initialized: false,
    isPermanentlyDisconnected: false,
  };

  private _MessageHandlers: MessageHandlers;
  private _requestPromise = new ReadyPromise(0);

  private _bcm = new BroadcastChannelMessage(channelName);

  constructor({ maxListeners = 100 } = {}) {
    super();
    this.setMaxListeners(maxListeners);
    this.initialize();
    this._MessageHandlers = new MessageHandlers(this);
  }

  initialize = async () => {
    document.addEventListener(
      'visibilitychange',
      this._requestPromiseCheckVisibility,
    );

    this._bcm.connect().on('message', this._handleBackgroundMessage);
    domReadyCall(() => {
      const origin = window.top?.location.origin;
      const icon =
        ($('head > link[rel~="icon"]') as HTMLLinkElement)?.href ||
        ($('head > meta[itemprop="image"]') as HTMLMetaElement)?.content;

      const name =
        document.title ||
        ($('head > meta[name="title"]') as HTMLMetaElement)?.content ||
        origin;

      this._bcm.request({
        method: 'tabCheckin',
        params: { icon, name, origin },
      });
    });

    try {
      const { network, accounts, isUnlocked }: any = await this._request({
        method: 'getProviderState',
      });
      if (isUnlocked) {
        this._isUnlocked = true;
        this._state.isUnlocked = true;
      }
      this.emit('connect', {});
      this._MessageHandlers.networkChanged({
        network,
      });

      this._MessageHandlers.accountsChanged(accounts);
    } catch {
      //
    } finally {
      this._initialized = true;
      this._state.initialized = true;
      this.emit('_initialized');
    }

    this.keepAlive();
  };

  private keepAlive = () => {
    this._request({
      method: 'keepAlive',
      params: {},
    }).then(() => {
      setTimeout(() => {
        this.keepAlive();
      }, 1000);
    });
  };

  private _requestPromiseCheckVisibility = () => {
    if (document.visibilityState === 'visible') {
      this._requestPromise.check(1);
    } else {
      this._requestPromise.uncheck(1);
    }
  };

  private _handleBackgroundMessage = ({ event, data }) => {
    if (this._MessageHandlers[event]) {
      return this._MessageHandlers[event](data);
    }

    this.emit(event, data);
  };

  _request = async data => {
    if (!data) {
      throw ethErrors.rpc.invalidRequest();
    }

    this._requestPromiseCheckVisibility();

    return this._requestPromise.call(() => {
      return this._bcm
        .request(data)
        .then(res => {
          return res;
        })
        .catch(err => {
          throw serializeError(err);
        });
    });
  };

  requestAccounts = async () => {
    return this._request({
      method: 'requestAccounts',
    });
  };

  getNetwork = async () => {
    return this._request({
      method: 'getNetwork',
    });
  };

  switchNetwork = async (network: string) => {
    return this._request({
      method: 'switchNetwork',
      params: {
        network,
      },
    });
  };

  getAccounts = async () => {
    return this._request({
      method: 'getAccounts',
    });
  };

  getPublicKey = async () => {
    return this._request({
      method: 'getPublicKey',
    });
  };

  getBalance = async () => {
    return this._request({
      method: 'getBalance',
    });
  };

  getInscriptions = async (cursor = 0, size = 20) => {
    return this._request({
      method: 'getInscriptions',
      params: {
        cursor,
        size,
      },
    });
  };

  signMessage = async (text: string, type: string) => {
    return this._request({
      method: 'signMessage',
      params: {
        text,
        type,
      },
    });
  };

  verifyMessageOfBIP322Simple = async (
    address: string,
    message: string,
    signature: string,
    network?: number,
  ) => {
    return this._request({
      method: 'verifyMessageOfBIP322Simple',
      params: {
        address,
        message,
        signature,
        network,
      },
    });
  };

  signData = async (data: string, type: string) => {
    return this._request({
      method: 'signData',
      params: {
        data,
        type,
      },
    });
  };

  sendBitcoin = async (
    toAddress: string,
    satoshis: number,
    options?: { feeRate: number; memo?: string; memos?: string[] },
  ) => {
    return this._request({
      method: 'sendBitcoin',
      params: {
        toAddress,
        satoshis,
        feeRate: options?.feeRate,
        memo: options?.memo,
        memos: options?.memos,
        type: TxType.SEND_BITCOIN,
      },
    });
  };

  sendInscription = async (
    toAddress: string,
    inscriptionId: string,
    options?: { feeRate: number },
  ) => {
    return this._request({
      method: 'sendInscription',
      params: {
        toAddress,
        inscriptionId,
        feeRate: options?.feeRate,
        type: TxType.SEND_ORDINALS_INSCRIPTION,
      },
    });
  };

  sendTapTransfer = async (toAddress: string, ticker: string) => {
    return this._request({
      method: 'sendTapTransfer',
      params: {
        toAddress,
        ticker,
      },
    });
  };
  // signTx = async (rawtx: string) => {
  //   return this._request({
  //     method: 'signTx',
  //     params: {
  //       rawtx
  //     }
  //   });
  // };

  /**
   * push transaction
   */
  pushTx = async (rawtx: string) => {
    return this._request({
      method: 'pushTx',
      params: {
        rawtx,
      },
    });
  };

  signPsbt = async (psbtHex: string, options?: any) => {
    return this._request({
      method: 'signPsbt',
      params: {
        psbtHex,
        type: TxType.SIGN_TX,
        options,
      },
    });
  };

  signPsbts = async (psbtHexs: string[], options?: any[]) => {
    return this._request({
      method: 'multiSignPsbt',
      params: {
        psbtHexs,
        options,
      },
    });
  };

  pushPsbt = async (psbtHex: string) => {
    return this._request({
      method: 'pushPsbt',
      params: {
        psbtHex,
      },
    });
  };

  inscribeTransfer = async (ticker: string, amount: string) => {
    return this._request({
      method: 'inscribeTransfer',
      params: {
        ticker,
        amount,
      },
    });
  };

  singleTxTransfer = async (
    items: {
      addr: string;
      tick: string;
      amt: string;
      dta?: string;
    }[],
  ) => {
    return this._request({
      method: 'singleTxTransfer',
      params: {
        items,
      },
    });
  };

  hasActiveAuthority = async () => {
    return this._request({
      method: 'hasActiveAuthority',
    });
  };

  getBitcoinUtxos = async (cursor = 0, size = 20) => {
    return this._request({
      method: 'getBitcoinUtxos',
      params: {
        cursor,
        size,
      },
    });
  };

  disconnect = async (cursor = 0, size = 20) => {
    return this._request({
      method: 'disconnect',
      params: {
        cursor,
        size,
      },
    });
  };
}

declare global {
  interface Window {
    tapprotocol: TapProvider;
  }
}

const provider = new TapProvider();

if (!window.tapprotocol) {
  window.tapprotocol = new Proxy(provider, {
    deleteProperty: () => true,
  });
}

Object.defineProperty(window, 'tapprotocol', {
  value: new Proxy(provider, {
    deleteProperty: () => true,
  }),
  writable: false,
});

window.dispatchEvent(new Event('tapprotocol#initialized'));

// TRAC Network Provider
export class TracNetworkProvider extends EventEmitter {
  private _bcm = new BroadcastChannelMessage(channelName);
  private _requestPromise = new ReadyPromise(0);
  private _initialized = false;

  constructor({ maxListeners = 100 } = {}) {
    super();
    this.setMaxListeners(maxListeners);
    this.initialize();
  }

  initialize = async () => {
    document.addEventListener(
      'visibilitychange',
      this._requestPromiseCheckVisibility,
    );

    this._bcm.connect().on('message', this._handleBackgroundMessage);

    this._initialized = true;
    this.emit('_initialized');
  };

  private _requestPromiseCheckVisibility = () => {
    if (document.visibilityState === 'visible') {
      this._requestPromise.check(1);
    } else {
      this._requestPromise.uncheck(1);
    }
  };

  private _handleBackgroundMessage = ({ event, data }) => {
    this.emit(event, data);
  };

  _request = async data => {
    if (!data) {
      throw ethErrors.rpc.invalidRequest();
    }

    this._requestPromiseCheckVisibility();

    return this._requestPromise.call(() => {
      return this._bcm
        .request(data)
        .then(res => {
          return res;
        })
        .catch(err => {
          throw serializeError(err);
        });
    });
  };

  requestAccount = async () => {
    return this._request({
      method: 'tracRequestAccount',
    });
  };

  getAddress = async () => {
    return this._request({
      method: 'tracGetAddress',
    });
  };

  getBalance = async () => {
    return this._request({
      method: 'tracGetBalance',
    });
  };

  getNetwork = async () => {
    return this._request({
      method: 'getNetwork',
    });
  };

  switchNetwork = async (network: string) => {
    return this._request({
      method: 'switchNetwork',
      params: {
        network,
      },
    });
  };

  getPublicKey = async () => {
    return this._request({
      method: 'tracGetPublicKey',
    });
  };

  signMessage = async (message: string) => {
    return this._request({
      method: 'tracSignMessage',
      params: {
        message,
      },
    });
  };

  sendTNK = async (from: string, to: string, amount: string) => {
    return this._request({
      method: 'tracSendTNK',
      params: {
        from,
        to,
        amount,
      },
    });
  };

  buildTracTx = async (params: { from?: string; to: string; amount: string }) => {
    return this._request({
      method: 'tracBuildTx',
      params,
    });
  };

  signTracTx = async (txData: any) => {
    return this._request({
      method: 'tracSignTx',
      params: { txData },
    });
  };

  pushTracTx = async (txPayload: string) => {
    return this._request({
      method: 'tracPushTx',
      params: { txPayload },
    });
  };
}

declare global {
  interface Window {
    tracnetwork: TracNetworkProvider;
  }
}

const tracProvider = new TracNetworkProvider();

if (!window.tracnetwork) {
  window.tracnetwork = new Proxy(tracProvider, {
    deleteProperty: () => true,
  });
}

Object.defineProperty(window, 'tracnetwork', {
  value: new Proxy(tracProvider, {
    deleteProperty: () => true,
  }),
  writable: false,
});

window.dispatchEvent(new Event('tracnetwork#initialized'));
