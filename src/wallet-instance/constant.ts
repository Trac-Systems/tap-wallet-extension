import {AddressType, Network} from './types';
export const COIN_DUST = 1000;

export const WALLET_TYPE = {
  HdWallet: 'HD Wallet',
  SingleWallet: 'Single Wallet',
};

export const ACCOUNT_TYPE_TEXT = {
  [WALLET_TYPE.HdWallet]: 'Account',
  [WALLET_TYPE.SingleWallet]: 'Private Key',
};

export const EVENTS = {
  broadcastToUI: 'broadcastToUI',
  broadcastToBackground: 'broadcastToBackground',
  SIGN_FINISHED: 'SIGN_FINISHED',
  WALLETCONNECT: {
    STATUS_CHANGED: 'WALLETCONNECT_STATUS_CHANGED',
    INIT: 'WALLETCONNECT_INIT',
    INITED: 'WALLETCONNECT_INITED',
  },
};

export const UTXO_DUST = 546;
export const UNCONFIRMED_HEIGHT = 4194303;

export const ADDRESS_TYPES: {
  [key: string]: {
    value: AddressType;
    label: string;
    name: string;
    derivationPath: string;
    displayIndex: number;
  };
} = {
  P2PKH: {
    value: AddressType.P2PKH,
    label: 'P2PKH',
    name: 'Legacy (P2PKH)',
    derivationPath: 'm/44\'/0\'/0\'/0',
    displayIndex: 3,
  },
  P2WPKH: {
    value: AddressType.P2WPKH,
    label: 'P2WPKH',
    name: 'Native Segwit (P2WPKH)',
    derivationPath: 'm/84\'/0\'/0\'/0',
    displayIndex: 1,
  },
  P2SH_P2WPKH: {
    value: AddressType.P2SH_P2WPKH,
    label: 'P2SH-P2WPKH',
    name: 'Nested Segwit (P2SH-P2WPKH)',
    derivationPath: 'm/49\'/0\'/0\'/0',
    displayIndex: 2,
  },
  M44_P2TR: {
    value: AddressType.M44_P2TR,
    label: 'P2TR',
    name: 'Taproot (P2TR)',
    derivationPath: 'm/86\'/0\'/0\'/0',
    displayIndex: 0,
  },
};

export const NETWORK_TYPES = {
  MAINNET: {
    value: Network.MAINNET,
    label: 'MAINNET',
    name: 'mainnet',
    validNames: [0, 'livenet', 'mainnet'],
  },
  TESTNET: {
    value: Network.TESTNET,
    label: 'TESTNET',
    name: 'testnet',
    validNames: ['testnet'],
  },
};

export const RestoreTypes = {
  MNEMONIC: 'recovery',
  PRIVATE_KEY: 'private',
};
