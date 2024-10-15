import {EVENTS, IDisplayAccount} from '@/src/wallet-instance';
import createPersistStore from '../../storage/persistStore';
import eventBus from '../../../gateway/event-bus';
import sessionService from '../session.service';

interface IMemStore {
  activeAccount?: IDisplayAccount;
  contactMap: {};
}
export class AccountConfigService {
  store!: IMemStore;

  constructor() {
    if (!this.store) {
      this.init();
    }
  }

  async init() {
    this.store = await createPersistStore({
      name: 'accountConfig',
      template: {
        contactMap: {},
      },
    });
  }

  setAccountName(accountKey: string, name: string) {
    this.store.contactMap = Object.assign({}, this.store.contactMap, {
      [accountKey]: name,
    });
  }

  getAccountName(accountKey: string, defaultName?: string) {
    const name = this.store.contactMap[accountKey];
    if (!name && defaultName) {
      this.setAccountName(accountKey, defaultName);
    }
    return name || defaultName;
  }

  setActiveAccount(account: IDisplayAccount, name?: string) {
    if (name) {
      account.name = name;
    }
    this.store.activeAccount = account;
    if (account) {
      sessionService.broadcastEvent('accountsChanged', [account.address]);

      eventBus.emit(EVENTS.broadcastToUI, {
        method: 'accountsChanged',
        params: account,
      });
    }
  }

  getActiveAccount() {
    return this.store?.activeAccount;
  }
}
