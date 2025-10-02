import {ObservableStore} from '@metamask/obs-store';
import {ISignTxInput} from '../../wallet-instance/transactions';
import {bitcoin} from '../utils/bitcoin-core';
import * as bip39 from 'bip39';
import {HDWallet, SingleWallet} from '../../wallet-instance/keychain';
import {isEmpty} from 'lodash';
import {
  ADDRESS_TYPES,
  AddressType,
  IWalletDisplayUI,
  InputForSigning,
  WALLET_TYPE,
} from '../../wallet-instance';
import {authService} from './singleton';

const defaultAddressType = AddressType.P2WPKH;

export interface IWallet {
  initializeRoot?(opts: any): Promise<void>;
  addNewAccounts?(n: number): Promise<string[]>;
  retrievePublicKeys?(): string[];
  signTransaction?(
    psbt: bitcoin.Psbt,
    inputs: ISignTxInput[],
  ): Promise<bitcoin.Psbt>;
  signData?(address: string, data: string, type: string): Promise<string>;
  signMessage?(address: string, message: string): Promise<string>;
  verifyMessage?(
    address: string,
    message: string,
    signature: string,
  ): Promise<boolean>;
  exportPrivateKey?(pubkey: string): Promise<string>;
  changeDerivationPath?(derivationPath: string): void;
  getAccountByDerivationPath?(derivationPath: string, index: number): string;
  serialize(): Promise<any>;

  accounts?: string[];
  type?: string;
}

interface IMemStore {
  wallets: any[];
}

export class PublicWallet {
  accounts: string[] = [];
  type = '';
  addressType: string;
  derivationPath = '';
  getAccounts: () => string[];

  constructor(wallet: IWallet) {
    this.accounts = wallet.accounts || [];
    this.type = wallet.type;
    this.addressType = '';
    this.derivationPath = (wallet as any).derivationPath;
    this.getAccounts = () => {
      return wallet.retrievePublicKeys();
    };
  }
}

export class WalletService {
  store!: ObservableStore<any>;
  memStore: ObservableStore<IMemStore>;
  wallets: IWallet[];
  addressTypes: AddressType[];

  constructor() {
    this.addressTypes = [];
    this.memStore = new ObservableStore({
      wallets: [],
      isUnlocked: false,
    });
    this.wallets = [];
  }

  init(initData) {
    this.store = new ObservableStore(initData);
  }

  hasWallet() {
    return !!this.store.getState().walletsDataEncrypted;
  }

  async unlockWallet(pin: string) {
    await authService.verifyPassword(pin, true);
    const walletsDataEncrypted = this.store.getState().walletsDataEncrypted;
    if (!walletsDataEncrypted) {
      throw new Error('Do not have any wallets existed!');
    }
    this._clearWalletsData();
    const walletsDecodeData: any = await authService.decodeData(
      pin,
      walletsDataEncrypted,
    );

    const arr = JSON.parse(walletsDecodeData);
    for (let i = 0; i < arr.length; i++) {
      const {wallet, addressType} = this._restoreWallet(arr[i]);
      this.wallets.push(wallet);
      this.addressTypes.push(addressType);
    }

    await this._updateMemStore();
    return this.wallets;
  }

  async changePassword(oldPin: string, newPin: string) {
    // verify old pin
    await authService.verifyPassword(oldPin, true);

    // re-encrypt wallets data with new pin
    const walletsDataEncrypted = this.store.getState().walletsDataEncrypted;
    if (!walletsDataEncrypted) {
      throw new Error('Do not have any wallets existed!');
    }
    const walletsDecodeData: any = await authService.decodeData(
      oldPin,
      walletsDataEncrypted,
    );

    // update registered with new pin first
    await authService.updateRegistered(newPin);

    // encrypt wallets with new pin (authService.pin has been set)
    const newEncrypted = await authService.encodeData(JSON.parse(walletsDecodeData));
    this.store.updateState({walletsDataEncrypted: newEncrypted});

    await this._updateMemStore();
  }

