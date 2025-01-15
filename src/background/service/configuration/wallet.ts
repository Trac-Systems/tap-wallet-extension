import createPersistStore from '../../storage/persistStore';
interface IMemStore {
  activeWalletIndex: number;
  contactMap:{ [key: string]: string };
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
}
