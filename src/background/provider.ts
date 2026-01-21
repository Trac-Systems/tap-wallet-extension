import {
  walletService,
  authService,
  accountConfig,
  walletConfig,
  networkConfig,
  appConfig,
  networkFilterConfig,
  notificationService,
  permissionService,
  sessionService,
} from './service/singleton';
import {getLedgerService} from './service/ledger.service';
import * as hdkey from 'hdkey';
import * as bip39 from 'bip39';
import {
  ACCOUNT_TYPE_TEXT,
  ADDRESS_TYPES,
  WALLET_TYPE,
  adjustDerivationPathForNetwork,
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
import { IResponseAddressBalance, PaidApi } from './requests/paid-api';
import { TracApi } from './requests/trac-api';
import { mempoolApi, paidApi, tapApi, inscribeApi, usdApi } from './requests';
import { SupportedToken } from '@/src/shared/constants/token-price';
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
  OrderType,
  InscribeOrder,
} from '../wallet-instance';
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371';
import { convertScriptToAddress } from '../shared/utils/btc-helper';
import { MempoolApi } from './requests/mempool-api';
import { TapApi } from './requests/tap-api';
import { ConnectedSite } from './service/permission.service';
import { isEmpty } from 'lodash';
import { Psbt } from 'bitcoinjs-lib';
import { InscribeApi } from './requests/inscribe-api';
import { createHash } from 'crypto';
import * as secp from '@noble/secp256k1';
import { dta } from '../ui/interfaces'

export interface IDerivationPathOption {
  label: string;
  derivationPath: string;
  addressType: AddressType;
}

export class Provider {
  paidApi: PaidApi = paidApi;
  mempoolApi: MempoolApi = mempoolApi;
  tapApi: TapApi = tapApi;
  inscribeApi: InscribeApi = inscribeApi;

  unlockApp = async (pin: string) => {
    await walletService.unlockWallet(pin);
  };