  fullUpdate = (): IMemStore => {
    return this.memStore.getState();
  };

  setLockedWallet = async (): Promise<IMemStore> => {
    authService.lockWallet();
    this.wallets = [];
    this.addressTypes = [];
    await this._updateMemStore();
    return this.fullUpdate();
  };

  private _clearWalletsData = () => {
    this.wallets = [];
    this.addressTypes = [];
    this.memStore.updateState({
      wallets: [],
    });
  };

  generateMnemonic() {
    return bip39.generateMnemonic(128);
  }

  async createTempWallet(type: string, options: unknown) {
    let wallet: any = {};
    if (type === 'HD Wallet') {
      wallet = new HDWallet(options);
    }
    if (type === 'Single Wallet') {
      wallet = new SingleWallet(options);
    }
    return wallet;
  }

  async createWalletFromMnemonic(
    mnemonic: string,
    derivationPath: string,
    passphrase: string,
    addressType: AddressType,
    accountNum: number,
    hdWallet,
  ) {
    if (accountNum < 1) {
      throw new Error('account count must be greater than 0');
    }
    if (!bip39.validateMnemonic(mnemonic)) {
      return Promise.reject(new Error('mnemonic phrase is invalid'));
    }

    await this._storeWallets();
    const activeIndexes: number[] = [];
    for (let i = 0; i < accountNum; i++) {
      activeIndexes.push(i);
    }
    const wallet = await this._addNewWallet(
      'HD Wallet',
      {
        mnemonic,
        activeIndexes,
        derivationPath,
        passphrase,
        hdWallet,
      },
      addressType,
    );
    const pubkeys = wallet.retrievePublicKeys();
    if (!pubkeys[0]) {
      throw new Error('Notfound any account on wallet');
    }
    await this._storeWallets();
    return wallet;
  }

  async createWalletFromPrivateKey(
    privateKey: string,
    addressType: AddressType,
  ): Promise<IWallet> {
    const wallet = await this._addNewWallet(
      'Single Wallet',
      {
        privateKeys: [privateKey],
      },
      addressType,
    );
    const pubkeys = wallet.retrievePublicKeys();
    if (!pubkeys[0]) {
      throw new Error('Notfound any account on wallet');
    }
    await this._storeWallets();
    return wallet;
  }

  removeWallet = async (walletIndex: number) => {
    this.wallets[walletIndex] = null;
    await this._storeWallets();
    await this._updateMemStore();
    this.fullUpdate();
  };

  getAllWalletsDataForUI() {
    return this.wallets.reduce((accumulator, w, index) => {
      if (!isEmpty(w)) {
        accumulator.push(
          this._getPublicWallet(w, this.addressTypes[index], index),
        );
      }
      return accumulator;
    }, []);
  }

  getWalletForBackground(address: string, type: string) {
    for (const wallet of this.wallets) {
      if (wallet?.type !== type) {
        continue;
      }
      const pubkeys = wallet.retrievePublicKeys();
      if (pubkeys?.includes(address)) {
        return wallet;
      }
    }
    throw new Error('No wallet found');
  }

  getWalletDataForUI(
    originWallet: IWallet,
    addressType: AddressType,
    index: number,
  ) {
    return this._getPublicWallet(originWallet, addressType, index);
  }

  async changeAddressType(walletIndex: number, addressType: AddressType) {
    const wallet: IWallet = this.wallets[walletIndex];
    if (wallet.type === WALLET_TYPE.HdWallet) {
      const derivationPath = ADDRESS_TYPES[addressType].derivationPath;
      if (
        (wallet as any).derivationPath !== derivationPath &&
        wallet.changeDerivationPath
      ) {
        wallet.changeDerivationPath(derivationPath);
      }
    }
    this.addressTypes[walletIndex] = addressType;
    await this._storeWallets();
    await this._updateMemStore();
    this.fullUpdate();
    return wallet;
  }

