import {ethErrors} from 'eth-rpc-errors';
import {permissionService, sessionService} from '../service/singleton';
import {bitcoin, getBitcoinNetwork} from '../utils';
import walletProvider from '../provider';
import {NETWORK_TYPES, Network} from '../../wallet-instance';

function formatPsbtHex(psbtHex: string) {
  let formatData = '';
  try {
    if (!/^[0-9a-fA-F]+$/.test(psbtHex)) {
      formatData = bitcoin.Psbt.fromBase64(psbtHex).toHex();
    } else {
      bitcoin.Psbt.fromHex(psbtHex);
      formatData = psbtHex;
    }
  } catch (e) {
    throw new Error('invalid psbt');
  }
  return formatData;
}

class InternalProvider {
  requestAccounts = async ({session: {origin}}) => {
    if (!permissionService.hasPermission(origin)) {
      throw ethErrors.provider.unauthorized();
    }

    const _account = walletProvider.getActiveAccount();
    const account = _account ? [_account.address] : [];
    sessionService.broadcastEvent('accountsChanged', account);
    const connectSite = permissionService.getConnectedSite(origin);
    if (connectSite) {
      const network = walletProvider.getActiveNetwork();
      sessionService.broadcastEvent(
        'networkChanged',
        {
          network,
        },
        origin,
      );
    }
    return account;
  };

  @Reflect.metadata('SAFE', true)
  getAccounts = async ({session: {origin}}) => {
    if (!permissionService.hasPermission(origin)) {
      return [];
    }

    const _account = await walletProvider.getActiveAccount();
    const account = _account ? [_account.address] : [];
    return account;
  };

  @Reflect.metadata('SAFE', true)
  getNetwork = async () => {
    const networkType = walletProvider.getActiveNetwork();
    return NETWORK_TYPES[networkType].name;
  };

  @Reflect.metadata('APPROVAL', [
    'SwitchNetwork',
    req => {
      const network = req.data.params.network;
      if (NETWORK_TYPES[Network.MAINNET].validNames.includes(network)) {
        req.data.params.networkType = Network.MAINNET;
      } else if (NETWORK_TYPES[Network.TESTNET].validNames.includes(network)) {
        req.data.params.networkType = Network.TESTNET;
      } else {
        throw new Error('the network is invalid, supported networks');
      }

      if (req.data.params.networkType === walletProvider.getActiveNetwork()) {
        // skip approval
        return true;
      }
    },
  ])
  switchNetwork = async req => {
    const {
      data: {
        params: {networkType},
      },
    } = req;
    walletProvider.setActiveNetwork(networkType);
    return NETWORK_TYPES[networkType].name;
  };

  @Reflect.metadata('SAFE', true)
  getPublicKey = async () => {
    const account = await walletProvider.getActiveAccount();
    if (!account) return '';
    return account.pubkey;
  };

  @Reflect.metadata('SAFE', true)
  getInscriptions = async req => {
    const {
      data: {
        params: {cursor, size},
      },
    } = req;
    const account = await walletProvider.getActiveAccount();
    if (!account) return '';
    const {list, total} = await walletProvider.getInscriptions(
      account.address,
      cursor,
      size,
    );
    return {list, total};
  };

  @Reflect.metadata('SAFE', true)
  getBalance = async () => {
    const account = await walletProvider.getActiveAccount();
    if (!account) return null;
    return walletProvider.getAddressBalance(account.address);
  };

  // @Reflect.metadata('APPROVAL', ['SignTx', () => {
  //   // todo check
  // }])
  //   signTx = async () => {
  //     // todo
  //   }

  @Reflect.metadata('APPROVAL', [
    'SignPsbt',
    req => {
      const {
        data: {
          params: {toAddress, satoshis},
        },
      } = req;
    },
  ])
  sendBitcoin = async ({approvalRes: {psbtHex}}) => {
    const psbt = bitcoin.Psbt.fromHex(psbtHex);
    const tx = psbt.extractTransaction();
    const rawtx = tx.toHex();
    return await walletProvider.pushTx(rawtx);
  };

  @Reflect.metadata('APPROVAL', [
    'SignPsbt',
    req => {
      const {
        data: {
          params: {toAddress, satoshis},
        },
      } = req;
    },
  ])
  sendInscription = async ({approvalRes: {psbtHex}}) => {
    const psbt = bitcoin.Psbt.fromHex(psbtHex);
    const tx = psbt.extractTransaction();
    const rawtx = tx.toHex();
    return await walletProvider.pushTx(rawtx);
  };

  @Reflect.metadata('APPROVAL', [
    'SendTapTransfer',
    req => {
      const {
        data: {
          params: {toAddress, ticker},
        },
      } = req;
    },
  ])
  sendTapTransfer = async ({approvalRes: {psbtHex}}) => {
    const psbt = bitcoin.Psbt.fromHex(psbtHex);
    const tx = psbt.extractTransaction();
    const rawtx = tx.toHex();
    return await walletProvider.pushTx(rawtx);
  };

  @Reflect.metadata('APPROVAL', [
    'SignMessage',
    () => {
      // todo check text
    },
  ])
  signMessage = async ({
    data: {
      params: {text, type},
    },
    approvalRes,
  }) => {
    if (approvalRes?.signature) {
      return approvalRes.signature;
    }

    return walletProvider.signMessage(text);
  };

  @Reflect.metadata('APPROVAL', [
    'SignPsbt',
    req => {
      const {
        data: {
          params: {psbtHex},
        },
      } = req;
      req.data.params.psbtHex = formatPsbtHex(psbtHex);
    },
  ])
  signPsbt = async ({
    data: {
      params: {psbtHex, options},
    },
    approvalRes,
  }) => {
    if (approvalRes && approvalRes.signed == true) {
      return approvalRes.psbtHex;
    }
    const networkType = walletProvider.getActiveNetwork();
    const psbtNetwork = getBitcoinNetwork(networkType);
    const psbt = bitcoin.Psbt.fromHex(psbtHex, {network: psbtNetwork});
    const autoFinalized =
      options && options.autoFinalized == false ? false : true;
    const toSignInputs = await walletProvider.formatOptionsInputForSignings(
      psbtHex,
      options,
    );
    await walletProvider.signPsbt(psbt, toSignInputs, autoFinalized);
    return psbt.toHex();
  };

  @Reflect.metadata('SAFE', true)
  pushTx = async ({
    data: {
      params: {rawtx},
    },
  }) => {
    return await walletProvider.pushTx(rawtx);
  };

  @Reflect.metadata('SAFE', true)
  getBitcoinUtxos = async () => {
    const account = await walletProvider.getActiveAccount();
    if (!account) return [];
    const utxos = await walletProvider.getBTCUtxos(account.address);
    return utxos;
  };

  @Reflect.metadata('APPROVAL', [
    'InscribeTransfer',
    req => {
      const {
        data: {
          params: {ticker},
        },
      } = req;
      // todo
    },
  ])
  inscribeTransfer = async ({approvalRes}) => {
    return approvalRes;
  };

  @Reflect.metadata('SAFE', true)
  disconnect = async ({ session: { origin } }) => {
    return walletProvider.removeConnectedSite(origin);
  };
}

export default new InternalProvider();
