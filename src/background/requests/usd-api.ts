import { AxiosRequest } from './axios';
import {
  SupportedToken,
  TOKEN_PRICE_API
} from '@/src/shared/constants/token-price';
import { INSCRIBE_API_MAINNET, INSCRIBE_API_TESTNET } from './inscribe-api';
import { Network } from '@/src/wallet-instance';
import { networkConfig } from '../service/singleton';

const API_BTC_USD = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';

export class UsdAPI {
  api_btc!: AxiosRequest;
  api_token!: AxiosRequest;

  constructor() {
    this.api_btc = new AxiosRequest({
      baseUrl: API_BTC_USD,
    });
    if (!this.api_token) {
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
    this.api_token = new AxiosRequest({
      baseUrl:
        network === Network.MAINNET
          ? INSCRIBE_API_MAINNET
          : INSCRIBE_API_TESTNET,
    });
  }

  async getUSDPrice(): Promise<any> {
    const response = await this.api_btc.get('/', {});
    return response?.data?.data?.amount;
  }

  async getTokenUSDPrice(ticker: SupportedToken): Promise<number> {
    try {
      const response = await this.api_token.get(
        `${TOKEN_PRICE_API.PATH}/${ticker}`,
        {},
      );

      if (!response?.data) {
        throw new Error('Token price API error: No response data');
      }

      const result = response.data;

      if (result?.statusCode !== 200) {
        throw new Error(`Token price API error: ${result?.message || 'Unknown error'}`);
      }

      const priceValue = result?.data?.price_usd;

      // Handle both string and number formats
      let price: number;
      if (typeof priceValue === 'string') {
        price = parseFloat(priceValue);
      } else if (typeof priceValue === 'number') {
        price = priceValue;
      } else {
        throw new Error('Invalid price data from token price API');
      }

      if (isNaN(price)) {
        throw new Error('Invalid price data from token price API');
      }

      return price;
    } catch (error) {
      return 0;
    }
  }
}
