import {
  AddressTokenSummary,
  Network,
  TokenAuthority,
  TokenBalance,
} from '../../wallet-instance';
import {networkConfig} from '../service/singleton';
import {AxiosRequest} from './axios';

import {isEmpty, max} from 'lodash';
import {mempoolApi} from '.';
import {
  TapTokenInfo,
  convertTapTokenBalance,
  convertTapTokenInfo,
  convertTapTokenTransferList,
} from '../../shared/utils/tap-response-adapter';
import {calculateAmount} from '../../shared/utils/btc-helper';
import {PaidApi} from './paid-api';

const TAP_API_TESTNET = 'http://31.204.118.7:55005';
const TAP_API_MAINNET = 'https://tap-reader-tw.tap-hosting.xyz';
const TAPALYTIC_API_MAINNET = 'https://api.tapapi.xyz';

export class TapApi {
  api!: AxiosRequest;
  tapalyticApi!: AxiosRequest;
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
    this.tapalyticApi = new AxiosRequest({
      baseUrl: TAPALYTIC_API_MAINNET,
    });
    if (network === Network.TESTNET) {
      this.api = new AxiosRequest({
        baseUrl: TAP_API_TESTNET,
      });
      this.tapalyticApi = undefined;
    }
  }

  async getDeployment(ticker: string): Promise<TapTokenInfo> {
    const response = await this.api.get(
      `/getDeployment/${encodeURIComponent(ticker)}`,
      {},
    );
    return response?.data?.result;
  }

  // get list tap tokens by address
  //! Optimize version
  //   async getAddressTapTokens(
  //   address: string,
  //   offset: number,
  //   max: number,
  // ): Promise<{ list: TokenBalance[]; total: number }> {
  //   try {
  //     const response = await this.api.get(`/getAccountTokensBalance/${address}`, {
  //       offset,
  //       max,
  //     });

  //     // Validate response structure
  //     const data = response?.data?.data;
  //     if (!data || !Array.isArray(data.list)) {
  //       return { list: [], total: 0 };
  //     }

  //     // Fetch all token info in parallel
  //     const tokenInfos = await Promise.all(
  //       data.list.map((tokenBalance) => this.getDeployment(tokenBalance.ticker))
  //     );

  //     // Process balances
  //     const list = data.list.map((tokenBalance, index) => {
  //       const tokenInfo = tokenInfos[index];
  //       return {
  //         ...tokenBalance,
  //         overallBalance: calculateAmount(tokenBalance.overallBalance, tokenInfo?.dec),
  //         transferableBalance: calculateAmount(tokenBalance.transferableBalance, tokenInfo?.dec),
  //         tokenInfo,
  //       };
  //     });

  //     return {
  //       list,
  //       total: data.total ?? 0,
  //     };
  //   } catch (error) {
  //     console.error('Failed to fetch token balances:', error);
  //     return { list: [], total: 0 };
  //   }
  // }
  //! Slow version
  async getAddressTapTokens(
    address: string,
    offset: number,
    max: number,
  ): Promise<{list: TokenBalance[]; total: number}> {
    const response = await this.api.get(`/getAccountTokensBalance/${address}`, {
      offset,
      max,
    });
    const list: TokenBalance[] = [];
    // Ensure response data is valid before accessing
    if (
      !response?.data ||
      !response.data?.data ||
      !Array.isArray(response.data.data?.list)
    ) {
      return {list: [], total: 0}; // Safe fallback return
    }

    // eslint-disable-next-line no-unsafe-optional-chaining
    for (const tokenBalance of response.data?.data?.list) {
      const tokenInfo = await this.getDeployment(tokenBalance.ticker);
      list.push({
        ...tokenBalance,
        overallBalance: calculateAmount(
          tokenBalance.overallBalance,
          tokenInfo?.dec,
        ),
        transferableBalance: calculateAmount(
          tokenBalance.transferableBalance,
          tokenInfo?.dec,
        ),
        tokenInfo: tokenInfo,
      });
    }
    return {
      list,
      total: response.data?.data?.total ?? 0,
    };
  }

  async getAllAddressTapTokens(address: string) {
    const allTapTokens: TokenBalance[] = [];
    let offset = 0;
    const max = 100;

    // Paginate through the runes list
    let response = await this.getAddressTapTokens(address, offset, max);
    // let response = await this.getBtcUtxo(address, offset, max);
    const total = response?.total || 0;

    if (response.list) {
      allTapTokens.push(...response?.list);
    }

    while (offset + max < total) {
      offset += max;
      response = await this.getAddressTapTokens(address, offset, max);
      allTapTokens.push(...response?.list);
    }

    return allTapTokens;
  }

  async getDmtAddressTapTokens(address: string) {
    const allTokens = await this.getAllAddressTapTokens(address);
    return allTokens.filter(token => token.tokenInfo?.dmt);
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
    allInscriptions?: any[],
  ): Promise<AddressTokenSummary> {
    const response = await this.api.get(
      `/getAccountTokenDetail/${address}/${encodeURIComponent(ticker)}`,
      {},
    );

    if (isEmpty(response.data)) {
      throw new Error(
        `Token ${encodeURIComponent(ticker)} don't have in your account`,
      );
    }

    let totalMinted = '0';
    try {
      totalMinted = await this.getTokenTotalMinted(ticker);
    } catch (error) {
      console.log('Error getting total minted:', error);
    }

    let _allInscriptions = allInscriptions;
    if (!allInscriptions || allInscriptions.length === 0) {
      const paidApi = new PaidApi();
      _allInscriptions = await paidApi.getAllInscriptions(address);
    }

    let list = response?.data?.data?.transferList?.filter(v => !v.fail) || [];

    let transferableList = convertTapTokenTransferList(
      list,
      response?.data?.data?.tokenInfo?.dec,
    );

    if (_allInscriptions && _allInscriptions.length > 0) {
      const allInscriptionIdSet = new Set(
        _allInscriptions.map(ins => ins.inscriptionId),
      );
      transferableList = transferableList.filter(item =>
        allInscriptionIdSet.has(item.inscriptionId),
      );
    }

    const result = {
      tokenInfo: convertTapTokenInfo(
        response?.data?.data?.tokenInfo,
        totalMinted,
      ),
      tokenBalance: convertTapTokenBalance(
        response?.data?.data?.tokenBalance,
        response?.data?.data?.tokenInfo?.dec,
      ),
      historyList: [],
      transferableList: transferableList,
    };
    return result;
  }

  async getTapTransferAbleLength(
    address: string,
    ticker: string,
  ): Promise<number> {
    const response = await this.api.get(
      `/getAccountTransferListLength/${address}/${encodeURIComponent(ticker)}`,
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
      `/getAccountTransferList/${address}/${encodeURIComponent(ticker)}`,
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
    const tokenInfo = await this.getDeployment(ticker);
    return {
      total,
      list: convertTapTokenTransferList(list, tokenInfo.dec),
    };
  }

  async getAccountMintsListByTicker(
    address: string,
    ticker: string,
    offset: number,
    max: number,
  ) {
    const response = await this.api.get(
      `/getAccountMintList/${address}/${encodeURIComponent(ticker)}`,
      {max, offset},
    );
    return response?.data?.result;
  }

  async getTotalAccountMintsListByTicker(address: string, ticker: string) {
    const response = await this.api.get(
      `/getAccountMintListLength/${address}/${encodeURIComponent(ticker)}`,
      {},
    );
    return response.data?.result || 0;
  }

  async getAccountAllMintsListByTicker(address: string, ticker: string) {
    const total = await this.getTotalAccountMintsListByTicker(address, ticker);
    const maxPerPage = 50; // Adjust as needed
    let offset = 0;
    const allResults: any[] = [];

    while (offset < total) {
      const results = await this.getAccountMintsListByTicker(
        address,
        ticker,
        offset,
        maxPerPage,
      );
      if (!results || results.length === 0) break;

      allResults.push(...results);
      offset += maxPerPage;
    }

    return allResults;
  }

  async getTotalAddressDmtMintList(address: string) {
    const response = await this.api.get(
      `/getDmtMintWalletHistoricListLength/${address}`,
      {},
    );
    return response.data?.result || 0;
  }

  async getAddressDmtMintList(address: string, offset: number, max: number) {
    const response = await this.api.get(
      `/getDmtMintWalletHistoricList/${address}`,
      {
        max,
        offset,
      },
    );
    return response?.data?.result;
  }

  async getAllAddressDmtMintList(address: string) {
    const total = await this.getTotalAddressDmtMintList(address);
    const maxPerPage = 50; // Adjust as needed
    let offset = 0;
    const allResults: any[] = [];

    while (offset < total) {
      const results = await this.getAddressDmtMintList(
        address,
        offset,
        maxPerPage,
      );
      if (!results || results.length === 0) break;

      allResults.push(...results);
      offset += maxPerPage;
    }

    return allResults;
  }

  // async getInscriptionScriptByTicker(ticker: string) {
  //   if (!this.tapalyticApi) {
  //     return;
  //   }

  //   const response = await this.tapalyticApi.get(
  //     `/v1/unats/${encodeURIComponent(ticker)}`,
  //     {},
  //   );
  //   return response?.data?.unats[0]?.script_inscription;
  // }

  // get total token authority
  async getTotalTokenAuthority(address: string) {
    const response = await this.api.get(
      `/getAccountAuthListLength/${address}`,
      {},
    );
    return response?.data?.result || 0;
  }

  // get authority canceled
  async getAuthorityCanceled(inscriptionId: string) {
    const response = await this.api.get(
      `/getAuthCancelled/${inscriptionId}`,
      {},
    );
    return response?.data?.result as boolean;
  }
  // get authority list
  async getAuthorityList(
    address: string,
    offset: number,
    max: number,
  ): Promise<TokenAuthority[]> {
    const response = await this.api.get(`/getAccountAuthList/${address}`, {
      offset,
      max,
    });
    return response?.data?.result as TokenAuthority[];
  }

  // get all authority list
  async getAllAuthorityList(address: string) {
    const total = await this.getTotalTokenAuthority(address);
    let offset = 0;
    const authorityList: TokenAuthority[] = [];
    const filteredAuthorityList = [];
    while (offset < total) {
      const result = await this.getAuthorityList(address, offset, 500);
      if (result) {
        authorityList.push(...result);
      }
      offset += 500;
    }
    for (const authority of authorityList) {
      const isCanceled = await this.getAuthorityCanceled(authority.ins);
      // remove canceled authority
      // remove authority no apply for all token
      if (!isCanceled && authority.auth.length === 0) {
        filteredAuthorityList.push(authority);
      }
    }
    return filteredAuthorityList;
  }

  async getTokenTotalMinted(ticker: string): Promise<string> {
    try {
      const response = await this.api.get(
        `/getMintTokensLeft/${encodeURIComponent(ticker)}`,
        {},
      );
      const tokensLeft = response?.data?.result || '0';

      const deploymentInfo = await this.getDeployment(ticker);
      const totalSupply = deploymentInfo?.max || '0';

      const totalMinted = (BigInt(totalSupply) - BigInt(tokensLeft)).toString();

      return totalMinted;
    } catch (error) {
      return '0';
    }
  }
}
