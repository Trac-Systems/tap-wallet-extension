import {ECPairInterface} from 'ecpair';
import * as bip39 from 'bip39';
import * as hdkey from 'hdkey';
import * as bitcoin from 'bitcoinjs-lib';
import {ECPair} from '@/src/background/utils/bitcoin-core';
import {SingleWallet} from './single-wallet';

const DEFAULT_PATH = "m/44'/0'/0'/0";
const WALLET_TYPE = 'HD Wallet';

export class HDWallet extends SingleWallet {
  static type = WALLET_TYPE;
  type = WALLET_TYPE;
  passphrase = '';
  mnemonicPhrase = '';
  network: bitcoin.Network = bitcoin.networks.bitcoin;
  derivationPath = DEFAULT_PATH;
  hdWallet: hdkey.HDKey;
  accountMap: Map<number, {address: string; keyPair: ECPairInterface}> =
    new Map();
  activeIndexes: number[] = [];

  constructor(options?: any) {
    super();
    if (options) {
      this.initializeWallet(options);
    }
  }

  async initializeWallet(options: any = {}) {
    if (this.hdWallet) {
      throw new Error('Wallet is already initialized.');
    }
    this.accounts = [];
    const {
      passphrase = '',
      mnemonic,
      derivationPath = DEFAULT_PATH,
      activeIndexes = [],
      hdWallet,
    } = options;
    this.derivationPath = derivationPath;
    this.passphrase = passphrase;

    if (mnemonic) {
      if (hdWallet) {
        this.hdWallet = hdWallet;
      } else {
        const seed = bip39.mnemonicToSeedSync(mnemonic, this.passphrase);
        this.hdWallet = hdkey.fromMasterSeed(seed);
      }

      this.mnemonicPhrase = mnemonic;

      if (activeIndexes.length) {
        this.activateAccounts(activeIndexes);
      }
    }
  }

  serialize(): any {
    return {
      mnemonic: this.mnemonicPhrase,
      activeIndexes: this.activeIndexes,
      derivationPath: this.derivationPath,
      passphrase: this.passphrase,
    };
  }

  changeDerivationPath(newPath: string) {
    if (!this.mnemonicPhrase) {
      throw new Error('HD wallet is not initialized.');
    }
    this.derivationPath = newPath;
    const prevIndexes = [...this.activeIndexes];
    this.activeIndexes = [];
    this.accounts = [];
    this.accountMap.clear();
    this.activateAccounts(prevIndexes);
  }

  getAccountByDerivationPath(derivationPath: string, index: number) {
    if (!this.mnemonicPhrase) {
      throw new Error('HD wallet is not initialized.');
    }
    const root = this.hdWallet.derive(derivationPath);
    const childKey = root!.deriveChild(index);
    const keyPair = ECPair.fromPrivateKey(childKey!.privateKey!, {
      network: this.network,
    });
    return keyPair.publicKey.toString('hex');
  }

  addNewAccounts(count = 1) {
    const newAccounts: ECPairInterface[] = [];
    let addedAccounts = false;
    let index = 0;
    while (!addedAccounts) {
      const {keyPair} = this.deriveAccountPrivateData(index);
      if (!this.accounts.includes(keyPair)) {
        this.accounts.push(keyPair);
        newAccounts.push(keyPair);
        this.activeIndexes.push(index);
        count--;
        if (count === 0) {
          addedAccounts = true;
        }
      }
      index++;
    }

    const accountKeys = newAccounts.map(acc => acc.publicKey.toString('hex'));
    return Promise.resolve(accountKeys);
  }

  activateAccounts(indexes: number[]) {
    this.accounts = [];
    const addresses: string[] = [];
    indexes.forEach(index => {
      const accountData = this.deriveAccountPrivateData(index);
      this.accounts.push(accountData.keyPair);
      addresses.push(accountData.address);
      this.activeIndexes.push(index);
    });
    return addresses;
  }

  private deriveAccountPrivateData(index: number): {
    address: string;
    keyPair: ECPairInterface;
  } {
    if (!this.accountMap.has(index)) {
      const hdRoot = this.hdWallet.derive(this.derivationPath);
      const childKey = hdRoot?.deriveChild(index);
      const keyPair = ECPair.fromPrivateKey(childKey!.privateKey!, {
        network: this.network,
      });
      const address = keyPair.publicKey.toString('hex');
      this.accountMap.set(index, {address, keyPair});
    }
    return this.accountMap.get(index)!;
  }
}
