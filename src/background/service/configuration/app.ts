import createPersistStore from '../../storage/persistStore';

interface IMemStore {
  enableSignData: boolean;
}

export class AppConfigService {
  store!: IMemStore;
  constructor() {
    if (!this.store) {
      this.init();
    }
  }

  async init() {
    this.store = await createPersistStore({
      name: 'appConfig',
      template: {
        enableSignData: false,
      },
    });
  }

  getEnableSignData = () => {
    return this.store.enableSignData;
  };

  setEnableSignData = (enableSignData: boolean) => {
    this.store.enableSignData = enableSignData;
  };
}
