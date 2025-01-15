import {EVENTS, IDisplayAccount, Inscription} from '@/src/wallet-instance';
import createPersistStore from '../../storage/persistStore';
import eventBus from '../../../gateway/event-bus';
import sessionService from '../session.service';

interface InscriptionMap {
  [key: string]: Inscription;
}

interface IMemStore {
  activeAccount?: IDisplayAccount;
  contactMap: {[key: string]: string};
  spendableInscriptions: {[key: string]: InscriptionMap};
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
        spendableInscriptions: {},
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

  setAccountSpendableInscriptions(
    accountKey: string,
    inscription: Inscription,
  ) {
    if (!this.store?.spendableInscriptions) {
      this.store.spendableInscriptions = {};
    }
    // Create a new object if accountKey doesn't exist
    if (!this.store?.spendableInscriptions[accountKey]) {
      this.store.spendableInscriptions[accountKey] = {};
    }

    // Create a new copy of current inscriptions
    const updatedInscriptions = {
      ...this.store.spendableInscriptions[accountKey],
      [inscription.inscriptionId]: inscription,
    };

    // Update store with new reference
    this.store.spendableInscriptions = {
      ...this.store.spendableInscriptions,
      [accountKey]: updatedInscriptions,
    };
  }

  getAccountSpendableInscriptions(accountKey: string): Inscription[] {
    const accountInscriptions = this.store.spendableInscriptions[accountKey];
    if (!accountInscriptions) {
      return [];
    }
    return Object.values(accountInscriptions);
  }

  deleteAccountSpendableInscription(accountKey: string, inscriptionId: string) {
    if (!this.store.spendableInscriptions[accountKey]?.[inscriptionId]) {
      return;
    }

    const updatedInscriptions = {
      ...this.store.spendableInscriptions[accountKey],
    };
    delete updatedInscriptions[inscriptionId];

    this.store.spendableInscriptions = {
      ...this.store.spendableInscriptions,
      [accountKey]: updatedInscriptions,
    };
  }
}
