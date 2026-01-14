import createPersistStore from '../../storage/persistStore';
import {Network} from '@/src/wallet-instance';

interface IMemStore {
  activeWalletIndex: number;
  contactMap:{ [key: string]: string };
  walletAccountMap: { [walletKey: string]: number }; // Store last account index for each wallet
  hardwareWalletNetworkMap: { [walletKey: string]: Network }; // Store last confirmed network for each hardware wallet
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
        hardwareWalletNetworkMap: {},
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

  // Hardware wallet network management
  setHardwareWalletNetwork(walletKey: string, network: Network) {
    if (!this.store.hardwareWalletNetworkMap) {
      this.store.hardwareWalletNetworkMap = {};
    }
    this.store.hardwareWalletNetworkMap = Object.assign(
      {},
      this.store.hardwareWalletNetworkMap,
      {[walletKey]: network},
    );
  }

  getHardwareWalletNetwork(walletKey: string): Network | null {
    if (!this.store.hardwareWalletNetworkMap) {
      this.store.hardwareWalletNetworkMap = {};
    }
    return this.store.hardwareWalletNetworkMap[walletKey] ?? null;
  }

  clearHardwareWalletNetwork(walletKey: string) {
    if (!this.store.hardwareWalletNetworkMap) {
      this.store.hardwareWalletNetworkMap = {};
    }
    if (this.store.hardwareWalletNetworkMap[walletKey]) {
      const next = {...this.store.hardwareWalletNetworkMap};
      delete next[walletKey];
      this.store.hardwareWalletNetworkMap = next;
    }
  }
}
