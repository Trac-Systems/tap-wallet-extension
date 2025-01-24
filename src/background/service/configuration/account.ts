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
    inscriptions: Inscription[],
  ) {
    if (!this.store?.spendableInscriptions) {
      this.store.spendableInscriptions = {};
    }

    // Create a new object if accountKey doesn't exist
    if (!this.store?.spendableInscriptions[accountKey]) {
      this.store.spendableInscriptions[accountKey] = {};
    }

    // Create a new copy of current inscription
    const updatedInscriptions = Object.fromEntries(
      inscriptions.map(inscription => [inscription.inscriptionId, inscription]),
    );

    // Update store with new reference
    this.store.spendableInscriptions = {
      ...this.store.spendableInscriptions,
      [accountKey]: updatedInscriptions,
    };
  }

  getAccountSpendableInscriptions(accountKey: string): Inscription[] {
    if (isEmpty(this.store.spendableInscriptions)) {
      return [];
    }

    const accountInscriptions = this.store.spendableInscriptions[accountKey];
    if (!accountInscriptions) {
      return [];
    }
    return Object.values(accountInscriptions);
  }

  deleteAccountSpendableInscription(accountKey: string, inscriptionId: string) {
    if (!this.store.spendableInscriptions) {
      return;
    }

    if (!this.store.spendableInscriptions[accountKey]) {
      return;
    }

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

  deleteSpendableUtxos(accountKey: string, spendUtxos: UnspentOutput[]) {
    if (!this.store.spendableInscriptions) {
      return;
    }
    if (!this.store.spendableInscriptions[accountKey]) {
      return;
    }
    const txUtxoMaps = {};
    for (const utxo of spendUtxos) {
      txUtxoMaps[utxo.txid] = true;
    }
    const updatedInscriptions = {
      ...this.store.spendableInscriptions[accountKey],
    };
    for (const ins of Object.values(
      this.store.spendableInscriptions[accountKey],
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
      [accountKey]: updatedInscriptions,
    };
  }
}
