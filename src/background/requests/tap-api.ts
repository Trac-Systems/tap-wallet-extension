import {
  AddressTokenSummary,
  Network,
  TokenBalance,
} from '../../wallet-instance';
import {networkConfig} from '../service/singleton';
import {AxiosRequest} from './axios';

import {isEmpty} from 'lodash';
import {mempoolApi} from '.';
import {
  convertTapTokenBalance,
  convertTapTokenInfo,
  convertTapTokenTransferList,
} from '../../shared/utils/tap-response-adapter';
import {calculateAmount} from '../../shared/utils/btc-helper';

const TAP_API_TESTNET = 'http://103.253.147.13:5099';
const TAP_API_MAINNET = 'http://103.253.147.13:5099';

export class TapApi {
  api!: AxiosRequest;
  constructor() {
    if (!this.api) {
      this.init();
    }
  }
  private init() {
    this.changeNetwork();
  }

  changeNetwork(network?: Network) {
    if (!network) {
      network = networkConfig.getActiveNetwork();
    }
    this.api = new AxiosRequest({
      baseUrl: TAP_API_MAINNET,
    });
    if (network === Network.TESTNET) {
      this.api = new AxiosRequest({
        baseUrl: TAP_API_TESTNET,
      });
    }
  }

  async getAddressTapTokens(
    address: string,
    offset: number,
    max: number,
  ): Promise<{list: TokenBalance[]; total: number}> {
    const response = await this.api.get(`/getAccountTokensBalance/${address}`, {
      offset,
      max,
    });
    if (response?.data?.data?.list) {
      const list = response.data?.data?.list.map(
        (tokenBalance: TokenBalance) => {
          return {
            ...tokenBalance,
            overallBalance: calculateAmount(tokenBalance.overallBalance),
            transferableBalance: calculateAmount(
              tokenBalance.transferableBalance,
            ),
          };
        },
      );
      return {
        list,
        total: response.data?.data?.total ?? 0,
      };
    }
    return {
      list: [],
      total: 0,
    };
  }

  getUtxoMap(utxoData: any) {
    const utxoMap = {};
    if (!utxoData?.length) {
      return;
    }
    utxoData.forEach(v => {
      const {status, value} = v;
      utxoMap[v.txid] = {status, value};
    });
    return utxoMap;
  }

  async getTapTokenSummary(
    address: string,
    ticker: string,
  ): Promise<AddressTokenSummary> {
    const response = await this.api.get(
      `/getAccountTokenDetail/${address}/${ticker}`,
      {},
    );

    if (isEmpty(response.data)) {
      throw new Error(`Token ${ticker} don't have in your account`);
    }
    const getUtxoResult = await mempoolApi.getUtxoData(address);
    const utxoMap = this.getUtxoMap(getUtxoResult);
    let list = [];
    if (utxoMap) {
      list = response?.data?.data?.transferList?.filter(v => {
        return !v.fail && !isEmpty(utxoMap[v.tx]);
      });
    }
    const result = {
      tokenInfo: convertTapTokenInfo(response?.data?.data?.tokenInfo),
      tokenBalance: convertTapTokenBalance(response?.data?.data?.tokenBalance),
      historyList: [],
      transferableList: convertTapTokenTransferList(list),
    };
    return result;
  }

  async getTapTransferAbleLength(
    address: string,
    ticker: string,
  ): Promise<number> {
    const response = await this.api.get(
      `/getAccountTransferListLength/${address}/${ticker}`,
      {},
    );
    return response?.data?.result || 0;
  }

  async getTapTransferAbleList(
    address: string,
    ticker: string,
    offset: number,
    max: number,
  ) {
    let total = await this.getTapTransferAbleLength(address, ticker);
    const response = await this.api.get(
      `/getAccountTransferList/${address}/${ticker}`,
      {
        max,
        offset,
      },
    );
    const getUtxoResult = await mempoolApi.getUtxoData(address);
    const utxoMap = this.getUtxoMap(getUtxoResult);
    let list = [];
    if (utxoMap) {
      list = response?.data?.result.filter(v => {
        if (!v.fail && !isEmpty(utxoMap[v.tx])) {
          return true;
        } else {
          total--;
        }
      });
    }
    return {
      total,
      list: convertTapTokenTransferList(list),
    };
  }
}
