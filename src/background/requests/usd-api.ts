import {AxiosRequest} from './axios';

const API_USD = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';
export class UsdAPI {
  api!: AxiosRequest;
  constructor() {
    this.api = new AxiosRequest({
      baseUrl: API_USD,
    });
  }

  async getUSDPrice(): Promise<any> {
    const response = await this.api.get('/', {});
    return response?.data?.data?.amount;
  }
}
