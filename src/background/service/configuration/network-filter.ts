import createPersistStore from '../../storage/persistStore';

interface IMemStore {
  walletFilters: {[walletIndex: string]: {bitcoin: boolean; trac: boolean}};
}

export class NetworkFilterConfigService {
  store!: IMemStore;

  constructor() {
    if (!this.store) {
      this.init();
    }
  }

  async init() {
    this.store = await createPersistStore<IMemStore>({
      name: 'networkFilterConfig',
      template: {
        walletFilters: {},
      },
    });
  }

  getNetworkFilters(walletIndex: number = 0) {
    const walletKey = walletIndex.toString();
    return this.store.walletFilters[walletKey] || {
      bitcoin: true,
      trac: true,
    };
  }

  setNetworkFilters(walletIndex: number, filters: {bitcoin: boolean; trac: boolean}) {
    const walletKey = walletIndex.toString();
    this.store.walletFilters = {
      ...this.store.walletFilters,
      [walletKey]: filters,
    };
  }

  updateNetworkFilter(walletIndex: number, network: 'bitcoin' | 'trac', enabled: boolean) {
    const currentFilters = this.getNetworkFilters(walletIndex);
    this.setNetworkFilters(walletIndex, {
      ...currentFilters,
      [network]: enabled,
    });
  }

  // Get filters for all wallets
  getAllWalletFilters() {
    return this.store.walletFilters;
  }

  // Remove filters for a specific wallet (when wallet is deleted)
  removeWalletFilters(walletIndex: number) {
    const walletKey = walletIndex.toString();
    const newFilters = {...this.store.walletFilters};
    delete newFilters[walletKey];
    this.store.walletFilters = newFilters;
  }
}
