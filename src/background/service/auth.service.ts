import {ObservableStore} from '@metamask/obs-store';
import {isEmpty} from 'lodash';
import passworder from '@metamask/browser-passworder';
import createPersistStore from '../storage/persistStore';

interface IMemStore {
  isUnlocked: boolean;
  registered: string;
  passwordUpgraded: boolean;
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
      template: {isUnlocked: false, registered: '', passwordUpgraded: false},
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
        return reject(new Error(this.isLegacyUser(pin) ? 'Wrong PIN' : 'Wrong Password'));
      }
      this.pin = pin;
      this.setUnlocked();
      resolve();
    });
  }

  setUnlocked = () => {
    this.memStore.updateState({isUnlocked: true});
  }

  async markPasswordUpgraded() {
    this.store.passwordUpgraded = true;
  }

  isPasswordUpgraded() {
    return this.store.passwordUpgraded;
  }

  // Check if user is using legacy 4-digit PIN
  isLegacyUser(pin: string): boolean {
    return /^\d{4}$/.test(pin) && !this.store.passwordUpgraded;
  };

  async decodeData(pin: string, encodeData: any) {
    const decodedData = await passworder.decrypt(pin, encodeData);
    const jsonString = JSON.stringify(decodedData);
    return jsonString;
  }

  async encodeData(data: any) {
    if (isEmpty(this.pin)) {
      throw new Error('Password must be create before!');
    }
    return passworder.encrypt(this.pin, data);
  }

  async updateRegistered(newPin: string) {
    const encryptedData = await passworder.encrypt(newPin, 'isRegistered');
    this.store.registered = encryptedData;
    this.pin = newPin;
    this.setUnlocked();
  }
}
