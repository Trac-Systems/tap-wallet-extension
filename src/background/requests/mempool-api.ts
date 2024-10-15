import {Network} from '../../wallet-instance';
import {networkConfig} from '../service/singleton';
import {AxiosRequest} from './axios';

export const MEMPOOL_API_TESTNET = 'https://mempool.space/testnet';
export const MEMPOOL_API_MAINNET = 'https://mempool.space';

export class MempoolApi {
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
      baseUrl: MEMPOOL_API_MAINNET,
      //   apiKey: PAID_API_KEY_MAINNET,
    });
    if (network === Network.TESTNET) {
      this.api = new AxiosRequest({
        baseUrl: MEMPOOL_API_TESTNET,
        // apiKey: PAID_API_KEY_TESTNET,
      });
    }
  }

  async getRecommendFee(): Promise<any> {
    const response = await this.api.get('api/v1/fees/recommended', {});
    return response.data;
  }

  async pushTx(rawTx: string) {
    const response = await this.api.postAsPlainText('/api/tx', rawTx);
    return response?.data;
  }

  async getUtxoData(address: string) {
    const response = await this.api.get(`api/address/${address}/utxo`, {});
    return response.data;
  }
}
