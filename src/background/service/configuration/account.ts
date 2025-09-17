import {
  EVENTS,
  IDisplayAccount,
  Inscription,
  UnspentOutput,
} from '@/src/wallet-instance';
import createPersistStore from '../../storage/persistStore';
import eventBus from '../../../gateway/event-bus';
import sessionService from '../session.service';
import {isEmpty} from 'lodash';

interface InscriptionMap {
  [key: string]: Inscription;
}

interface IMemStore {
  activeAccount?: IDisplayAccount;
  contactMap: {[key: string]: string};
  spendableInscriptions: {[key: string]: InscriptionMap};
  pendingOrders: string[];
  tracAddressMap?: {[key: string]: string};
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
        pendingOrders: [],
        tracAddressMap: {},
      },
    });
  }

  setAccountName(accountSpendableKey: string, name: string) {
    this.store.contactMap = Object.assign({}, this.store.contactMap, {
      [accountSpendableKey]: name,
    });
  }

  getAccountName(accountSpendableKey: string, defaultName?: string) {
    const name = this.store.contactMap[accountSpendableKey];
    if (!name && defaultName) {
      this.setAccountName(accountSpendableKey, defaultName);
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

  setTracAddress(addr: string, key?: string) {
    if (!this.store.tracAddressMap) this.store.tracAddressMap = {};
    const _key = key || this.store?.activeAccount?.key || '';
    if (!_key) return;
    this.store.tracAddressMap[_key] = addr || '';
  }

  getTracAddress(key?: string) {
    const _key = key || this.store?.activeAccount?.key || '';
    if (!_key) return '';
    return this.store?.tracAddressMap?.[_key] || '';
  }

  getAllTracAddresses() {
    return this.store?.tracAddressMap || {};
  }

  removeTracAddressesByKeys(keys: string[]) {
    if (!this.store?.tracAddressMap || !Array.isArray(keys) || keys.length === 0) {
      return;
    }
    const updated = {...this.store.tracAddressMap};
    for (const k of keys) {
      if (k in updated) {
        delete updated[k];
      }
    }
    this.store.tracAddressMap = updated;
  }

  setAccountSpendableInscriptions(
    accountSpendableKey: string,
    inscriptions: Inscription[],
  ) {
    if (!this.store?.spendableInscriptions) {
      this.store.spendableInscriptions = {};
    }

    // Create a new object if accountSpendableKey doesn't exist
    if (!this.store?.spendableInscriptions[accountSpendableKey]) {
      this.store.spendableInscriptions[accountSpendableKey] = {};
    }

    // Create a new copy of current inscription
    const updatedInscriptions = Object.fromEntries(
      inscriptions.map(inscription => [inscription.inscriptionId, inscription]),
    );

    // Update store with new reference
    this.store.spendableInscriptions = {
      ...this.store.spendableInscriptions,
      [accountSpendableKey]: updatedInscriptions,
    };
  }

  getAccountSpendableInscriptions(accountSpendableKey: string): Inscription[] {
    if (isEmpty(this.store.spendableInscriptions)) {
      return [];
    }

    const accountInscriptions =
      this.store.spendableInscriptions[accountSpendableKey];
    if (!accountInscriptions) {
      return [];
    }
    return Object.values(accountInscriptions);
  }

  deleteAccountSpendableInscription(
    accountSpendableKey: string,
    inscriptionId: string,
  ) {
    if (!this.store.spendableInscriptions) {
      return;
    }

    if (!this.store.spendableInscriptions[accountSpendableKey]) {
      return;
    }

    if (
      !this.store.spendableInscriptions[accountSpendableKey]?.[inscriptionId]
    ) {
      return;
    }

    const updatedInscriptions = {
      ...this.store.spendableInscriptions[accountSpendableKey],
    };
    delete updatedInscriptions[inscriptionId];

    this.store.spendableInscriptions = {
      ...this.store.spendableInscriptions,
      [accountSpendableKey]: updatedInscriptions,
    };
  }

  deleteSpendableUtxos(
    accountSpendableKey: string,
    spendUtxos: UnspentOutput[],
  ) {
    if (!this.store.spendableInscriptions) {
      return;
    }
    if (!this.store.spendableInscriptions[accountSpendableKey]) {
      return;
    }
    const txUtxoMaps = {};
    for (const utxo of spendUtxos) {
      txUtxoMaps[utxo.txid] = true;
    }
    const updatedInscriptions = {
      ...this.store.spendableInscriptions[accountSpendableKey],
    };
    for (const ins of Object.values(
      this.store.spendableInscriptions[accountSpendableKey],
    )) {
      if (
        txUtxoMaps[ins.utxoInfo?.txid] &&
        updatedInscriptions[ins.inscriptionId]
      ) {
        delete updatedInscriptions[ins.inscriptionId];
      }
    }

    this.store.spendableInscriptions = {
      ...this.store.spendableInscriptions,
      [accountSpendableKey]: updatedInscriptions,
    };
  }

  getAccountPendingOrders() {
    return this.store?.pendingOrders || [];
  }

  addAccountPendingOrder(orderId: string) {
    if (!this.store?.pendingOrders) {
      this.store.pendingOrders = [orderId];
      return;
    }
    if (this.store.pendingOrders.includes(orderId)) {
      return;
    }
    this.store.pendingOrders.push(orderId);
  }

  removeAccountPendingOrder(orderId: string) {
    if (!this.store?.pendingOrders) {
      return;
    }
    this.store.pendingOrders = this.store.pendingOrders.filter(
      id => id !== orderId,
    );
  }

  resetAccountPendingOrders() {
    if (!this.store?.pendingOrders) {
      return;
    }
    this.store.pendingOrders = [];
  }
}
