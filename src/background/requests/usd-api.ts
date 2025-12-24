import { AxiosRequest } from './axios';

const API_BTC_USD = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';
const API_COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const COINGECKO_API_KEY = 'CG-4L32DNvEaiEU75u91gncpf82';

// Cache for TRAC price to avoid multiple API calls
interface TracPriceCache {
  price: number;
  timestamp: number;
}

export class UsdAPI {
  api_btc!: AxiosRequest;
  api_trac!: AxiosRequest;
  private tracPriceCache: TracPriceCache | null = null;
  private readonly CACHE_DURATION = 60000; // 60 seconds
  private isFetchingTracPrice = false;
  private tracPricePromise: Promise<number> | null = null;

  constructor() {
    this.api_btc = new AxiosRequest({
      baseUrl: API_BTC_USD,
    });
    this.api_trac = new AxiosRequest({
      baseUrl: API_COINGECKO_BASE,
    });
  }

  async getUSDPrice(): Promise<any> {
    const response = await this.api_btc.get('/', {});
    return response?.data?.data?.amount;
  }

  async getTracUSDPrice(): Promise<number> {
    // Check if cache is valid
    if (this.tracPriceCache) {
      const now = Date.now();
      const cacheAge = now - this.tracPriceCache.timestamp;
      if (cacheAge < this.CACHE_DURATION) {
        return this.tracPriceCache.price;
      }
    }

    if (this.isFetchingTracPrice && this.tracPricePromise) {
      return this.tracPricePromise;
    }

    this.isFetchingTracPrice = true;
    this.tracPricePromise = this.fetchTracPrice();

    try {
      const price = await this.tracPricePromise;
      return price;
    } finally {
      this.isFetchingTracPrice = false;
      this.tracPricePromise = null;
    }
  }

  private async fetchTracPrice(): Promise<number> {
    try {
      const response = await this.api_trac.get('/simple/price', {
        vs_currencies: 'usd',
        ids: 'trac-network',
        x_cg_demo_api_key: COINGECKO_API_KEY,
      });

      if (!response?.success) {
        throw new Error(`CoinGecko API error: ${response?.message}`);
      }

      const price = response.data?.['trac-network']?.usd;

      if (typeof price !== 'number' || isNaN(price)) {
        throw new Error('Invalid price data from CoinGecko');
      }

      // Update cache
      this.tracPriceCache = {
        price,
        timestamp: Date.now(),
      };

      return price;
    } catch (error) {
      if (this.tracPriceCache) {
        console.warn('Failed to fetch TRAC price, using cached value:', error);
        return this.tracPriceCache.price;
      }

      console.error(
        'Failed to fetch TRAC price and no cache available:',
        error,
      );
      return 0;
    }
  }
}
