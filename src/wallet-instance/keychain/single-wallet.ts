import {isTaprootInput, toXOnly} from 'bitcoinjs-lib/src/psbt/bip371';
import {
  ECPair,
  ECPairInterface,
  bitcoin,
} from '@/src/background/utils/bitcoin-core';
import bitcoinMessage from 'bitcoinjs-message';
import {decode} from 'bs58check';
import {isEmpty} from 'lodash';

const WALLET_TYPE = 'Single Wallet';

export class SingleWallet {
  static type = WALLET_TYPE;
  type = WALLET_TYPE;
  network: bitcoin.Network = bitcoin.networks.bitcoin;
  accounts: ECPairInterface[] = [];

  constructor(options?: any) {
    if (options) {
      this.initializeWallet(options);
    }
  }

  async initializeWallet(options: any) {
    if (!isEmpty(options.privateKeys)) {
      for (const key of options.privateKeys) {
        const account = this.generateKeyPair(key);
        this.accounts.push(account);
      }
    }
  }

  serialize(): {privateKeys: string[]} {
    return {
      privateKeys: this.accounts.map(account =>
        account.privateKey?.toString('hex'),
      ),
    };
  }

  // Helper method to generate keypair from private key input
  private generateKeyPair(key: string): ECPairInterface {
    if (key.length === 51 || key.length === 52) {
      return this.fromWIF(key);
    } else if (key.length === 64 || key.length === 66) {
      return this.fromHex(key);
    } else {
      throw new Error('Invalid private key format');
    }
  }

  private fromWIF(key: string): ECPairInterface {
    try {
      const buf = decode(key).slice(1, 33);
      return ECPair.fromPrivateKey(buf);
    } catch {
      throw new Error('Invalid WIF format');
    }
  }

  private fromHex(key: string): ECPairInterface {
    try {
      const privateKeyBuffer = Buffer.from(key, 'hex');
      return ECPair.fromPrivateKey(privateKeyBuffer);
    } catch {
      throw new Error('Invalid Hexadecimal format');
    }
  }

  exportPrivateKey(publicKey: string) {
    const keyPair = this.retrievePrivateKey(publicKey);
    return keyPair.privateKey?.toString('hex');
  }

  retrievePublicKeys() {
    return this.accounts.map(({publicKey}) => publicKey.toString('hex'));
  }

  async addNewAccounts(count = 1) {
    const newAccounts: ECPairInterface[] = [];
    for (let i = 0; i < count; i++) {
      newAccounts.push(ECPair.makeRandom());
    }
    this.accounts = [...this.accounts, ...newAccounts];
    return newAccounts.map(({publicKey}) => publicKey.toString('hex'));
  }

  async signTransaction(
    psbt: bitcoin.Psbt,
    inputs: {
      index: number;
      publicKey: string;
      sighashTypes?: number[];
      disableTweakSigner?: boolean;
    }[],
  ) {
    inputs.forEach(input => {
      const keyPair = this.retrievePrivateKey(input.publicKey);
      if (
        isTaprootInput(psbt.data.inputs[input.index]) &&
        !input.disableTweakSigner
      ) {
        const tweakedSigner = keyPair.tweak(
          bitcoin.crypto.taggedHash('TapTweak', toXOnly(keyPair.publicKey)),
        );
        psbt.signInput(input.index, tweakedSigner, input.sighashTypes);
      } else {
        psbt.signInput(input.index, keyPair, input.sighashTypes);
      }
    });
    return psbt;
  }

  async signMessage(publicKey: string, message: string) {
    const keyPair = this.retrievePrivateKey(publicKey);
    if (!keyPair.privateKey) {
      throw new Error('Invalid key pair');
    }
    const signature =  bitcoinMessage.sign(message, keyPair.privateKey, keyPair.compressed);
    return signature.toString('base64')
  }

  async verifyMessage(address: string, message: string, signature: string) {
    return bitcoinMessage.verify(message, address, signature);
  }

  async signData(
    publicKey: string,
    data: string,
    signatureType: 'ecdsa' | 'schnorr' = 'ecdsa',
  ) {
    const keyPair = this.retrievePrivateKey(publicKey);
    const buffer = Buffer.from(data, 'hex');
    return signatureType === 'ecdsa'
      ? keyPair.sign(buffer).toString('hex')
      : keyPair.signSchnorr(buffer).toString('hex');
  }

  private retrievePrivateKey(publicKey: string) {
    if (!publicKey) {
      throw new Error('Public key must be provided');
    }
    return this.findAccountByPublicKey(publicKey);
  }

  private findAccountByPublicKey(publicKey: string): ECPairInterface {
    const account = this.accounts.find(
      acc => acc.publicKey.toString('hex') === publicKey,
    );
    if (!account) {
      throw new Error('Account not found');
    }
    return account;
  }
}

// Refactored verification function
export function validateSignature(
  publicKey: string,
  hash: string,
  signatureType: 'ecdsa' | 'schnorr',
  signature: string,
) {
  const keyPair = ECPair.fromPublicKey(Buffer.from(publicKey, 'hex'));
  const bufferHash = Buffer.from(hash, 'hex');
  const bufferSignature = Buffer.from(signature, 'hex');
  return signatureType === 'ecdsa'
    ? keyPair.verify(bufferHash, bufferSignature)
    : keyPair.verifySchnorr(bufferHash, bufferSignature);
}
