import createPersistStore from '../../storage/persistStore';
interface IMemStore {
  activeWalletIndex: number;
  contactMap:{ [key: string]: string };
  walletAccountMap: { [walletKey: string]: number }; // Store last account index for each wallet
}
export class WalletConfigService {
  store!: IMemStore;
  constructor() {
    if (!this.store) {
      this.init();
    }
  }
  async init() {
    this.store = await createPersistStore<IMemStore>({
      name: 'walletConfig',
      template: {
        activeWalletIndex: 0,
        contactMap: {},
        walletAccountMap: {},
      },
    });
  }
  setWalletName(key: string, name: string) {
    this.store.contactMap = Object.assign({}, this.store.contactMap, {
      [key]: name,
    });
  }

  getWalletName(key: string, defaultName: string) {
    const name = this.store.contactMap[key];
    if (!name) {
      this.setWalletName(key, defaultName);
    }
    return name || defaultName;
  }

  getActiveWalletIndex() {
    return this.store?.activeWalletIndex;
  }

  setActiveWalletIndex(index: number) {
    this.store.activeWalletIndex = index;
  }

  setWalletAccountIndex(walletKey: string, accountIndex: number) {
    if (!this.store.walletAccountMap) {
      this.store.walletAccountMap = {};
    }
    this.store.walletAccountMap = Object.assign({}, this.store.walletAccountMap, {
      [walletKey]: accountIndex,
    });
  }

  getWalletAccountIndex(walletKey: string) {
    if (!this.store.walletAccountMap) {
      this.store.walletAccountMap = {};
    }
    return this.store.walletAccountMap[walletKey] || 0;
  }
}