  changePassword = async (oldPin: string, newPin: string) => {
    await walletService.changePassword(oldPin, newPin);
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
  private _getAccountLabel = (type: string) => {
    if (type === 'HD Wallet' || type === 'Hardware Wallet') {
      return 'Account';
    }
    return ACCOUNT_TYPE_TEXT[type] || 'Account';
  };

  private _genDefaultAccountName = (type: string, accountIndex: number) => {
    const label = this._getAccountLabel(type);
    return `${label} ${accountIndex + 1}`;
  };

  _getWalletDisplayUI = (walletDisplay: IWalletDisplayUI, index: number) => {
    const networkType = networkConfig.getActiveNetwork();
    const addressType = walletDisplay.addressType;
    const key = 'wallet_' + index;
    const type = walletDisplay.type;
    const accounts: IDisplayAccount[] = [];

    // For hardware wallets, check if there's a network mismatch
    // If mismatch, use the saved network instead of current network
    let effectiveNetworkType = networkType;
    if (type === 'Hardware Wallet') {
      const savedNetwork = walletConfig.getHardwareWalletNetwork(key);
      if (savedNetwork && savedNetwork !== networkType) {
        // Hardware wallet is mismatched, use saved network to keep address unchanged
        effectiveNetworkType = savedNetwork;
      }
    }

    for (let j = 0; j < walletDisplay.accounts.length; j++) {
      const { pubkey } = walletDisplay.accounts[j];
      const address = deriveAddressFromPublicKey(
        pubkey,
        addressType,
        effectiveNetworkType,
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
    let derivationPath = '';
    if (type === WALLET_TYPE.HdWallet) {
      derivationPath = walletDisplay.wallet.derivationPath || '';
    } else if (type === 'Hardware Wallet') {
      // LedgerWallet stores derivation path in derivationRoot
      derivationPath = walletDisplay.wallet.derivationPath || '';
    }

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
    const oldNetwork = networkConfig.getActiveNetwork();
    networkConfig.setActiveNetwork(network);
    paidApi.changeNetwork();
    this.mempoolApi.changeNetwork(network);
    this.tapApi.changeNetwork(network);
    this.inscribeApi.changeNetwork(network);
    usdApi.changeNetwork(network);

    // Mark all hardware wallets as mismatch if network changed
    if (oldNetwork !== network) {
      const wallets = this.getWallets();
      for (const wallet of wallets) {
        if (wallet.type === 'Hardware Wallet') {
          // Save the old network for this hardware wallet
          const savedNetwork = walletConfig.getHardwareWalletNetwork(wallet.key);
          if (!savedNetwork) {
            // Only save if not already saved (first time mismatch)
            walletConfig.setHardwareWalletNetwork(wallet.key, oldNetwork);
          }
        }
      }
    }
    
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

  createWalletFromLedger = async (
    derivationPath: string,
    addressType: AddressType,
    accountNum: number,
    allPubkeys?: Array<{derivationPath: string; pubkey: string; addressType: AddressType}>,
  ) => {
    const originWallet = await walletService.createWalletFromLedger(
      derivationPath,
      addressType,
      accountNum,
    );
    
    // Cache all pubkeys that were pre-fetched during address selection
    const hwWallet = originWallet as any;
    if (allPubkeys && allPubkeys.length > 0 && hwWallet.cachePubkeysForAllPaths) {
      hwWallet.cachePubkeysForAllPaths(allPubkeys);
    }
    
    const walletDataForUI = walletService.getWalletDataForUI(
      originWallet,
      addressType,
      walletService.wallets.length - 1,
    );
    const wallet = this._getWalletDisplayUI(
      walletDataForUI,
      walletService.wallets.length - 1,
    );
    // Clear mismatch and save current network for this hardware wallet
    // since Ledger is now connected with the correct app
    walletConfig.clearHardwareWalletNetwork(wallet.key);
    walletConfig.setHardwareWalletNetwork(wallet.key, networkConfig.getActiveNetwork());
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
    options?: { tracPrivateKeys?: string[] },
  ) => {
    const originWallet = await walletService.createWalletFromPrivateKey(
      privateKey,
      addressType,
      options,
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
    this.removeWalletTracAddresses(wallet.index);
    networkFilterConfig.removeWalletFilters(wallet.index);

    await walletService.removeWallet(wallet.index);
    const wallets = this.getWallets();
    const nextWallet = wallets[wallets.length - 1];
    if (nextWallet && nextWallet.accounts[0]) {
      this.setActiveWallet(nextWallet);
      return nextWallet;
    }
  };

  setActiveWallet = (wallet: WalletDisplay, accountIndex?: number) => {
    if (!wallet || !wallet.accounts || wallet.accounts.length === 0) {
      throw new Error('Invalid wallet: no accounts found');
    }

    walletConfig.setActiveWalletIndex(wallet.index);

    // Use saved account index if not provided
    const savedAccountIndex = accountIndex !== undefined ? accountIndex : walletConfig.getWalletAccountIndex(wallet.key);
    const targetAccountIndex = Math.min(savedAccountIndex, wallet.accounts.length - 1);

    if (!wallet.accounts[targetAccountIndex]) {
      throw new Error(`Account at index ${targetAccountIndex} not found`);
    }

    accountConfig.setActiveAccount(wallet.accounts[targetAccountIndex]);

    // Save the account index for this wallet
    walletConfig.setWalletAccountIndex(wallet.key, targetAccountIndex);
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

  getMnemonicsUnlocked = async (wallet: WalletDisplay) => {
    if (!this.isUnlocked()) {
      throw new Error('Wallet must be unlocked to access mnemonic');
    }

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
    { pubkey, type }: { pubkey: string; type: string },
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

  isPasswordUpgraded = async () => authService.isPasswordUpgraded();

  markPasswordUpgraded = async () => authService.markPasswordUpgraded();

  isLegacyUser = async (pin: string) => authService.isLegacyUser(pin);

  getTracPrivateKey = async (
    pin: string,
    walletIndex: number,
    accountIndex: number = 0,
  ) => {
    await authService.verifyPassword(pin);
    const wallet = walletService.wallets[walletIndex];
    if (!wallet || wallet.type !== 'Single Wallet') {
      throw new Error('Wallet not found or not a Single Wallet');
    }
    return (wallet as any).exportTracPrivateKey(accountIndex);
  };

  getTracPrivateKeyUnlocked = async (
    walletIndex: number,
    accountIndex: number = 0,
  ) => {
    if (!this.isUnlocked()) {
      throw new Error('Wallet must be unlocked to access TRAC private key');
    }
    const wallet = walletService.wallets[walletIndex];
    if (!wallet || wallet.type !== 'Single Wallet') {
      throw new Error('Wallet not found or not a Single Wallet');
    }
    return (wallet as any).exportTracPrivateKey(accountIndex);
  };


  setWalletName = (wallet: WalletDisplay, name: string) => {
    walletConfig.setWalletName(wallet.key, name);
    return Object.assign({}, wallet, { name });
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

  getAllAddresses = async (wallet: WalletDisplay, index: number) => {
    const networkType = this.getActiveNetwork();
    const addresses: { [key: string]: { addressType: AddressType } } = {};
    const _wallet = walletService.wallets[wallet.index];
    if (wallet.type === WALLET_TYPE.HdWallet) {
      const pathPubkey: { [path: string]: string } = {};

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
          addresses[address] = { addressType: v.value };
        }
      }
    } else if (_wallet?.type === 'Hardware Wallet') {
      const hwWallet = _wallet as any;
      
      // For hardware wallets, check if there's a network mismatch
      // If mismatch, use the saved network to keep addresses consistent with home screen
      const walletKey = 'wallet_' + wallet.index;
      const savedNetwork = walletConfig.getHardwareWalletNetwork(walletKey);
      const effectiveNetworkType = (savedNetwork && savedNetwork !== networkType) 
        ? savedNetwork 
        : networkType;
      
      // Fetch addresses sequentially to avoid "Ledger Device is busy" errors
      // Ledger can only handle one request at a time
      const addressTypesList = Object.keys(ADDRESS_TYPES)
        .map(k => ({key: k, value: ADDRESS_TYPES[k]}))
        .filter(item => item.value.displayIndex >= 0)
        .sort((a, b) => a.value.displayIndex - b.value.displayIndex);
      
      for (const item of addressTypesList) {
        const v = item.value;
        // Adjust derivation path for the effective network (saved network if mismatched)
        const adjustedPath = adjustDerivationPathForNetwork(v.derivationPath, effectiveNetworkType);
        
        let pubkey = hwWallet.getAccountByDerivationPath?.(adjustedPath, index);
        if (!pubkey && hwWallet.ensureAccountForDerivation) {
          try {
            pubkey = await hwWallet.ensureAccountForDerivation(adjustedPath, index);
          } catch (error) {
            console.error('Failed to fetch Ledger pubkey for', adjustedPath, error);
            continue;
          }
        }
        if (!pubkey) {
          continue;
        }
        const address = deriveAddressFromPublicKey(pubkey, v.value, effectiveNetworkType);
        addresses[address] = {addressType: v.value};
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
          addresses[address] = { addressType: v.value };
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
    return Object.assign({}, account, { name });
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
    const ignoreAssetMap: { [key: string]: boolean } = {};
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

    const finalUtxos =
      spendableUtxoInscriptions.length > 0
        ? [...utxosWithoutInscription, ...spendableUtxoInscriptions]
        : utxosWithoutInscription;

    return finalUtxos;
  };

  private async ensureLedgerLegacyUtxos(utxos: UnspentOutput[]) {
    const wallet = this.getActiveWallet();
    if (!wallet) return;

    const isLedger = wallet.type === 'Hardware Wallet';
    const isLegacy = wallet.addressType === AddressType.P2PKH;

    if (!isLedger || !isLegacy) return;

    await Promise.all(
      utxos.map(async utxo => {
        if (utxo.rawTxHex) return;

        const rawWithWitness = await this.mempoolApi.getRawTxHex(utxo.txid);
        const tx = bitcoin.Transaction.fromHex(rawWithWitness);

        tx.ins.forEach(input => {
          input.witness = [];
        });

        utxo.rawTxHex = tx.toBuffer().toString('hex');
      }),
    );
  }

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
    if (!btcUtxos || btcUtxos?.length === 0) {
      btcUtxos = await this.getBTCUtxos(account.address);
    }

    if (!btcUtxos || btcUtxos?.length === 0) {
      throw new Error('Insufficient balance.');
    }

    await this.ensureLedgerLegacyUtxos(btcUtxos);

    const isHardwareWallet = activeWallet?.type === 'Hardware Wallet';
    const {psbt, inputForSigns, outputs, inputs} = await sendBTC({
      btcUtxos: btcUtxos,
      tos: [{ address: to, satoshis: amount }],
      networkType,
      fromAddress: account.address,
      addressType: activeWallet?.addressType,
      pubkey: account.pubkey,
      feeRate,
      enableRBF,
      isHardwareWallet,
    });
    
    if (!isHardwareWallet) {
      this.setPsbtSignNonSegwitEnable(psbt, true);
      await this.signPsbt(psbt, inputForSigns, true);
      this.setPsbtSignNonSegwitEnable(psbt, false);
    }
    
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

    if (!btcUtxos || btcUtxos?.length === 0) {
      btcUtxos = await this.getBTCUtxos(account.address, [inscriptionId]);
    }

    if (!btcUtxos || btcUtxos?.length === 0) {
      throw new Error('Insufficient balance.');
    }

    await this.ensureLedgerLegacyUtxos([assetUtxo, ...btcUtxos]);

    const isHardwareWallet = wallet?.type === 'Hardware Wallet';

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
      isHardwareWallet,
    });

    if (!isHardwareWallet) {
      this.setPsbtSignNonSegwitEnable(psbt, true);
      await this.signPsbt(psbt, inputForSigns, true);
      this.setPsbtSignNonSegwitEnable(psbt, false);
    }
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

    if (!btcUtxos || btcUtxos?.length === 0) {
      btcUtxos = await this.getBTCUtxos(account.address, inscriptionIds);
    }

    if (!btcUtxos || btcUtxos?.length === 0) {
      throw new Error('Insufficient balance.');
    }

    await this.ensureLedgerLegacyUtxos([...assetUtxos, ...btcUtxos]);

    const isHardwareWallet = wallet?.type === 'Hardware Wallet';

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
      isHardwareWallet,
    });

    if (!isHardwareWallet) {
      this.setPsbtSignNonSegwitEnable(psbt, true);
      await this.signPsbt(psbt, inputForSigns, true);
      this.setPsbtSignNonSegwitEnable(psbt, false);
    }

    return { psbtHex: psbt.toHex(), inputs, outputs, inputForSigns };
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

        const { address, publicKey } = input as any;
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
          ? bitcoin.Psbt.fromHex(_psbt as string, { network: psbtNetwork })
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

  signPsbtFromHex = async (
    psbtHex: string,
    inputForSigns: InputForSigning[],
    autoFinalized: boolean = true,
  ): Promise<string> => {
    const networkType = this.getActiveNetwork();
    const psbtNetwork = getBitcoinNetwork(networkType);
    const psbt = bitcoin.Psbt.fromHex(psbtHex, {network: psbtNetwork});
    const signedPsbt = await this.signPsbt(psbt, inputForSigns, autoFinalized);
    return signedPsbt.toHex();
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
        const { output } = bitcoin.payments.p2tr({
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
    const psbt = Psbt.fromHex(psbtHex, { network });

    const outputAddressMap: { [key: string]: number } = {};

    psbt.txOutputs.forEach(v => {
      const address =
        v.address ?? extractAddressFromScript({ script: v.script, network });
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
    const label = this._getAccountLabel(type);
    return `${label} ${index}`;
  };

  getNextAccountName = (wallet: WalletDisplay) => {
    return this._generateAccountName(wallet.type, wallet.accounts.length + 1);
  };

  changeWallet = (wallet: WalletDisplay, accountIndex = 0, name?: string) => {
    walletConfig.setActiveWalletIndex(wallet.index);
    accountConfig.setActiveAccount(wallet.accounts[accountIndex], name);

    // Save the account index for this wallet
    walletConfig.setWalletAccountIndex(wallet.key, accountIndex);
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

  getInscriptionInfoOrdClient = async (inscriptionId: string) => {
    return this.paidApi.getInscriptionInfoOrdClient(inscriptionId);
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
    const { list, total } = await this.tapApi.getAddressTapTokens(
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

  getAllTapToken = async (address: string) => {
    return await this.tapApi.getAllAddressTapTokens(address);
  };

  getTapSummary = async (
    address: string,
    ticker: string,
  ) => {
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
    const { list, total } = await this.tapApi.getTapTransferAbleList(
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

  getTokenTotalMinted = async (ticker: string) => {
    return await this.tapApi.getTokenTotalMinted(ticker);
  };

  getDeployment = async (ticker: string) => {
    return await this.tapApi.getDeployment(ticker);
  };

  getDmtScriptId = async (
    depInscriptionId: string,
  ): Promise<{ scriptInsId: string; ticker: string; unat: boolean }> => {
    try {
      const depInfo =
        await this.paidApi.getInscriptionContent(depInscriptionId);

      const ticker = `dmt-${depInfo?.tick}`;
      let scriptInsId = '';
      // fix for dmt-patterns 🔴🟢🔵 have no script id
      if (
        depInscriptionId ===
        '56ae47222d02dbf5cb2181ff4a1c0c41a8b5f1f1c3b27461dbbeff2d2f2ce7d7i0'
      ) {
        scriptInsId =
          'fd7f252b5f4eb07eced6232134509cd21b897d96168478f3b84b3d8dceef88d7i0';
      } else {
        scriptInsId = await this.inscribeApi.getUnatScriptByTicker(ticker);
      }

      const unat = Boolean(scriptInsId);
      return { scriptInsId: scriptInsId, ticker, unat };
    } catch (error) {
      console.log('Provider ~ getDmtContent= ~ error:', error);
      throw error; // return {contentIns};
    }
  };

  createOrderTransfer = async (
    address: string,
    tick: string,
    amount: string,
    feeRate: number,
    outputValue: number,
    dta?: dta,
  ): Promise<InscribeOrder> => {
    const connectedAddress = this.getActiveAccount()?.address;
    const order = await this.inscribeApi.createOrderTapTransfer(
      feeRate,
      outputValue,
      connectedAddress,
      address,
      tick,
      amount,
      dta
    );

    // add pending order
    this.addAccountPendingOrder(order.id);
    return order;
  };

  createOrderAuthority = async (
    address: string,
    content: string,
    feeRate: number,
    outputValue: number,
  ): Promise<InscribeOrder> => {
    const order = await this.inscribeApi.createOrderText(
      content,
      OrderType.AUTHORITY,
      address,
      feeRate,
      outputValue,
    );

    // add pending order
    this.addAccountPendingOrder(order.id);
    return order;
  };

  createOrderCancelAuthority = async (
    address: string,
    content: string,
    feeRate: number,
    outputValue: number,
    inscriptionAuthority?: string,
  ): Promise<InscribeOrder> => {
    const order = await this.inscribeApi.createOrderText(
      content,
      OrderType.CANCEL_AUTHORITY,
      address,
      feeRate,
      outputValue,
      inscriptionAuthority,
    );

    // add pending order
    this.addAccountPendingOrder(order.id);
    return order;
  };

  createOrderRedeem = async (
    address: string,
    content: string,
    feeRate: number,
    outputValue: number,
  ): Promise<InscribeOrder> => {
    const order = await this.inscribeApi.createOrderText(
      content,
      OrderType.REDEEM,
      address,
      feeRate,
      outputValue,
    );

    // add pending order
    this.addAccountPendingOrder(order.id);
    return order;
  };

  getAuthorityOrders = async (address: string) => {
    return await this.inscribeApi.getAuthorityOrders(address);
  };

  getOrderReadyToTap = async (address: string, orderType: OrderType) => {
    return await this.inscribeApi.getReadyToTap(address, orderType);
  };

  paidOrder = async (orderId: string) => {
    // remove pending order
    this.removeAccountPendingOrder(orderId);
    const headers = await this._generateHeaders();
    await this.inscribeApi.paidOrder(orderId, headers);
  };

  tappingOrder = async (orderId: string) => {
    const headers = await this._generateHeaders();
    await this.inscribeApi.tappingOrder(orderId, headers);
  };

  cancelOrder = async (orderId: string) => {
    this.removeAccountPendingOrder(orderId);
    const headers = await this._generateHeaders();
    await this.inscribeApi.cancelOrder(orderId, headers);
  };

  getCancelAuthority = async (authorityInscriptionId: string) => {
    return await this.inscribeApi.getCancelAuthority(authorityInscriptionId);
  };

  getInscribeTapResult = (orderId: string) => {
    return this.paidApi.getInscribeTapResult(orderId);
  };

  getAccountPendingOrders = () => {
    return accountConfig.getAccountPendingOrders();
  };

  addAccountPendingOrder = (orderId: string) => {
    accountConfig.addAccountPendingOrder(orderId);
  };

  removeAccountPendingOrder = (orderId: string) => {
    accountConfig.removeAccountPendingOrder(orderId);
  };

  resetAccountPendingOrders = () => {
    accountConfig.resetAccountPendingOrders();
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
    const { origin, name, icon } = sessionService.getSession(tabId) || {};
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
    const { origin } = sessionService.getSession(tabId) || {};
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

  removeTracConnection = (origin: string) => {
    permissionService.removeTracConnection(origin);
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

  getTokenUSDPrice = async (ticker: SupportedToken, amount: number): Promise<string> => {
    if (amount === 0 || isNaN(amount)) {
      return '0.00';
    }

    try {
      const tokenPrice = await usdApi.getTokenUSDPrice(ticker);
      if (tokenPrice === 0) {
        return '0.00';
      }

      const usdValue = tokenPrice * amount;
      return usdValue.toFixed(2);
    } catch (error) {
      console.error(`Error calculating ${ticker} USD price:`, error);
      return '0.00';
    }
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

  // convert this to private property
  private _sha256 = (content: string) => {
    // convert content to hex
    return createHash('sha256').update(content).digest();
  };
  // generate salt
  private _generateSalt = () => {
    const array = new Uint32Array(4);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map(n => n.toString().padStart(10, '0')) // Each 32-bit number gives up to 10 digits
      .join('')
      .slice(0, 32); // Trim to exact length
  };

  generateTokenAuth = async (message: any, authType: 'redeem' | 'auth') => {
    const account = this.getActiveAccount();
    if (!account) {
      return null;
    }
    const pubKey = account.pubkey;
    const wallet = walletService.getWalletForBackground(pubKey, account.type);
    if (!wallet) {
      return null;
    }
    const salt = this._generateSalt();
    const privateKey = await wallet.exportPrivateKey(pubKey);
    const privKeyBuffer = Buffer.from(privateKey, 'hex');
    const privKeyUint8Array = new Uint8Array(privKeyBuffer);
    const pubKeyBuffer = Buffer.from(pubKey, 'hex');
    const pubKeyUint8Array = new Uint8Array(pubKeyBuffer);
    const proto = {
      p: 'tap',
      op: 'token-auth',
      sig: null,
      hash: null,
      salt: salt,
    };

    const msgHash = this._sha256(JSON.stringify(message) + proto.salt);
      const signature = await secp.signAsync(msgHash, privKeyUint8Array);
      proto[authType] = message;
      proto.sig = {
        v: '' + signature.recovery,
        r: signature.r.toString(),
        s: signature.s.toString(),
    };
      proto.hash = Buffer.from(msgHash).toString('hex');

    const test_proto = JSON.parse(JSON.stringify(proto));
    const test_msgHash = this._sha256(
      JSON.stringify(test_proto[authType]) + test_proto.salt,
    );
    const isValid = secp.verify(signature, test_msgHash, pubKeyUint8Array);

    return {
      proto: JSON.stringify(proto),
      isValid,
    };
  };

  getAllAuthorityList = async (address: string) => {
    const authorityList = await this.tapApi.getAllAuthorityList(address);
    const validAuthorityList = [];
    for (const authority of authorityList) {
      const property = await this.paidApi.getInscriptionContent(authority.ins);
      const isValid = await this.validateSignature(property);
      if (isValid) {
        validAuthorityList.push(authority);
      }
    }
    return validAuthorityList;
  };

  getCurrentAuthority = async (address: string) => {
    const allAuthorityList = await this.getAllAuthorityList(address);
    if (allAuthorityList.length === 0) {
      return null;
    }
    return allAuthorityList[allAuthorityList.length - 1];
  };

  getAuthorityCanceled = async (ins: string) => {
    return await this.tapApi.getAuthorityCanceled(ins);
  };

  validateSignature = async (resultJson: string | object) => {
    try {
      const pubKeyHex = this.getActiveAccount()?.pubkey;
      if (!pubKeyHex) {
        return false;
      }
      const proto =
        typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
      if (!proto || typeof proto !== 'object') return false;
      if (!proto.sig || typeof proto.sig !== 'object') return false;
      const { r, s, v } = proto.sig;
      if (r === undefined || s === undefined || v === undefined) return false;
      if (!proto.salt) return false;
      if (proto.auth === undefined) return false;
      if (!pubKeyHex || typeof pubKeyHex !== 'string') return false;
      const messagePayload = proto.auth ?? proto.redeem ?? proto.cancel ?? proto['auth'];
      if (!messagePayload) {
        return false;
      }
      const messageString = JSON.stringify(messagePayload) + proto.salt;
      const msgHash = createHash('sha256').update(messageString).digest();
      let rBigInt, sBigInt, recovery;
      try {
        rBigInt = BigInt(r);
        sBigInt = BigInt(s);
        recovery = parseInt(v);
        if (isNaN(recovery)) return false;
      } catch {
        return false;
      }
      let pubKeyBuffer;
      try {
        pubKeyBuffer = Buffer.from(pubKeyHex, 'hex');
      } catch {
        return false;
      }
      let signature;
      try {
        signature = new secp.Signature(rBigInt, sBigInt, recovery);
      } catch (e) {
        return false;
      }
      let isValid = false;
      try {
        isValid = secp.verify(signature, msgHash, pubKeyBuffer);
      } catch (e) {
        return false;
      }
      return isValid;
    } catch (error) {
      return false;
    }
  };

  _generateHeaders = async (): Promise<{
    message: string;
    signature: string;
    address: string;
  }> => {
    const address = this.getActiveAccount()?.address;
    if (!address) {
      return null;
    }
    const message = 'wallet-auth';
    const signature = await this.signMessage(message);
    return { message, signature, address };
  };

  // TRAC Address Management Methods
  getTracAddressMap = () => {
    return accountConfig.getTracAddressMap();
  };

  getIndicesByTracAddress = (address: string) => {
    return accountConfig.getIndicesByTracAddress(address);
  };


  getTracAddress = (walletIndex: number, accountIndex: number): string | null => {
    return accountConfig.getTracAddress(walletIndex, accountIndex);
  };

  setTracAddress = (walletIndex: number, accountIndex: number, address: string) => {
    accountConfig.setTracAddress(walletIndex, accountIndex, address);
  };

  getWalletTracAddresses = (walletIndex: number): { [accountIndex: string]: string } => {
    return accountConfig.getWalletTracAddresses(walletIndex);
  };

  removeTracAddress = (walletIndex: number, accountIndex: number) => {
    accountConfig.removeTracAddress(walletIndex, accountIndex);
  };

  removeWalletTracAddresses = (walletIndex: number) => {
    return accountConfig.removeWalletTracAddresses(walletIndex);
  };

  clearAllTracAddresses = () => {
    return accountConfig.clearAllTracAddresses();
  };

  logAllTracAddresses = () => {
    accountConfig.logAllTracAddresses();
  };

  getTracBalance = async (address: string): Promise<string> => {
    const network = this.getActiveNetwork();
    return await TracApi.fetchBalance(address, network);
  };

  // Network Filter methods
  getNetworkFilters = (walletIndex?: number) => {
    const activeWalletIndex = walletIndex ?? walletConfig.getActiveWalletIndex() ?? 0;
    return networkFilterConfig.getNetworkFilters(activeWalletIndex);
  };

  setNetworkFilters = (filters: { bitcoin: boolean; trac: boolean }, walletIndex?: number) => {
    const activeWalletIndex = walletIndex ?? walletConfig.getActiveWalletIndex() ?? 0;
    networkFilterConfig.setNetworkFilters(activeWalletIndex, filters);
  };

  updateNetworkFilter = (network: 'bitcoin' | 'trac', enabled: boolean, walletIndex?: number) => {
    const activeWalletIndex = walletIndex ?? walletConfig.getActiveWalletIndex() ?? 0;
    networkFilterConfig.updateNetworkFilter(activeWalletIndex, network, enabled);
  };

  isLedgerConnected = async (): Promise<boolean> => {
    try {
      const ledgerService = getLedgerService();
      const status = await ledgerService.getStatus();
      return status.connected;
    } catch (error) {
      return false;
    }
  };
}

export default new Provider();
