import {ObservableStore} from '@metamask/obs-store';
import {isEmpty} from 'lodash';
import passworder from '@metamask/browser-passworder';
import createPersistStore from '../storage/persistStore';

interface IMemStore {
  isUnlocked: boolean;
  registered: string;
}

export class AuthService {
  store!: IMemStore;
  memStore!: ObservableStore<any>;
  pin: string;

  constructor() {
    this.pin = '';
    this.memStore = new ObservableStore({
      isUnlocked: false,
    });
  }

  async init() {
    this.store = await createPersistStore({
      name: 'auth',
      template: {isUnlocked: false, registered: ''},
    });
  }

  async register(pin: string) {
    this.pin = pin;
    const encryptedData = await passworder.encrypt(pin, 'isRegistered');
    this.store.registered = encryptedData;
    this.memStore.updateState({isUnlocked: true});
  }

  isRegistered() {
    return !!this.store.registered;
  }

  lockWallet() {
    this.pin = null;
    return this.memStore.updateState({isUnlocked: false});
  }

  async verifyPassword(pin: string, isUnlockWallet?: boolean): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      if (!isUnlockWallet && !this.memStore.getState().isUnlocked) {
        return reject(new Error('Please go to login page and login first!'));
      }
      const encryptedData: any = this.store.registered;
      if (!encryptedData) {
        return reject(
          new Error('You do not have any account before please add new'),
        );
      }
      let result = null;
      try {
        result = await this.decodeData(pin, encryptedData);
      } catch (error) {
        console.error(error);
      }
      if (!result) {
        return reject(new Error('Wrong PIN'));
      }
      this.pin = pin;
      this.setUnlocked();
      resolve();
    });
  }

  setUnlocked = () => {
    this.memStore.updateState({isUnlocked: true});
  };

  async decodeData(pin: string, encodeData: any) {
    const decodedData = await passworder.decrypt(pin, encodeData);
    const jsonString = JSON.stringify(decodedData);
    return jsonString;
  }

  async encodeData(data: any) {
    if (isEmpty(this.pin)) {
      throw new Error('PIN must be create before!');
    }
    return passworder.encrypt(this.pin, data);
  }
}
