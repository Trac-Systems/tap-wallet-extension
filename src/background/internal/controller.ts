import { ethErrors } from 'eth-rpc-errors';
import { permissionService, sessionService, networkConfig, notificationService } from '../service/singleton';
import { bitcoin, getBitcoinNetwork } from '../utils';
import walletProvider from '../provider';
import { NETWORK_TYPES, Network } from '../../wallet-instance';
import { TracApiService } from '../service/trac-api.service';
import { TracApi } from '../requests/trac-api';

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
  requestAccounts = async ({ session: { origin } }) => {
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
  getAccounts = async ({ session: { origin } }) => {
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
        params: { networkType },
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
        params: { cursor, size },
      },
    } = req;
    const account = await walletProvider.getActiveAccount();
    if (!account) return '';
    const { list, total } = await walletProvider.getInscriptions(
      account.address,
      cursor,
      size,
    );
    return { list, total };
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
          params: { toAddress, satoshis },
        },
      } = req;
    },
  ])
  sendBitcoin = async ({ approvalRes: { psbtHex, spendUtxos } }) => {
    const psbt = bitcoin.Psbt.fromHex(psbtHex);
    const tx = psbt.extractTransaction(true);
    const rawtx = tx.toHex();
    return await walletProvider.pushTx(rawtx, spendUtxos);
  };

  @Reflect.metadata('APPROVAL', [
    'SignPsbt',
    req => {
      const {
        data: {
          params: { toAddress, satoshis },
        },
      } = req;
    },
  ])
  sendInscription = async ({ approvalRes: { psbtHex, spendUtxos } }) => {
    const psbt = bitcoin.Psbt.fromHex(psbtHex);
    const tx = psbt.extractTransaction(true);
    const rawtx = tx.toHex();
    return await walletProvider.pushTx(rawtx, spendUtxos);
  };

  @Reflect.metadata('APPROVAL', [
    'SendTapTransfer',
    req => {
      const {
        data: {
          params: { toAddress, ticker },
        },
      } = req;
    },
  ])
  sendTapTransfer = async ({ approvalRes: { psbtHex } }) => {
    const psbt = bitcoin.Psbt.fromHex(psbtHex);
    const tx = psbt.extractTransaction(true);
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
      params: { text, type },
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
          params: { psbtHex },
        },
      } = req;
      req.data.params.psbtHex = formatPsbtHex(psbtHex);
    },
  ])
  signPsbt = async ({
    data: {
      params: { psbtHex, options },
    },
    approvalRes,
  }) => {
    if (approvalRes && approvalRes.signed == true) {
      return approvalRes.psbtHex;
    }
    const networkType = walletProvider.getActiveNetwork();
    const psbtNetwork = getBitcoinNetwork(networkType);
    const psbt = bitcoin.Psbt.fromHex(psbtHex, { network: psbtNetwork });
    const autoFinalized =
      options && options.autoFinalized == false ? false : true;
    const toSignInputs = await walletProvider.formatOptionsInputForSignings(
      psbtHex,
      options,
    );
    await walletProvider.signPsbt(psbt, toSignInputs, autoFinalized);
    return psbt.toHex();
  };

  @Reflect.metadata('APPROVAL', [
    'MultiSignPsbt',
    req => {
      const {
        data: {
          params: { psbtHexs, options },
        },
      } = req;
      req.data.params.psbtHexs = psbtHexs.map(psbtHex =>
        formatPsbtHex(psbtHex),
      );
    },
  ])
  multiSignPsbt = async ({
    data: {
      params: { psbtHexs, options },
    },
  }) => {
    const account = walletProvider.getActiveAccount();
    if (!account) throw null;
    const networkType = walletProvider.getActiveNetwork();
    const psbtNetwork = getBitcoinNetwork(networkType);
    const result: string[] = [];
    const optionsLength = options ? options.length : 0;

    for (let i = 0; i < psbtHexs.length; i++) {
      const psbt = bitcoin.Psbt.fromHex(psbtHexs[i], { network: psbtNetwork });
      const option = optionsLength > i ? options[i] : {}; // Use empty object if index is out of bounds
      const autoFinalized = option.autoFinalized !== false; // Default to true
      const toSignInputs = await walletProvider.formatOptionsInputForSignings(
        psbtHexs[i],
        option,
      );
      await walletProvider.signPsbt(psbt, toSignInputs, autoFinalized);
      result.push(psbt.toHex());
    }
    return result;
  };

  @Reflect.metadata('SAFE', true)
  pushTx = async ({
    data: {
      params: { rawtx },
    },
  }) => {
    return await walletProvider.pushTx(rawtx);
  };

  @Reflect.metadata('SAFE', true)
  pushPsbt = async ({
    data: {
      params: { psbtHex },
    },
  }) => {
    const hexData = formatPsbtHex(psbtHex);
    const psbt = bitcoin.Psbt.fromHex(hexData);
    const tx = psbt.extractTransaction(true);
    const rawtx = tx.toHex();
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
          params: { ticker, addr, dta },
        },
      } = req;
      // todo
    },
  ])
  inscribeTransfer = async ({ approvalRes }) => {
    console.log('inscribeTransfer', approvalRes);
    const account = await walletProvider.getActiveAccount();
    if (!account) return [];
    return approvalRes;
  };

  @Reflect.metadata('SAFE', true)
  hasActiveAuthority = async () => {
    const account = await walletProvider.getActiveAccount();
    if (!account) return false;
    const currentAuthority = await walletProvider.getCurrentAuthority(
      account?.address,
    );
    if (!currentAuthority) return false;
    return true;
  };

  @Reflect.metadata('APPROVAL', ['SingleTxTransfer'])
  singleTxTransfer = async ({ approvalRes }) => {
    return approvalRes;
  };

  @Reflect.metadata('SAFE', true)
  disconnect = async ({ session: { origin } }) => {
    return walletProvider.removeConnectedSite(origin);
  };

  // TRAC Network API methods
  @Reflect.metadata('APPROVAL', ['TracConnect'])
  tracRequestAccount = async ({ session: { origin, name, icon }, approvalRes }) => {
    // If we just came from the approval popup
    if (approvalRes) {
      permissionService.addTracConnection(origin, name, icon);
      return approvalRes; // The popup returns the address
    }

    // This part runs if the popup was skipped (should not happen with standard metadata)
    const _account = walletProvider.getActiveAccount();
    const _wallet = walletProvider.getActiveWallet();

    if (!_account || !_wallet) {
      throw new Error('No active account or wallet found.');
    }

    const tracAddress = walletProvider.getTracAddress(_wallet.index, _account.index ?? 0);
    if (!tracAddress) {
      throw new Error('No TRAC address found for this account.');
    }

    return tracAddress;
  };

  @Reflect.metadata('SAFE', true)
  tracGetAddress = async ({ session: { origin } }) => {
    // Check if origin has TRAC permission
    if (!permissionService.hasTracPermission(origin)) {
      throw new Error('Not connected. Please call requestAccount() first.');
    }

    // Get active wallet and account to retrieve TRAC address
    const _account = walletProvider.getActiveAccount();
    const _wallet = walletProvider.getActiveWallet();

    if (!_account || !_wallet) {
      throw new Error('No active account or wallet found.');
    }

    // Get TRAC address for the active account
    const accountIndex = _account.index ?? 0;
    const tracAddress = walletProvider.getTracAddress(_wallet.index, accountIndex);

    if (!tracAddress) {
      throw new Error('No TRAC address found for this account.');
    }

    return tracAddress;
  };

  @Reflect.metadata('SAFE', true)
  tracGetBalance = async ({ session: { origin } }) => {
    // Check if origin has TRAC permission
    if (!permissionService.hasTracPermission(origin)) {
      throw new Error('Not connected. Please call requestAccount() first.');
    }

    // Get active wallet and account to retrieve TRAC address
    const _account = walletProvider.getActiveAccount();
    const _wallet = walletProvider.getActiveWallet();

    if (!_account || !_wallet) {
      throw new Error('No active account or wallet found.');
    }

    // Get TRAC address for the active account
    const accountIndex = _account.index ?? 0;
    const tracAddress = walletProvider.getTracAddress(_wallet.index, accountIndex);

    if (!tracAddress) {
      throw new Error('No TRAC address found for this account.');
    }

    // Fetch balance from TRAC API
    const balance = await walletProvider.getTracBalance(tracAddress);
    return balance;
  };

  @Reflect.metadata('SAFE', true)
  tracGetPublicKey = async ({ session: { origin } }) => {
    // Check if origin has TRAC permission
    if (!permissionService.hasTracPermission(origin)) {
      throw new Error('Not connected. Please call requestAccount() first.');
    }

    // Get active wallet and account
    const _account = walletProvider.getActiveAccount();
    const _wallet = walletProvider.getActiveWallet();

    if (!_account || !_wallet) {
      throw new Error('No active account or wallet found.');
    }

    // Get mnemonic (unlocked)
    const _walletObj = await walletProvider.getActiveWallet();
    const mnemonicData = await walletProvider.getMnemonicsUnlocked(_walletObj);
    const mnemonic = mnemonicData.mnemonic;

    // Generate keypair to get public key
    const keypair = await TracApiService.generateKeypairFromMnemonic(
      mnemonic,
      _account.index ?? 0
    );

    // Convert publicKey to hex string
    let result: string;
    if (typeof keypair.publicKey === 'string') {
      result = keypair.publicKey;
    } else if (keypair.publicKey) {
      // Convert Buffer/Uint8Array to hex string
      result = Buffer.from(keypair.publicKey).toString('hex');
    } else {
      result = '';
    }
    
    return result;
  };

  @Reflect.metadata('APPROVAL', ['TracSignMessage'])
  tracSignMessage = async ({ session: { origin }, data: { params }, approvalRes }) => {
    // If user approved in popup
    if (approvalRes && approvalRes.approved) {
      const { message } = params;

      // Check permission
      if (!permissionService.hasTracPermission(origin)) {
        throw new Error('Not connected. Please call requestAccount() first.');
      }

      // Validate message
      if (!message || typeof message !== 'string') {
        throw new Error('Invalid message');
      }

      // Limit message length (10KB)
      if (message.length > 10000) {
        throw new Error('Message too long (max 10KB)');
      }

      // Get account
      const _account = walletProvider.getActiveAccount();
      const _wallet = walletProvider.getActiveWallet();

      if (!_account || !_wallet) {
        throw new Error('No active account or wallet found.');
      }

      // Get mnemonic
      const _walletObj = await walletProvider.getActiveWallet();
      const mnemonicData = await walletProvider.getMnemonicsUnlocked(_walletObj);
      const mnemonic = mnemonicData.mnemonic;

      // Generate keypair
      const keypair = await TracApiService.generateKeypairFromMnemonic(
        mnemonic,
        _account.index ?? 0
      );

      // Sign message
      const signature = await TracApiService.signMessage(message, keypair.secretKey);

      // Convert publicKey to hex string
      let publicKeyHex: string;
      if (typeof keypair.publicKey === 'string') {
        publicKeyHex = keypair.publicKey;
      } else if (keypair.publicKey) {
        publicKeyHex = Buffer.from(keypair.publicKey).toString('hex');
      } else {
        publicKeyHex = '';
      }

      // Return signature + metadata
      const result = {
        signature: signature,
        publicKey: publicKeyHex,
        address: keypair.address
      };
      
      return result;
    }
    // Return params to trigger popup
    throw new Error('User rejected signature request');
  };

  @Reflect.metadata('APPROVAL', ['SendTNKApproval', (request) => {
    // Resolve 'from' before showing approval
    const { from, to, amount } = request.data.params;

    if (!to || typeof to !== 'string') {
      return false; // Will trigger approval and fail with validation error
    }

    if (!amount || (typeof amount !== 'string' && typeof amount !== 'number')) {
      return false;
    }

    // Resolve from address
    let fromAddress: string;
    if (from && typeof from === 'string') {
      const indices = walletProvider.getIndicesByTracAddress(from);
      if (indices) {
        fromAddress = from;
      } else {
        return false; // Address not found
      }
    } else {
      const _account = walletProvider.getActiveAccount();
      const _wallet = walletProvider.getActiveWallet();
      if (_account && _wallet) {
        const addr = walletProvider.getTracAddress(_wallet.index, _account.index ?? 0);
        if (addr) {
          fromAddress = addr;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    // Update params with resolved from address
    request.data.params.from = fromAddress;
    return false; // Continue to show approval
  }])
  tracSendTNK = async ({ session: { origin }, data: { params }, approvalRes }) => {
    if (approvalRes) {
      return approvalRes;
    }

    if (!permissionService.hasTracPermission(origin)) {
      throw new Error('Not connected. Please call requestAccount() first.');
    }

    const { from, to, amount } = params;

    return { from, to, amount: amount.toString() };
  };

  // Advanced transaction methods
  @Reflect.metadata('SAFE', true)
  tracBuildTx = async ({ session: { origin, name, icon }, data: { params } }) => {
    // Check if origin has TRAC permission
    if (!permissionService.hasTracPermission(origin)) {
      throw new Error('Not connected. Please call requestAccount() first.');
    }

    const { from, to, amount } = params;

    // Validate params
    if (!to || typeof to !== 'string') {
      throw new Error('Invalid recipient address.');
    }

    if (!amount || (typeof amount !== 'string' && typeof amount !== 'number')) {
      throw new Error('Invalid amount.');
    }

    // Resolve 'from' address
    let fromAddress: string;

    if (from && typeof from === 'string') {
      const indices = walletProvider.getIndicesByTracAddress(from);
      if (!indices) {
        throw new Error(`Address ${from} not found in wallet.`);
      }
      fromAddress = from;
    } else {
      const _account = walletProvider.getActiveAccount();
      const _wallet = walletProvider.getActiveWallet();

      if (!_account || !_wallet) {
        throw new Error('No active account or wallet found.');
      }

      const addr = walletProvider.getTracAddress(_wallet.index, _account.index ?? 0);
      if (!addr) {
        throw new Error('No TRAC address found for active account.');
      }
      fromAddress = addr;
    }

    // Convert amount to hex
    const amountHex = TracApiService.amountToHex(amount.toString());

    // Get validity from TRAC API
    const network = networkConfig.getActiveNetwork();
    const validity = await TracApi.fetchTransactionValidity(network);

    // Pre-build transaction to get all details (including fee)
    const networkId = network === Network.MAINNET ? 918 : 9180;
    const txData = await TracApiService.preBuildTransaction(
      { from: fromAddress, to, amountHex, validityHex: validity },
      networkId
    );

    // Manually request approval with full transaction details
    const approvalRes = await notificationService.requestApproval(
      {
        approvalComponent: 'SignTracTxApproval',
        params: {
          session: { origin, name, icon },
          data: {
            from: fromAddress,
            to,
            amount: amountHex,
            amountDisplay: amount.toString(),
            validity,
            nonce: txData.nonce ? Buffer.from(txData.nonce).toString('hex') : null,
            hash: txData.hash ? Buffer.from(txData.hash).toString('hex') : null,
            networkId,
          },
          _builtTxData: txData,
        },
        origin,
      },
      { height: 600 },
    );

    // User approved, now sign
    if (!approvalRes || !approvalRes.approved) {
      throw new Error('User rejected transaction signing');
    }

    const { _builtTxData } = approvalRes;

    if (!_builtTxData) {
      throw new Error('Transaction data not found');
    }

    // Convert buffer fields back to Buffers (they were serialized through approval flow)
    if (_builtTxData.hash && !(_builtTxData.hash instanceof Buffer)) {
      if (typeof _builtTxData.hash === 'string') {
        _builtTxData.hash = Buffer.from(_builtTxData.hash, 'hex');
      } else if (typeof _builtTxData.hash === 'object') {
        _builtTxData.hash = Buffer.from(Object.values(_builtTxData.hash));
      }
    }

    if (_builtTxData.nonce && !(_builtTxData.nonce instanceof Buffer)) {
      if (typeof _builtTxData.nonce === 'string') {
        _builtTxData.nonce = Buffer.from(_builtTxData.nonce, 'hex');
      } else if (typeof _builtTxData.nonce === 'object') {
        _builtTxData.nonce = Buffer.from(Object.values(_builtTxData.nonce));
      }
    }

    // Get keypair for signing
    const indices = walletProvider.getIndicesByTracAddress(fromAddress);
    if (!indices) {
      throw new Error(`Address ${fromAddress} not found in wallet.`);
    }

    const wallets = walletProvider.getWallets();
    const _wallet = wallets.find(w => w.index === indices.walletIndex);
    if (!_wallet) {
      throw new Error('Wallet not found');
    }

    const mnemonicData = await walletProvider.getMnemonicsUnlocked(_wallet);
    const mnemonic = mnemonicData.mnemonic;

    const keypair = await TracApiService.generateKeypairFromMnemonic(
      mnemonic,
      indices.accountIndex
    );

    // Sign the pre-built transaction
    const secretBuffer = TracApiService.toSecretBuffer(keypair.secretKey);
    const txPayload = TracApiService.buildTransaction(_builtTxData, secretBuffer);

    // Validate txPayload
    if (!txPayload || typeof txPayload !== 'string') {
      throw new Error('Failed to build transaction: invalid payload');
    }

    // Verify it's valid base64
    try {
      atob(txPayload);
    } catch (e) {
      throw new Error('Failed to build transaction: invalid payload format');
    }

    return txPayload;
  };

  @Reflect.metadata('APPROVAL', ['SignContractTxApproval'])
  tracSignTx = async ({ session: { origin }, data: { params }, approvalRes }) => {
    if (approvalRes && approvalRes.approved) {
      const { contractTx } = params;

      if (!contractTx || typeof contractTx !== 'object') {
        throw new Error('Invalid contract transaction data');
      }

      if (!permissionService.hasTracPermission(origin)) {
        throw new Error('Not connected. Please call requestAccount() first.');
      }

      const { requester, tx: txData } = contractTx;

      if (!requester || !txData) {
        throw new Error('Missing requester or tx data in walletRequest');
      }

      const { prepared_command, nonce, context } = txData;

      if (!prepared_command || typeof prepared_command !== 'object') {
        throw new Error('Missing or invalid prepared_command');
      }
      if (!nonce || typeof nonce !== 'string') {
        throw new Error('Missing or invalid nonce');
      }
      if (!context || typeof context !== 'object') {
        throw new Error('Missing or invalid context');
      }

      const _account = walletProvider.getActiveAccount();
      const _wallet = walletProvider.getActiveWallet();

      if (!_account || !_wallet) {
        throw new Error('No active account found');
      }

      const accountIndex = _account.index ?? 0;
      const mnemonicData = await walletProvider.getMnemonicsUnlocked(_wallet);
      const keypair = await TracApiService.generateKeypairFromMnemonic(
        mnemonicData.mnemonic,
        accountIndex
      );

      try {
        const networkId = context.networkId;
        const txv = context.txv;
        const mbs = context.mbs;
        const bs = context.bs;
        const iw = context.iw;

        if (!networkId || !txv || !mbs || !iw) {
          throw new Error('Invalid context - missing required fields');
        }

        const commandJson = JSON.stringify(prepared_command);
        const commandHash = await TracApiService.blake3HashFromString(commandJson);

        const bsBuffer = bs ? Buffer.from(bs, 'hex') : Buffer.alloc(32).fill(0);
        const serialized = TracApiService.serialize(
          networkId,
          Buffer.from(txv, 'hex'),
          Buffer.from(iw, 'hex'),
          commandHash,
          bsBuffer,
          Buffer.from(mbs, 'hex'),
          Buffer.from(nonce, 'hex'),
          12
        );

        const txHash = await TracApiService.blake3Hash(serialized);
        const secretBuffer = TracApiService.toSecretBuffer(keypair.secretKey);
        const signature = TracApiService.signHash(txHash, secretBuffer);

        return {
          tx: txHash.toString('hex'),
          signature: signature.toString('hex')
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to sign contract transaction: ${errorMessage}`);
      }
    }

    throw new Error('User rejected contract transaction signing');
  };

  @Reflect.metadata('SAFE', true)
  tracPushTx = async ({ session: { origin }, data: { params } }) => {
    if (!permissionService.hasTracPermission(origin)) {
      throw new Error('Not connected. Please call requestAccount() first.');
    }

    const { txPayload } = params;

    if (!txPayload || typeof txPayload !== 'string') {
      throw new Error('Invalid transaction payload');
    }

    const network = networkConfig.getActiveNetwork();
    const response = await TracApi.broadcastTransaction(txPayload, network);

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.success) {
      throw new Error('Transaction broadcast failed');
    }

    const txHash = response.txid || TracApiService.decodePayload(txPayload);

    return {
      txHash,
      success: true
    };
  };

}

export default new InternalProvider();
