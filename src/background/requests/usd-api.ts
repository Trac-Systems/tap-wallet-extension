import {AxiosRequest} from './axios';

const API_USD = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';
const API_TRAC_USD = 'https://inscriber.trac.network/v1/trac-price';

// Cache for TRAC price to avoid multiple API calls
interface TracPriceCache {
  price: number;
  timestamp: number;
}

export class UsdAPI {
  api!: AxiosRequest;
  private tracPriceCache: TracPriceCache | null = null;
  private readonly CACHE_DURATION = 60000; // 60 seconds
  private isFetchingTracPrice = false;
  private tracPricePromise: Promise<number> | null = null;

  constructor() {
    this.api = new AxiosRequest({
      baseUrl: API_USD,
    });
  }

  async getUSDPrice(): Promise<any> {
    const response = await this.api.get('/', {});
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
      const response = await fetch(API_TRAC_USD);
      if (!response.ok) {
        throw new Error(`TRAC API error: ${response.status}`);
      }

      const result = await response.json();

      if (result?.statusCode !== 200) {
        throw new Error(`TRAC API error: ${result?.message || 'Unknown error'}`);
      }

      const price = result?.data?.price_usd;

      if (typeof price !== 'number' || isNaN(price)) {
        throw new Error('Invalid price data from TRAC API');
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

      console.error('Failed to fetch TRAC price and no cache available:', error);
      return 0;
    }
  }
}
