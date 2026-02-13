import {Network} from '../../wallet-instance';
import {networkConfig} from '../service/singleton';
import {AxiosRequest} from './axios';

export const MEMPOOL_API_TESTNET = 'https://mempool.space/testnet';
export const MEMPOOL_API_MAINNET = 'https://mempool.space';
export const API_ELECTRS_TESTNET = 'http://trac.intern.ungueltig.com:55001';
export const API_ELECTRS_MAINNET = 'https://electrs-tw.tap-hosting.xyz';

export class MempoolApi {
  api_mempool!: AxiosRequest;
  api_electrs!: AxiosRequest;

  private rawTxCache = new Map<string, string>();

  constructor() {
    if (!this.api_mempool || !this.api_electrs) {
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
    this.api_mempool = new AxiosRequest({
      baseUrl: MEMPOOL_API_MAINNET,
      //   apiKey: PAID_API_KEY_MAINNET,
    });
    if (network === Network.TESTNET) {
      this.api_mempool = new AxiosRequest({
        baseUrl: MEMPOOL_API_TESTNET,
        // apiKey: PAID_API_KEY_TESTNET,
      });
      this.api_electrs = new AxiosRequest({
        baseUrl: API_ELECTRS_TESTNET,
      });
    } else {
      this.api_electrs = new AxiosRequest({
        baseUrl: API_ELECTRS_MAINNET,
      });
    }
  }

  async getRecommendFee(): Promise<any> {
    const response = await this.api_mempool.get('api/v1/fees/recommended', {});
    return response.data;
  }

  async pushTx(rawTx: string) {
    const response = await this.api_electrs.postAsPlainText('/tx', rawTx);
    return response?.data;
  }

  async getUtxoData(address: string) {
    const response = await this.api_electrs.get(`address/${address}/utxo`, {});
    return response.data;
  }

  async getRawTxHex(txid: string): Promise<string> {
    if (this.rawTxCache.has(txid)) {
      return this.rawTxCache.get(txid)!;
    }

    const response = await this.api_electrs.get(`/tx/${txid}/hex`, {});
    const rawWithWitness = response.data;
    this.rawTxCache.set(txid, rawWithWitness);
    return rawWithWitness;
  }

  async getAddressTransactions(address: string, afterTxid?: string): Promise<any[]> {
    let url = `/api/address/${address}/txs`;
    if (afterTxid) {
      url += `?after_txid=${afterTxid}`;
    }
    const response = await this.api_mempool.get(url, {});
    return response.data;
  }
}
