import {
  walletService,
  authService,
  accountConfig,
  walletConfig,
  networkConfig,
  appConfig,
  notificationService,
  permissionService,
  sessionService,
} from './service/singleton';
import * as hdkey from 'hdkey';
import * as bip39 from 'bip39';
import {
  ACCOUNT_TYPE_TEXT,
  ADDRESS_TYPES,
  WALLET_TYPE,
} from '../wallet-instance/constant';
import {
  ECPair,
  bitcoin,
  deriveAddressFromPublicKey,
  sendBTC,
  sendInscription,
  sendInscriptions,
  getBitcoinNetwork,
  extractAddressFromScript,
} from './utils';
import {IResponseAddressBalance, PaidApi} from './requests/paid-api';
import {mempoolApi, paidApi, tapApi, usdApi} from './requests';
import {
  AddressType,
  IDisplayAccount,
  IWalletDisplayUI,
  Network,
  TransactionSigningOptions,
  InputForSigning,
  UnspentOutput,
  WalletDisplay,
  ExtractPsbt,
  Inscription,
} from '../wallet-instance';
import {toXOnly} from 'bitcoinjs-lib/src/psbt/bip371';
import {convertScriptToAddress} from '../shared/utils/btc-helper';
import {MempoolApi} from './requests/mempool-api';
import {TapApi} from './requests/tap-api';
import {ConnectedSite} from './service/permission.service';
import {isEmpty} from 'lodash';
import {Psbt} from 'bitcoinjs-lib';
export interface IDerivationPathOption {
  label: string;
  derivationPath: string;
  addressType: AddressType;
}

export class Provider {
  paidApi: PaidApi = paidApi;
  mempoolApi: MempoolApi = mempoolApi;
  tapApi: TapApi = tapApi;

  unlockApp = async (pin: string) => {
    await walletService.unlockWallet(pin);
  };

  lockWallet = async () => {
    await walletService.setLockedWallet();
    authService.lockWallet();
    sessionService.broadcastEvent('accountsChanged', []);
    sessionService.broadcastEvent('lock');
  };

  register = (pin: string) => {
    authService.register(pin);
  };

  isRegistered = (): boolean => {
    return authService.isRegistered();
  };

  isUnlocked = () => authService.memStore.getState().isUnlocked;

  hasWallet = (): boolean => {
    return walletService.hasWallet();
  };

  isReady = () => {
    if (accountConfig.store) {
      return true;
    } else {
      return false;
    }
  };

  generateMnemonic = (): string => {
    return walletService.generateMnemonic();
  };
  private _genDefaultAccountName = (type: string, accountIndex: number) => {
    if (type === 'HD Wallet') {
      return `Account ${accountIndex + 1}`;
    }
  };

  _getWalletDisplayUI = (walletDisplay: IWalletDisplayUI, index: number) => {
    const networkType = networkConfig.getActiveNetwork();
    const addressType = walletDisplay.addressType;
    const key = 'wallet_' + index;
    const type = walletDisplay.type;
    const accounts: IDisplayAccount[] = [];

    for (let j = 0; j < walletDisplay.accounts.length; j++) {
      const {pubkey} = walletDisplay.accounts[j];
      const address = deriveAddressFromPublicKey(
        pubkey,
        addressType,
        networkType,
      );
      const accountKey = key + '#' + j;
      const defaultName = this._genDefaultAccountName(type, j);
      const name = accountConfig.getAccountName(accountKey, defaultName);
      accounts.push({
        type,
        pubkey,
        address,
        name,
        index: j,
        key: accountKey,
      });
    }
    const derivationPath =
      type === WALLET_TYPE.HdWallet ? walletDisplay.wallet.derivationPath : '';

    const name = walletConfig.getWalletName(key, `${type} #${index + 1}`);
    const wallet: WalletDisplay = {
      index,
      key,
      type,
      addressType,
      accounts,
      name,
      derivationPath,
    };
    return wallet;
  };

  setActiveNetwork = (network: Network) => {
    networkConfig.setActiveNetwork(network);
    paidApi.changeNetwork();
    this.mempoolApi.changeNetwork(network);
    this.tapApi.changeNetwork(network);
    const activeAccount = this.getActiveAccount();
    const wallet = this.getActiveWallet();
    if (!wallet) {
      throw new Error('no active wallet');
    }
    this.setActiveWallet(wallet, activeAccount?.index);
  };

  getActiveNetwork = () => {
    return networkConfig.getActiveNetwork();
  };

