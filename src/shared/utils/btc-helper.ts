import BigNumber from 'bignumber.js';
import {ECPair, bitcoin, getBitcoinNetwork} from '@/src/background/utils';
import {Network} from '@/src/wallet-instance';

export const toXOnly = (pubKey: Buffer) =>
  pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);

export const validator = (
  pubkey: Buffer,
  msghash: Buffer,
  signature: Buffer,
): boolean => ECPair.fromPublicKey(pubkey).verify(msghash, signature);

export const schnorrValidator = (
  pubkey: Buffer,
  msghash: Buffer,
  signature: Buffer,
): boolean => {
  return ECPair.fromPublicKey(pubkey).verifySchnorr(msghash, signature);
};

export function satoshisToAmount(val: number = 0): string {
  if (val === 0) return '0';
  const num = new BigNumber(val);
  const btc = num.dividedBy(100000000);
  const [integerPart, decimalPart] = btc.toFixed(8).split('.');
  const formattedIntegerPart = Number(integerPart).toLocaleString();
  const formattedAmount =
    decimalPart && Number(decimalPart) > 0
      ? `${formattedIntegerPart}.${decimalPart.replace(/0+$/, '')}`
      : formattedIntegerPart;
  return formattedAmount;
}

export const formatNumberForDisplay = (value: string): string => {
  const [integerPart, decimalPart] = value.split('.');
  const formattedIntegerPart = Number(integerPart).toLocaleString();
  return decimalPart
    ? `${formattedIntegerPart}.${decimalPart}`
    : formattedIntegerPart;
};

export function amountToSatoshis(val: any) {
  const num = new BigNumber(val);
  return num.multipliedBy(100000000).toNumber();
}

export function convertScriptToAddress(
  scriptPk: string | Buffer,
  networkType: Network = Network.MAINNET,
) {
  const network = getBitcoinNetwork(networkType);
  try {
    const address = bitcoin.address.fromOutputScript(
      typeof scriptPk === 'string' ? Buffer.from(scriptPk, 'hex') : scriptPk,
      network,
    );
    return address;
  } catch (e) {
    return '';
  }
}

export function calculateAmount(value, decimal = 0) {
  if (!Number(value)) {
    return '0';
  }

  return (Number(value) / 10 ** decimal).toString();
}

export const formatNumberValue = (num: string) => {
  if (num === '') {
    return '';
  }
  const formatted = new Intl.NumberFormat('en-US').format(Number(num));
  return formatted;
};
export const formatAmountNumber = (num: string) => {
  if (num === '') {
    return '';
  }
  const parts = num.split('.');
  parts[0] = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 8,
  }).format(Number(parts[0]));

  return parts.join('.');
};

export const formatTicker = (ticker: string) => {
  if (!ticker) {
    return '';
  }
  if (
    ticker.startsWith('"') ||
    ticker.endsWith('"') ||
    ticker.trim().length !== ticker.length
  ) {
    return `"${ticker}"`;
  }

  return ticker;
};