  private async _addNewWallet(
    type: string,
    options: unknown,
    addressType: AddressType,
  ): Promise<IWallet> {
    let wallet: any = {};
    if (type === 'HD Wallet') {
      wallet = new HDWallet(options);
    }
    if (type === 'Single Wallet') {
      wallet = new SingleWallet(options);
    }
    const accounts = await wallet.retrievePublicKeys();
    this._checkDuplicate(wallet.type, accounts);
    this.wallets.push(wallet);
    this.addressTypes.push(addressType);
    await this._storeWallets();
    await this._updateMemStore();
    return wallet;
  }

  private _checkDuplicate(type: string, newAccounts: string[]) {
    const listWallet = this.wallets.filter(w => !isEmpty(w) && w.type === type);

    const listAccount = listWallet.map(wallet => wallet.retrievePublicKeys());

    const accounts: string[] = listAccount.reduce(
      (m, n) => m.concat(n),
      [] as string[],
    );

    const isExisted = newAccounts.some(account => {
      return accounts.find(key => key === account);
    });

    if (isExisted) {
      throw new Error('Wallet already existed before');
    }
  }

  private _updateMemStore = async (): Promise<void> => {
    const wallets = await Promise.all(
      this.wallets.map((wallet, index) => {
        if (wallet) {
          return this._getPublicWallet(wallet, this.addressTypes[index], index);
        }
      }),
    );
    return this.memStore.updateState({wallets});
  };

  private _getPublicWallet(
    wallet: IWallet,
    addressType: AddressType,
    index: number,
  ): IWalletDisplayUI {
    const pubkeys = wallet.retrievePublicKeys();
    const accountsWithOrigin: {pubkey: string; origin: string}[] = [];
    for (const pubkey of pubkeys) {
      accountsWithOrigin.push({pubkey, origin: wallet.type});
    }
    return {
      type: wallet.type,
      accounts: accountsWithOrigin,
      wallet: new PublicWallet(wallet),
      addressType,
      index,
    };
  }

  restoreWallet = async (serialized: any) => {
    const {wallet} = this._restoreWallet(serialized);
    await this._updateMemStore();
    return wallet;
  };

  _restoreWallet = (
    serialized: any,
  ): {wallet: IWallet | null; addressType: AddressType} => {
    if (isEmpty(serialized)) {
      return {wallet: null, addressType: defaultAddressType};
    }
    const {type, data, addressType} = serialized;
    let wallet: any = {};
    if (type === 'HD Wallet') {
      wallet = new HDWallet(data);
    }
    if (type === 'Single Wallet') {
      wallet = new SingleWallet(data);
    }

    wallet?.retrievePublicKeys();
    return {
      wallet,
      addressType,
    };
  };

  private async _storeWallets() {
    const serializeWalletsData: any[] = [];

    for (let i = 0; i < this.wallets.length; i++) {
      const wallet = this.wallets[i];
      if (!wallet) {
        serializeWalletsData.push({});
        continue;
      }
      const serializeWallet = wallet.serialize();
      serializeWalletsData.push({
        type: wallet.type,
        data: serializeWallet,
        addressType: this.addressTypes[i],
      });
    }

    const walletsDataEncrypted =
      await authService.encodeData(serializeWalletsData);
    this.store.updateState({walletsDataEncrypted});
  }

  signTransaction = (
    wallet: IWallet,
    psbt: bitcoin.Psbt,
    inputs: InputForSigning[],
  ) => {
    return wallet.signTransaction(psbt, inputs);
  };

  signMessage = async (address: string, walletType: string, data: string) => {
    const wallet = await this.getWalletForBackground(address, walletType);
    const signMes = await wallet.signMessage(address, data);
    return signMes;
  };

  addNewAccount = async (wallet: IWallet): Promise<string[]> => {
    const accounts = await wallet.addNewAccounts(1);
    await this._storeWallets();
    await this._updateMemStore();
    this.fullUpdate();
    return accounts;
  };
}
