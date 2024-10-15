import {NETWORK_TYPES, Network} from '../../../wallet-instance';
import createPersistStore from '../../storage/persistStore';
import sessionService from '../session.service';

interface IMemStore {
  network: Network;
}

export class NetworkConfigService {
  store!: IMemStore;
  constructor() {
    if (!this.store) {
      this.init();
    }
  }

  async init() {
    this.store = await createPersistStore({
      name: 'networkConfig',
      template: {
        network: Network.MAINNET,
      },
    });
  }

  getActiveNetwork() {
    return this.store?.network;
  }

  setActiveNetwork(network: Network) {
    this.store.network = network;
    sessionService.broadcastEvent('networkChanged', {
      network: NETWORK_TYPES[network].name,
    });
  }
}
