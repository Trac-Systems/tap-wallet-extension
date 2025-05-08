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
}
