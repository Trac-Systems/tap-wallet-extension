import {calculateAmount} from './btc-helper';
import {TokenInfo, TokenBalance, TokenTransfer} from '@/src/wallet-instance';

export interface TapTokenInfo {
  tick: string;
  max: string;
  lim: string;
  dec: number;
  blck: number;
  tx: string;
  vo: number;
  ins: string;
  num: number;
  ts: number;
  addr: string;
  crsd: boolean;
  dmt: boolean;
  elem: any | null;
  prj: any | null;
  dim: any | null;
  dt: any | null;
  prv: string;
}

export interface TapTokenBalance {
  ticker: string;
  overallBalance: string;
  transferableBalance: string;
}

export interface TapTokenTransfer {
  addr: string;
  blck: number;
  amt: string;
  trf: string;
  bal: string;
  tx: string;
  vo: number;
  ins: string;
  num: number;
  ts: number;
  fail: boolean;
  int: boolean;
}

export const convertTapTokenInfo = (tapTokenInfo: TapTokenInfo): TokenInfo => {
  if (!tapTokenInfo) {
    return {
      totalSupply: '0',
      totalMinted: '0',
      decimal: 0,
      holder: '',
      inscriptionId: '',
      dmt: false,
    };
  }
  return {
    totalSupply: calculateAmount(tapTokenInfo.max, tapTokenInfo.dec),
    totalMinted: '0',
    decimal: tapTokenInfo?.dec,
    holder: '',
    inscriptionId: tapTokenInfo.ins,
    dmt: tapTokenInfo.dmt,
  };
};

export const convertTapTokenBalance = (
  tapTokenBalance: TapTokenBalance,
  decimal: number,
): TokenBalance => {
  if (!tapTokenBalance) {
    return {
      ticker: '',
      overallBalance: '0',
      transferableBalance: '0',
      availableBalance: '0',
      availableBalanceSafe: '0',
      availableBalanceUnSafe: '0',
    };
  }
  const availableBalance =
    Number(tapTokenBalance.overallBalance) -
    Number(tapTokenBalance.transferableBalance);
  return {
    ticker: tapTokenBalance.ticker,
    overallBalance: calculateAmount(tapTokenBalance.overallBalance, decimal),
    transferableBalance: calculateAmount(
      tapTokenBalance.transferableBalance,
      decimal,
    ),
    availableBalance: calculateAmount(availableBalance.toString(), decimal),
    availableBalanceSafe: '0',
    availableBalanceUnSafe: '0',
  };
};

export const convertTapTokenTransferList = (
  data: TapTokenTransfer[],
  decimal: number,
): TokenTransfer[] => {
  const result: TokenTransfer[] = [];
  data?.forEach(v => {
    const transfer: TokenTransfer = {
      ticker: '',
      amount: calculateAmount(v.amt, decimal),
      inscriptionId: v.ins,
      inscriptionNumber: v.num,
      timestamp: v.ts,
    };
    result.push(transfer);
  });
  return result;
};
