import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import {AppDispatch, AppState} from '../redux/store';
import moment from 'moment';
import {AddressType, Network} from '@/src/wallet-instance';
import {networkConfig} from '@/src/background/service/singleton';
import {bitcoin} from '../../background/utils';

export const PAGE_SIZE = 100;
export const TOKEN_PAGE_SIZE = 20;

export enum AmountInput {
  FEE_RATE,
  BTC,
}

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;

type UiTypeCheck = {
  isTab: boolean;
  isNotification: boolean;
  isPop: boolean;
};

const UI_TYPE = {
  Tab: 'index',
  Pop: 'popup',
  Notification: 'notification',
};

export enum DateFormats {
  'DayMonthYearWithSlash' = 'DD/MM/YYYY',
  'MonthDayYear' = 'MMM D, YYYY',
  'FullDateTime' = 'MMM D, YYYY [at] h:mm a',
  'DateTimeBase' = 'YYYY-MM-DD hh:mm:ss',
}

export const getUiType = (): UiTypeCheck => {
  const {pathname} = window.location;
  return Object.entries(UI_TYPE).reduce((m, [key, value]) => {
    m[`is${key}`] = pathname === `/${value}.html`;

    return m;
  }, {} as UiTypeCheck);
};

export function convertTimestampToDeviceTime(timestamp: number) {
  const date = moment(timestamp * 1000).format(DateFormats.DateTimeBase);
  return date;
}

export function getTxIdUrl(txid: string, network: Network) {
  if (network === Network.MAINNET) {
    return `https://mempool.space/tx/${txid}`;
  } else {
    return `https://mempool.space/testnet/tx/${txid}`;
  }
}

export function getInsUrl(insId: string, network: Network) {
  if (network === Network.MAINNET) {
    return `https://ordiscan.com/inscription/${insId}`;
  } else {
    return `http://trac.intern.ungueltig.com:55002/inscription/${insId}`;
  }
}

export const satoshisToBTC = (amount: number) => {
  return amount / 100000000;
};

export const btcToSatoshis = (amount: number) => {
  return Math.floor(amount * 100000000);
};

export const validateBtcAddress = (addr: string, networkType: Network) => {
  try {
    const network =
      networkType === Network.MAINNET
        ? bitcoin.networks.bitcoin
        : bitcoin.networks.testnet;
    bitcoin.address.toOutputScript(addr, network);
    return true;
  } catch (e) {
    return false;
  }
};

export const validateAmountInput = (value: string, type: AmountInput) => {
  switch (type) {
    case AmountInput.FEE_RATE:
      return /^[1-9]\d*$/.test(value);
    case AmountInput.BTC:
    default:
      return /^\d*\.?\d{0,8}$/.test(value);
  }
};

export const isValidAmount = (value: string): boolean => {
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();

  // Reject empty string
  if (trimmed === '') return false;

  // Use a strict regex to allow only valid number formats (optional decimal)
  const validNumberPattern = /^\d+(\.\d+)?$/;

  return validNumberPattern.test(trimmed) && isFinite(Number(trimmed));
};

export const validateTapTokenAmount = (value: string, decimals?: number) => {
  const validateAmount = isValidAmount(value);
  if (!validateAmount) return false;
  const parts = value.toString().split('.');
  return parts.length === 1 || parts[1].length <= decimals;
};

export async function sleep(timeSec: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(null);
    }, timeSec * 1000);
  });
}

export function shortAddress(address?: string, len = 5) {
  if (!address) {
    return '';
  }
  if (address.length <= len * 2) {
    return address;
  }
  return address.slice(0, len) + '...' + address.slice(address.length - len);
}
export function shortNameAccount(name?: string, len = 10) {
  if (!name) {
    return '';
  }
  if (name.length <= len * 2) {
    return name;
  }
  return name.slice(0, len * 2) + '...';
}

export function calculateAmount(value) {
  if (!Number(value)) {
    return '0';
  }

  return (Number(value) / 10 ** 18).toString();
}

export function formatAddressLongText(
  text: string = '',
  startLength: number = 8,
  endLength: number = 6,
): string {
  if (text.length <= startLength + endLength) {
    return text;
  }

  const start = text.slice(0, startLength);
  const end = text.slice(-endLength);

  return `${start}...${end}`;
}

export function getAddressType(address: string): AddressType {
  const networks = [
    bitcoin.networks.bitcoin,
    bitcoin.networks.testnet,
    bitcoin.networks.regtest,
  ];
  let addressType: AddressType = AddressType.UNKNOWN;

  if (
    address.startsWith('bc1') ||
    address.startsWith('tb1') ||
    address.startsWith('bcrt1')
  ) {
    try {
      const {version, data} = bitcoin.address.fromBech32(address);

      if (version === 0 && data.length === 20) {
        addressType = AddressType.P2WPKH;
      } else if (version === 1 && data.length === 32) {
        addressType = AddressType.P2TR;
      }
    } catch (e) {
      console.error('Bech32 decode error:', e);
    }
  } else {
    try {
      const {version} = bitcoin.address.fromBase58Check(address);

      networks.forEach(network => {
        if (version === network.pubKeyHash) {
          addressType = AddressType.P2PKH;
        } else if (version === network.scriptHash) {
          addressType = AddressType.P2SH_P2WPKH;
        }
      });
    } catch (e) {
      console.error('Base58 decode error:', e);
    }
  }

  return addressType;
}

function generateBrightColor() {
  const h = Math.floor(Math.random() * 360); // Hue: từ 0 đến 360 độ
  const s = Math.floor(Math.random() * 50) + 50; // Saturation: từ 50% đến 100%
  const l = Math.floor(Math.random() * 30) + 50; // Lightness: từ 50% đến 80%

  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function generateUniqueColors(count: number) {
  const colors = new Set();

  while (colors.size < count) {
    colors.add(generateBrightColor());
  }
  return Array.from(colors) as string[];
}

function getBrowser() {
  if (typeof globalThis.browser === 'undefined') {
    return chrome;
  } else {
    return globalThis.browser;
  }
}

export const getIsExtensionInTab = async () => {
  const browser = getBrowser();
  const data = await browser.tabs.getCurrent();
  return Boolean(data);
};

export const getRenderDmtLink = (network: Network) => {
  let link = 'http://157.230.45.91:8081/render-dmt';
  if (network === Network.MAINNET) {
    link = 'https://dmt.tapalytics.xyz/render';
  }
  return link;
};

export const getInscriptionContentLink = (network: Network) => {
  let link = 'http://trac.intern.ungueltig.com:55002/content';
  if (network === Network.MAINNET) {
    link = 'https://ordiscan.com/content';
  }
  return link;
};
