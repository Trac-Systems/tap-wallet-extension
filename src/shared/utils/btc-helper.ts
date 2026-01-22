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
  if (num === undefined || num === null) {
    return '';
  }
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

/**
 * Format TRAC balance to max 8 decimal places with ...
 * @param balance - TRAC balance string
 * @returns Formatted balance string with max 8 decimals and ... if truncated
 */
export const formatTracBalance = (balance: string | undefined): string => {
  if (!balance || balance === '0') return '0';

  const num = parseFloat(balance);
  if (isNaN(num)) return '0';

  // Check if has more than 8 decimal places
  const decimalPart = balance.split('.')[1];
  if (decimalPart && decimalPart.length > 8) {
    return num.toFixed(8) + '...';
  }

  return balance;
};

/**
 * Format price with subscript notation for consecutive zeros
 * If there are 4 or more consecutive zeros after decimal point, use subscript notation
 * Example: 0.00003773 -> 0.0₄3773 (max 5 chars after zeros)
 * @param price - Price string
 * @returns Formatted price string
 */
export const formatPriceWithSubscript = (price: string | number): string => {
  const priceStr = typeof price === 'number' ? price.toString() : price;
  const num = parseFloat(priceStr);

  if (isNaN(num) || num === 0) return '0.00';

  // Convert to string with enough precision
  const priceString = num.toFixed(20).replace(/\.?0+$/, '');
  const parts = priceString.split('.');

  if (parts.length === 1) {
    // No decimal part, format as integer
    return formatNumberValue(parts[0]);
  }

  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Count consecutive zeros at the start of decimal part
  let zeroCount = 0;
  for (let i = 0; i < decimalPart.length; i++) {
    if (decimalPart[i] === '0') {
      zeroCount++;
    } else {
      break;
    }
  }

  // If less than 4 zeros, use normal format
  if (zeroCount < 4) {
    return priceString;
  }

  // Get the significant digits after zeros (max 5 chars)
  const significantPart = decimalPart.substring(zeroCount, zeroCount + 5);

  // Map digits to subscript Unicode characters
  const subscriptMap: { [key: string]: string } = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
  };

  const subscriptZeroCount = zeroCount.toString().split('').map(d => subscriptMap[d]).join('');

  return `${integerPart}.0${subscriptZeroCount}${significantPart}`;
};