  createWalletFromMnemonic = async (
    mnemonic: string,
    derivationPath: string,
    passphrase: string,
    addressType: AddressType,
    accountNum: number,
  ) => {
    const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);
    const hdWallet = hdkey.fromMasterSeed(seed);
    const originWallet = await walletService.createWalletFromMnemonic(
      mnemonic,
      derivationPath,
      passphrase,
      addressType,
      accountNum,
      hdWallet,
    );
    const walletDataForUI = walletService.getWalletDataForUI(
      originWallet,
      addressType,
      walletService.wallets.length - 1,
    );
    const wallet = this._getWalletDisplayUI(
      walletDataForUI,
      walletService.wallets.length - 1,
    );
    this.setActiveWallet(wallet);
  };

  previewAllAddressesFromMnemonics = async (
    mnemonic: string,
    passphrase: string,
    derivationPathOptions: IDerivationPathOption[],
    customHdPath: string,
    accountCount = 1,
  ) => {
    const activeIndexes: number[] = [];
    const result: WalletDisplay[] = [];
    for (let i = 0; i < accountCount; i++) {
      activeIndexes.push(i);
    }
    const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);
    const hdWallet = hdkey.fromMasterSeed(seed);

    for (let i = 0; i < derivationPathOptions.length; i++) {
      const originWallet = await walletService.createTempWallet('HD Wallet', {
        mnemonic,
        activeIndexes,
        derivationPath: customHdPath || derivationPathOptions[i].derivationPath,
        passphrase,
        hdWallet,
      });
      const walletDataForUI = walletService.getWalletDataForUI(
        originWallet,
        derivationPathOptions[i].addressType,
        -1,
      );
      result.push(this._getWalletDisplayUI(walletDataForUI, -1));
    }
    return result;
  };

  createWalletFromPrivateKey = async (
    privateKey: string,
    addressType: AddressType,
  ) => {
    const originWallet = await walletService.createWalletFromPrivateKey(
      privateKey,
      addressType,
    );

    const walletDataForUI = walletService.getWalletDataForUI(
      originWallet,
      addressType,
      walletService.wallets.length - 1,
    );
    const wallet = this._getWalletDisplayUI(
      walletDataForUI,
      walletService.wallets.length - 1,
    );
    this.setActiveWallet(wallet);
  };

  previewAddressFromPrivateKey = async (
    privateKey: string,
    addressType: AddressType,
  ) => {
    const originWallet = await walletService.createTempWallet('Single Wallet', {
      privateKeys: [privateKey],
    });
    const walletDataForUI = walletService.getWalletDataForUI(
      originWallet,
      addressType,
      -1,
    );
    return this._getWalletDisplayUI(walletDataForUI, -1);
  };

  removeWallet = async (wallet: WalletDisplay) => {
    await walletService.removeWallet(wallet.index);
    const wallets = this.getWallets();
    const nextWallet = wallets[wallets.length - 1];
    if (nextWallet && nextWallet.accounts[0]) {
      this.setActiveWallet(nextWallet);
      return nextWallet;
    }
  };

  setActiveWallet = (wallet: WalletDisplay, accountIndex = 0) => {
    walletConfig.setActiveWalletIndex(wallet.index);
    accountConfig.setActiveAccount(wallet.accounts[accountIndex]);
  };

  getActiveWallet = () => {
    let activeWalletIndex = walletConfig.getActiveWalletIndex();
    const displayedWallets = walletService.getAllWalletsDataForUI();

    if (activeWalletIndex === undefined) {
      const activeAccount = accountConfig.getActiveAccount();
      for (let i = 0; i < displayedWallets.length; i++) {
        if (displayedWallets[i].type !== activeAccount?.type) {
          continue;
        }
        const found = displayedWallets[i].accounts.find(
          v => v.pubkey === activeAccount?.pubkey,
        );
        if (found) {
          activeWalletIndex = i;
          break;
        }
      }
      if (activeWalletIndex === undefined) {
        activeWalletIndex = 0;
      }
    }

    const displayedWallet = displayedWallets.find((wallet: any) => {
      return activeWalletIndex === wallet.index;
    });
    if (!displayedWallet) {
      return null;
    }
    return this._getWalletDisplayUI(displayedWallet, activeWalletIndex);
  };

  getWallets = (): WalletDisplay[] => {
    const displayedWallets = walletService.getAllWalletsDataForUI();
    const wallets: WalletDisplay[] = [];
    for (let index = 0; index < displayedWallets.length; index++) {
      const displayedWallet = displayedWallets[index];
      {
        const wallet = this._getWalletDisplayUI(
          displayedWallet,
          displayedWallet.index,
        );
        wallets.push(wallet);
      }
    }
    return wallets;
  };

  getMnemonics = async (pin: string, wallet: WalletDisplay) => {
    await authService.verifyPassword(pin);
    const originWallet = walletService.wallets[wallet.index];
    const serialized = await originWallet.serialize();
    return {
      mnemonic: serialized.mnemonic,
      derivationPath: serialized.derivationPath,
      passphrase: serialized.passphrase,
    };
  };

  getPrivateKey = async (
    pin: string,
    {pubkey, type}: {pubkey: string; type: string},
  ) => {
    await authService.verifyPassword(pin);
    const wallet = await walletService.getWalletForBackground(pubkey, type);
    if (!wallet) {
      return null;
    }
    const privateKey = await wallet.exportPrivateKey(pubkey);
    const networkType = this.getActiveNetwork();
    const network = getBitcoinNetwork(networkType);
    const hex = privateKey;
    const wif = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'), {
      network,
    }).toWIF();
    return {
      hex,
      wif,
    };
  };

  verifyPassword = async (pin: string) => await authService.verifyPassword(pin);

  setWalletName = (wallet: WalletDisplay, name: string) => {
    walletConfig.setWalletName(wallet.key, name);
    return Object.assign({}, wallet, {name});
  };

  getAddressBalance = async (address: string) => {
    return this.paidApi.getAddressBalance(address);
  };

  getAddressesBalance = async (addresses: string[]) => {
    return await Promise.all(
      addresses.map(address => this.getAddressBalance(address)),
    );
  };
  getAddressCacheBalance = async (
    address: string | undefined,
  ): Promise<IResponseAddressBalance> => {
    const defaultBalance: IResponseAddressBalance = {
      address: '',
      satoshi: 0,
      pendingSatoshi: 0,
      utxoCount: 0,
      btcSatoshi: 0,
      btcPendingSatoshi: 0,
      btcUtxoCount: 0,
      inscriptionSatoshi: 0,
      inscriptionPendingSatoshi: 0,
      inscriptionUtxoCount: 0,
    };
    if (!address) {
      return defaultBalance;
    }
    return (await paidApi.getAddressBalance(address)) || defaultBalance;
  };

  getAllAddresses = (wallet: WalletDisplay, index: number) => {
    const networkType = this.getActiveNetwork();
    const addresses: {[key: string]: {addressType: AddressType}} = {};
    const _wallet = walletService.wallets[wallet.index];
    if (wallet.type === WALLET_TYPE.HdWallet) {
      const pathPubkey: {[path: string]: string} = {};

      for (const k in ADDRESS_TYPES) {
        const v = ADDRESS_TYPES[k];
        if (v.displayIndex >= 0) {
          let pubkey = pathPubkey[v.derivationPath];
          if (!pubkey && _wallet.getAccountByDerivationPath) {
            pubkey = _wallet.getAccountByDerivationPath(
              v.derivationPath,
              index,
            );
          }
          const address = deriveAddressFromPublicKey(
            pubkey,
            v.value,
            networkType,
          );
          addresses[address] = {addressType: v.value};
        }
      }
    } else {
      for (const k in ADDRESS_TYPES) {
        const v = ADDRESS_TYPES[k];
        if (v.displayIndex >= 0) {
          const pubkey = wallet.accounts[index]?.pubkey;
          const address = deriveAddressFromPublicKey(
            pubkey,
            v.value,
            networkType,
          );
          addresses[address] = {addressType: v.value};
        }
      }
    }
    return addresses;
  };

  changeAddressType = async (addressType: AddressType) => {
    const activeAccount = this.getActiveAccount();
    const activeWalletIndex = walletConfig.getActiveWalletIndex();
    await walletService.changeAddressType(activeWalletIndex, addressType);
    const wallet = this.getActiveWallet();
    if (!wallet) {
      throw new Error('no active wallet');
    }
    this.setActiveWallet(wallet, activeAccount?.index);
  };

  getActiveAccount = () => {
    return accountConfig.getActiveAccount();
  };

  getAccounts = () => {
    const wallets = this.getWallets();
    const accounts: any[] = wallets.reduce<IDisplayAccount[]>(
      (pre, cur) => pre.concat(cur.accounts),
      [],
    );
    return accounts;
  };

  setAccountName = (account: IDisplayAccount, name: string) => {
    accountConfig.setAccountName(account.key, name);
    return Object.assign({}, account, {name});
  };

  pushTx = async (rawTx: string, spendUtoxs?: UnspentOutput[]) => {
    if (spendUtoxs) {
      const activeAccount = this.getActiveAccount();
      const accountSpendableKey = `${activeAccount.key}_${activeAccount.address}`;

      accountConfig.deleteSpendableUtxos(accountSpendableKey, spendUtoxs);
    }
    return await this.mempoolApi.pushTx(rawTx);
  };

  getRecommendFee = () => {
    return this.mempoolApi.getRecommendFee();
  };

  getBTCUtxos = async (address: string, ignoreAsset?: string[]) => {
    const utxosWithoutInscription = await this.paidApi.getAllBTCUtxo(address);
    const account = this.getActiveAccount();
    const spendableInscriptions =
      (await this.getAccountSpendableInscriptions(account)) || [];
    const ignoreAssetMap: {[key: string]: boolean} = {};
    ignoreAsset?.forEach(inscriptionId => {
      ignoreAssetMap[inscriptionId] = true;
    });
    const spendableUtxoInscriptions = spendableInscriptions?.reduce(
      (acc, v) => {
        if (!ignoreAssetMap[v.inscriptionId] && v.utxoInfo.satoshi > 0) {
          acc.push(v.utxoInfo);
        }
        return acc;
      },
      [],
    );
    if (spendableUtxoInscriptions.length > 0) {
      return [...utxosWithoutInscription, ...spendableUtxoInscriptions];
    }
    return utxosWithoutInscription;
  };

  sendBTC = async ({
    to,
    amount,
    feeRate,
    enableRBF,
    btcUtxos,
  }: {
    to: string;
    amount: number;
    feeRate: number;
    enableRBF: boolean;
    btcUtxos?: UnspentOutput[];
  }) => {
    const account = accountConfig.getActiveAccount();
    if (!account) {
      throw new Error('no active account');
    }
    const activeWallet = this.getActiveWallet();

    const networkType = this.getActiveNetwork();
    if (!btcUtxos) {
      btcUtxos = await this.getBTCUtxos(account.address);
    }

    if (!btcUtxos || btcUtxos?.length === 0) {
      throw new Error('Insufficient balance.');
    }
    const {psbt, inputForSigns, outputs, inputs} = await sendBTC({
      btcUtxos: btcUtxos,
      tos: [{address: to, satoshis: amount}],
      networkType,
      fromAddress: account.address,
      addressType: activeWallet?.addressType,
      pubkey: account.pubkey,
      feeRate,
      enableRBF,
    });
    this.setPsbtSignNonSegwitEnable(psbt, true);
    await this.signPsbt(psbt, inputForSigns, true);
    this.setPsbtSignNonSegwitEnable(psbt, false);
    return {psbtHex: psbt.toHex(), inputs, outputs, inputForSigns};
  };

  sendOrdinalsInscription = async ({
    to,
    inscriptionId,
    feeRate,
    outputValue,
    enableRBF,
    btcUtxos,
  }: {
    to: string;
    inscriptionId: string;
    feeRate: number;
    outputValue?: number;
    enableRBF: boolean;
    btcUtxos?: UnspentOutput[];
  }) => {
    const account = accountConfig.getActiveAccount();
    if (!account) {
      throw new Error('no active account');
    }

    const wallet = this.getActiveWallet();

    const networkType = networkConfig.getActiveNetwork();

    const utxos = await this.paidApi.getInscriptionUtxoByInscriptions(
      account.address,
      [inscriptionId],
    );
    const assetUtxo = utxos[0];
    if (!assetUtxo) {
      throw new Error('UTXO not found.');
    }

    if (!btcUtxos) {
      btcUtxos = await this.getBTCUtxos(account.address, [inscriptionId]);
    }

    if (btcUtxos.length === 0) {
      throw new Error('Insufficient balance.');
    }

    const {psbt, inputForSigns, inputs, outputs} = await sendInscription({
      assetUtxo,
      btcUtxos,
      toAddress: to,
      networkType,
      fromAddress: account.address,
      addressType: wallet?.addressType,
      pubkey: account.pubkey,
      feeRate,
      outputValue: outputValue || assetUtxo.satoshi,
      enableRBF,
    });
    this.setPsbtSignNonSegwitEnable(psbt, true);
    await this.signPsbt(psbt, inputForSigns, true);
    this.setPsbtSignNonSegwitEnable(psbt, false);
    return {psbtHex: psbt.toHex(), inputs, outputs, inputForSigns};
  };

  sendOrdinalsInscriptions = async ({
    to,
    inscriptionIds,
    feeRate,
    enableRBF,
    btcUtxos,
  }: {
    to: string;
    inscriptionIds: string[];
    feeRate: number;
    enableRBF: boolean;
    btcUtxos?: UnspentOutput[];
  }) => {
    const account = accountConfig.getActiveAccount();
    if (!account) {
      throw new Error('no active account');
    }

    const wallet = this.getActiveWallet();

    const networkType = networkConfig.getActiveNetwork();

    const assetUtxos = await this.paidApi.getInscriptionUtxoByInscriptions(
      account.address,
      inscriptionIds,
    );
    if (isEmpty(assetUtxos)) {
      throw new Error('UTXO not found.');
    }

    if (assetUtxos.find(v => v.inscriptions?.length > 1)) {
      throw new Error(
        'Multiple inscriptions are mixed together. Please split them first.',
      );
    }

    if (!btcUtxos) {
      btcUtxos = await this.getBTCUtxos(account.address, inscriptionIds);
    }

    if (btcUtxos.length === 0) {
      throw new Error('Insufficient balance.');
    }

    const {psbt, inputForSigns, inputs, outputs} = await sendInscriptions({
      assetUtxos,
      btcUtxos,
      toAddress: to,
      networkType,
      fromAddress: account.address,
      addressType: wallet?.addressType,
      pubkey: account.pubkey,
      feeRate,
      enableRBF,
    });
    this.setPsbtSignNonSegwitEnable(psbt, true);
    await this.signPsbt(psbt, inputForSigns, true);
    this.setPsbtSignNonSegwitEnable(psbt, false);

    return {psbtHex: psbt.toHex(), inputs, outputs, inputForSigns};
  };

  setPsbtSignNonSegwitEnable = (psbt: bitcoin.Psbt, enable: boolean) => {
    (psbt as any).__CACHE.__UNSAFE_SIGN_NONSEGWIT = enable;
  };

  getEnableSignData = () => {
    return appConfig.getEnableSignData();
  };

  setEnableSignData = (enable: boolean) => {
    return appConfig.setEnableSignData(enable);
  };

  formatOptionsInputForSignings = async (
    _psbt: string | bitcoin.Psbt,
    options?: TransactionSigningOptions,
  ) => {
    const account = this.getActiveAccount();
    if (!account) {
      throw null;
    }

    let inputForSigns: InputForSigning[] = [];
    if (options && options.inputForSigns) {
      // We expect userInputForSignings objects to be similar to InputForSigning interface,
      // but we allow address to be specified in addition to publicKey for convenience.
      inputForSigns = options.inputForSigns.map(input => {
        const index = Number(input.index);
        if (isNaN(index)) {
          throw new Error('Invalid input index');
        }

        const {address, publicKey} = input as any;
        if (!address && !publicKey) {
          throw new Error('Input requires either an address or a public key');
        }

        if (address && address !== account.address) {
          throw new Error('Address mismatch in input');
        }

        if (publicKey && publicKey !== account.pubkey) {
          throw new Error('Public key mismatch in input');
        }

        const sighashTypes = input.sighashTypes?.map(Number);
        if (sighashTypes?.some(isNaN)) {
          throw new Error('Invalid sighash type provided');
        }

        return {
          index,
          publicKey: account.pubkey,
          sighashTypes,
          disableTweakSigner: input.disableTweakSigner,
        };
      });
    } else {
      const networkType = this.getActiveNetwork();
      const network = getBitcoinNetwork(networkType);
      const psbtNetwork = getBitcoinNetwork(networkType);

      const psbt =
        typeof _psbt === 'string'
          ? bitcoin.Psbt.fromHex(_psbt as string, {network: psbtNetwork})
          : (_psbt as bitcoin.Psbt);
      psbt.data.inputs.forEach((v, index) => {
        let address = '';
        let script: any = null;
        let value = 0;
        if (v.witnessUtxo) {
          script = v.witnessUtxo.script;
          value = v.witnessUtxo.value;
          address = extractAddressFromScript({
            script,
            tapInternalKey: v.tapInternalKey,
            network,
          });
        } else if (v.nonWitnessUtxo) {
          const tx = bitcoin.Transaction.fromBuffer(v.nonWitnessUtxo);
          const output = tx.outs[psbt.txInputs[index].index];
          script = output.script;
          address = convertScriptToAddress(script, networkType);
          value = output.value;
        }
        const isSigned = v.finalScriptSig || v.finalScriptWitness;
        if (script && !isSigned) {
          if (account.address === address) {
            inputForSigns.push({
              index,
              publicKey: account.pubkey,
              sighashTypes: v.sighashType ? [v.sighashType] : undefined,
            });
          }
        }
      });
    }
    return inputForSigns;
  };

  signPsbt = async (
    psbt: bitcoin.Psbt,
    inputForSigns: InputForSigning[],
    autoFinalized: boolean,
  ) => {
    const account = this.getActiveAccount();
    if (!account) {
      throw new Error('no active account');
    }

    const wallet = this.getActiveWallet();
    if (!wallet) {
      throw new Error('no active wallet');
    }
    const _wallet = walletService.wallets[wallet.index];

    const networkType = this.getActiveNetwork();
    const psbtNetwork = getBitcoinNetwork(networkType);
    if (!inputForSigns) {
      // Compatibility with legacy code.
      inputForSigns = await this.formatOptionsInputForSignings(psbt);
      if (autoFinalized !== false) {
        autoFinalized = true;
      }
    }
    psbt.data.inputs.forEach(v => {
      const isNotSigned = !(v.finalScriptSig || v.finalScriptWitness);
      const isP2TR =
        wallet.addressType === AddressType.P2TR ||
        wallet.addressType === AddressType.M44_P2TR;
      const lostInternalPubkey = !v.tapInternalKey;
      // Special measures taken for compatibility with certain applications.
      if (isNotSigned && isP2TR && lostInternalPubkey) {
        const tapInternalKey = toXOnly(Buffer.from(account.pubkey, 'hex'));
        const {output} = bitcoin.payments.p2tr({
          internalPubkey: tapInternalKey,
          network: psbtNetwork,
        });
        if (v.witnessUtxo?.script.toString('hex') === output?.toString('hex')) {
          v.tapInternalKey = tapInternalKey;
        }
      }
    });
    psbt = await walletService.signTransaction(_wallet, psbt, inputForSigns);
    if (autoFinalized) {
      inputForSigns.forEach(v => {
        psbt.finalizeInput(v.index);
      });
    }
    return psbt;
  };

  extractTransactionFromPsbtHex = async (psbtHex: string, signed: boolean) => {
    const extractData: ExtractPsbt = {
      outputs: [],
      inputs: [],
      feeRate: 0,
      fee: 0,
      features: {
        rbf: false,
      },
    };
    const networkType = this.getActiveNetwork();
    const network = getBitcoinNetwork(networkType);
    // Step 1: Parse the PSBT from hex
    const psbt = Psbt.fromHex(psbtHex, {network});

    const outputAddressMap: {[key: string]: number} = {};

    psbt.txOutputs.forEach(v => {
      const address =
        v.address ?? extractAddressFromScript({script: v.script, network});
      extractData.outputs.push({
        value: v.value,
        address,
        txid: '',
        vout: 0,
        sighashType: 0,
      });
      outputAddressMap[address] = 1;
    });

    psbt.data.inputs.forEach((v, index) => {
      if (!v.witnessUtxo && v.nonWitnessUtxo) {
        const tx = bitcoin.Transaction.fromBuffer(v.nonWitnessUtxo);
        const output = tx.outs[psbt.txInputs[index].index];
        const script = output.script;
        const address = convertScriptToAddress(script, networkType);
        const value = output.value;
        extractData.inputs.push({
          address,
          value,
        });
      } else if (v.witnessUtxo || v.finalScriptWitness || v.tapInternalKey) {
        const address = extractAddressFromScript({
          script: v?.witnessUtxo?.script,
          tapInternalKey: v?.tapInternalKey,
          finalScriptWitness: v?.finalScriptWitness,
          network,
        });

        extractData.inputs.push({
          address,
          value: v.witnessUtxo?.value,
        });
      }
    });

    if (signed) {
      extractData.fee = psbt.getFee();
      extractData.feeRate = psbt.getFeeRate();

      const tx = psbt.extractTransaction(true);
      let rbf = false;
      for (const input of tx.ins) {
        const nSequence = input.sequence;

        // If nSequence is less than 0xFFFFFFFE, RBF is enabled
        if (nSequence < 0xfffffffe) {
          rbf = true;
          break;
        }
      }
      extractData.features.rbf = rbf;
    }

    return extractData;
  };

  private _generateAccountName = (type: string, index: number) => {
    const accountName = `${ACCOUNT_TYPE_TEXT[type]} ${index}`;
    return accountName;
  };

  getNextAccountName = (wallet: WalletDisplay) => {
    return this._generateAccountName(wallet.type, wallet.accounts.length + 1);
  };

  changeWallet = (wallet: WalletDisplay, accountIndex = 0, name?: string) => {
    walletConfig.setActiveWalletIndex(wallet.index);
    accountConfig.setActiveAccount(wallet.accounts[accountIndex], name);
  };

  createNewAccountFromMnemonic = async (
    wallet: WalletDisplay,
    name?: string,
  ) => {
    const _wallet = walletService.wallets[wallet.index];
    await walletService.addNewAccount(_wallet);

    const activeWallet = this.getActiveWallet();

    if (!activeWallet) {
      throw new Error('no current wallet');
    }
    wallet = activeWallet;
    this.changeWallet(wallet, wallet.accounts.length - 1, name);
    const activeAccount = this.getActiveAccount();
    if (name) {
      this.setAccountName(activeAccount!, name);
    }
  };

  getInscriptions = async (
    address: string,
    pageNumber: number,
    pageSize: number,
  ) => {
    return this.paidApi.getInscriptions(address, pageNumber, pageSize);
  };

  getInscriptionInfo = async (inscriptionId: string) => {
    return this.paidApi.getInscriptionInfo(inscriptionId);
  };

  getInscriptionContent = async (inscriptionId: string) => {
    return this.paidApi.getInscriptionContent(inscriptionId);
  };

  getAllInscriptions = async (address: string) => {
    return this.paidApi.getAllInscriptions(address);
  };

  getTapList = async (
    address: string,
    currentPage: number,
    pageSize: number,
  ) => {
    const offset = (currentPage - 1) * pageSize;
    const max = pageSize;
    const {list, total} = await this.tapApi.getAddressTapTokens(
      address,
      offset,
      max,
    );
    return {
      currentPage,
      pageSize,
      total: total,
      list,
    };
  };

  getTapSummary = async (address: string, ticker: string) => {
    const tokenSummary = await this.tapApi.getTapTokenSummary(address, ticker);

    if (tokenSummary?.tokenInfo?.inscriptionId) {
      const inscriptions = await this.getInscriptionInfo(
        tokenSummary.tokenInfo?.inscriptionId,
      );
      if (inscriptions.length) {
        tokenSummary.tokenInfo.holder = inscriptions[0].address;
      }
    }
    return tokenSummary;
  };

  getTapTransferAbleList = async (
    address: string,
    ticker: string,
    currentPage: number,
    pageSize: number,
  ) => {
    const offset = (currentPage - 1) * pageSize;
    const max = pageSize;
    const {list, total} = await this.tapApi.getTapTransferAbleList(
      address,
      ticker,
      offset,
      max,
    );
    return {
      currentPage,
      pageSize,
      total,
      list,
    };
  };

  getAllTapDmt = async (address: string) => {
    return await this.tapApi.getDmtAddressTapTokens(address);
  };

  getAllAddressDmtMintList = async (address: string) => {
    return await this.tapApi.getAllAddressDmtMintList(address);
  };

  getAccountAllMintsListByTicker = async (address: string, ticker: string) => {
    return await this.tapApi.getAccountAllMintsListByTicker(address, ticker);
  };

  getDmtContent = async (depInscriptionId: string) => {
    const depIns = await this.paidApi.getInscriptionInfo(depInscriptionId);
    let contentIns = depInscriptionId;
    for (const ins of depIns) {
      if (ins.inscriptionId && ins.inscriptionId !== depInscriptionId) {
        contentIns = ins.inscriptionId;
      }
    }
    let content = await this.paidApi.getInscriptionContent(contentIns);
    try {
      if (content?.id) {
        content = this.paidApi.getInscriptionContent(content?.id);
      }
      return content;
    } catch (error) {
      console.log('🚀 ~ Provider ~ getDmtContent= ~ error:', error);
      return content;
    }
  };

  getDmtContentId = async (
    depInscriptionId: string,
  ): Promise<{contentInsId: string; ticker: string; unat: boolean}> => {
    const depIns = await this.paidApi.getInscriptionInfo(depInscriptionId);
    let unat = false;
    let contentIns = depInscriptionId;
    for (const ins of depIns) {
      if (ins.inscriptionId && ins.inscriptionId !== depInscriptionId) {
        contentIns = ins.inscriptionId;
      }
    }
    try {
      const content = await this.paidApi.getInscriptionContent(contentIns);
      if (content?.id) {
        contentIns = content?.id;
        unat = true;
      }
      return {contentInsId: contentIns, ticker: content?.tick, unat};
    } catch (error) {
      console.log('🚀 ~ Provider ~ getDmtContent= ~ error:', error);
      throw error; // return {contentIns};
    }
  };

  createOrderTransfer = (
    address: string,
    tick: string,
    amount: string,
    feeRate: number,
    outputValue: number,
  ) => {
    return this.paidApi.createOrderRequest(
      address,
      tick,
      amount,
      feeRate,
      outputValue,
    );
  };

  getInscribeTapResult = (orderId: string) => {
    return this.paidApi.getInscribeTapResult(orderId);
  };

  getApproval = notificationService.getApproval;
  resolveApproval = notificationService.resolveApproval;
  rejectApproval = notificationService.rejectApproval;

  getConnectedSite = permissionService.getConnectedSite;
  getSite = permissionService.getSite;
  getConnectedSites = permissionService.getConnectedSites;
  setRecentConnectedSites = (sites: ConnectedSite[]) => {
    permissionService.setRecentConnectedSites(sites);
  };
  getRecentConnectedSites = () => {
    return permissionService.getRecentConnectedSites();
  };
  getCurrentSite = (tabId: number): ConnectedSite | null => {
    const {origin, name, icon} = sessionService.getSession(tabId) || {};
    if (!origin) {
      return null;
    }
    const site = permissionService.getSite(origin);
    if (site) {
      return site;
    }
    return {
      origin,
      name,
      icon,
      isConnected: false,
      isSigned: false,
      isTop: false,
    };
  };
  getCurrentConnectedSite = (tabId: number) => {
    const {origin} = sessionService.getSession(tabId) || {};
    return permissionService.getWithoutUpdate(origin);
  };
  setSite = (data: ConnectedSite) => {
    permissionService.setSite(data);
    if (data.isConnected) {
      const network = this.getActiveNetwork();
      sessionService.broadcastEvent(
        'networkChanged',
        {
          network,
        },
        data.origin,
      );
    }
  };
  updateConnectSite = (origin: string, data: ConnectedSite) => {
    permissionService.updateConnectSite(origin, data);
    const network = this.getActiveNetwork();
    sessionService.broadcastEvent(
      'networkChanged',
      {
        network,
      },
      data.origin,
    );
  };
  removeAllRecentConnectedSites = () => {
    const sites = permissionService
      .getRecentConnectedSites()
      .filter(item => !item.isTop);
    sites.forEach(item => {
      this.removeConnectedSite(item.origin);
    });
  };
  removeConnectedSite = (origin: string) => {
    sessionService.broadcastEvent('accountsChanged', [], origin);
    permissionService.removeConnectedSite(origin);
  };
  signMessage = async (text: string) => {
    const account = accountConfig.getActiveAccount();
    if (!account) throw new Error('no active account');
    return walletService.signMessage(account.pubkey, account.type, text);
  };
  getUSDPrice = async (bits: number) => {
    if (bits === 0) {
      return 0;
    }
    const res = await usdApi.getUSDPrice();
    if (res) {
      const price = Number(res) * bits;
      return price?.toFixed(2);
    }
    return 0;
  };

  setAccountSpendableInscriptions = (
    account: IDisplayAccount,
    inscriptions: Inscription[],
  ) => {
    const accountSpendableKey = `${account.key}_${account.address}`;
    accountConfig.setAccountSpendableInscriptions(
      accountSpendableKey,
      inscriptions,
    );
  };

  getAccountSpendableInscriptions = async (account: IDisplayAccount) => {
    const accountSpendableKey = `${account.key}_${account.address}`;

    return accountConfig.getAccountSpendableInscriptions(accountSpendableKey);
  };

  deleteAccountSpendableInscription = async (
    account: IDisplayAccount,
    inscriptionId: string,
  ) => {
    const accountSpendableKey = `${account.key}_${account.address}`;

    accountConfig.deleteAccountSpendableInscription(
      accountSpendableKey,
      inscriptionId,
    );
  };

  getAllRuneUtxos = async (address: string) => {
    return await this.paidApi.getAllRuneUtxos(address);
  };
}

export default new Provider();
