import {
  AddressSummary,
  IDisplayAccount,
  Inscription,
  InscriptionSummary,
  TxHistoryItem,
  UnspentOutput,
} from '@/src/wallet-instance';
import {createSlice} from '@reduxjs/toolkit';

export interface DmtCollectible {
  contentInscriptionId?: string;
  block?: number;
  ticker?: string;
  inscriptionNumber?: number;
}
export interface DmtDeployInfo {
  ticker?: string;
  dmtInscriptionIds: string[];
}

export interface AccountsState {
  accounts: IDisplayAccount[];
  activeAccount: IDisplayAccount;
  loading: boolean;
  balanceMap: {
    [key: string]: {
      amount: number;
      btcAmount: number;
      pendingBtcAmount: number;
      inscriptionAmount: number;
      expired: boolean;
    };
  };
  historyMap: {
    [key: string]: {
      list: TxHistoryItem[];
      expired: boolean;
    };
  };
  inscriptionsMap: {
    [key: string]: {
      list: Inscription[];
      expired: boolean;
    };
  };
  inscriptionSummary: InscriptionSummary;
  addressSummary: AddressSummary;
  isReloadAccount: boolean;
  runeUtxos?: UnspentOutput[];

  // map of dmt
  // key: dmt inscription id
  // val: information of specific dmt
  dmtCollectibleMap?: {
    [key: string]: DmtCollectible;
  };

  // map of group dmt collectible
  // key: deployment inscription id
  // val: array of dmt inscriptions same collectible
  dmtGroupMap?: {
    [key: string]: DmtDeployInfo;
  };
}

const initialAccount = {
  type: '',
  address: '',
  brandName: '',
  name: '',
  displayBrandName: '',
  index: 0,
  balance: 0,
  pubkey: '',
  key: '',
  flag: 0,
};

export const initialState: AccountsState = {
  accounts: [],
  activeAccount: initialAccount,
  loading: false,
  balanceMap: {},
  historyMap: {},
  inscriptionsMap: {},
  inscriptionSummary: {
    mintedList: [],
  },
  addressSummary: {
    totalSatoshis: 0,
    btcSatoshis: 0,
    assetSatoshis: 0,
    inscriptionCount: 0,
    loading: true,
    address: '',
  },
  isReloadAccount: false,
  runeUtxos: [],
  dmtCollectibleMap: {},
  dmtGroupMap: {},
};

const AccountSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    setActiveAccount(state, action: {payload: IDisplayAccount}) {
      const {payload} = action;
      state.activeAccount = payload || initialAccount;
    },
    setAccounts(state, action: {payload: IDisplayAccount[]}) {
      const {payload} = action;
      state.accounts = payload;
    },
    setBalance(
      state,
      action: {
        payload: {
          address: string;
          amount: number;
          btcAmount: number;
          inscriptionAmount: number;
          pendingBtcAmount: number;
        };
      },
    ) {
      const {
        payload: {
          address,
          amount,
          btcAmount,
          inscriptionAmount,
          pendingBtcAmount,
        },
      } = action;
      state.balanceMap[address] = state.balanceMap[address] || {
        amount: 0,
        btcAmount: 0,
        inscriptionAmount: 0,
        pendingBtcAmount: 0,
        expired: true,
      };
      state.balanceMap[address].amount = amount;
      state.balanceMap[address].btcAmount = btcAmount;
      state.balanceMap[address].inscriptionAmount = inscriptionAmount;
      state.balanceMap[address].pendingBtcAmount = pendingBtcAmount;
      state.balanceMap[address].expired = false;
    },
    setAddressSummary(state, action: {payload: any}) {
      state.addressSummary = action.payload;
    },
    expireBalance(state) {
      const balance = state.balanceMap[state.activeAccount.address];
      if (balance) {
        balance.expired = true;
      }
    },
    setHistory(
      state,
      action: {payload: {address: string; list: TxHistoryItem[]}},
    ) {
      const {
        payload: {address, list},
      } = action;
      state.historyMap[address] = state.historyMap[address] || {
        list: [],
        expired: true,
      };
      state.historyMap[address].list = list;
      state.historyMap[address].expired = false;
    },
    expireHistory(state) {
      const history = state.historyMap[state.activeAccount.address];
      if (history) {
        history.expired = true;
      }
    },
    setInscriptions(
      state,
      action: {payload: {address: string; list: Inscription[]}},
    ) {
      const {
        payload: {address, list},
      } = action;
      state.inscriptionsMap[address] = state.inscriptionsMap[address] || {
        list: [],
        expired: true,
      };
      state.inscriptionsMap[address].list = list;
      state.inscriptionsMap[address].expired = false;
    },
    expireInscriptions(state) {
      const inscriptions = state.inscriptionsMap[state.activeAccount.address];
      if (inscriptions) {
        inscriptions.expired = true;
      }
    },
    setCurrentAccountName(state, action: {payload: string}) {
      const {payload} = action;
      state.activeAccount.name = payload;
      const account = state.accounts.find(
        v => v.address === state.activeAccount.address,
      );
      if (account) {
        account.name = payload;
      }
    },
    setInscriptionSummary(state, action: {payload: InscriptionSummary}) {
      const {payload} = action;
      state.inscriptionSummary = payload;
    },
    rejectLogin(state) {
      state.loading = false;
    },
    reset() {
      return initialState;
    },
    updateAccountName(
      state,
      action: {
        payload: IDisplayAccount;
      },
    ) {
      const account = action.payload;
      if (state.activeAccount.key === account.key) {
        state.activeAccount.name = account.name;
      }
      state.accounts.forEach(v => {
        if (v.key === account.key) {
          v.name = account.name;
        }
      });
    },
    setReloadAccount: (state: AccountsState, action) => {
      const {isReload} = action.payload;
      return {
        ...state,
        isReloadAccount: isReload,
      };
    },
    setRuneUtxos(state: AccountsState, action: {payload: UnspentOutput[]}) {
      const {payload} = action;
      return {
        ...state,
        runeUtxos: payload,
      };
    },
    setDmtCollectibleMap(
      state: AccountsState,
      action: {payload: {inscriptionId: string; data: DmtCollectible}},
    ) {
      const {payload} = action;
      state.dmtCollectibleMap[payload.inscriptionId] = payload.data;
    },
    setManyDmtCollectiblesMap(
      state: AccountsState,
      action: {payload: {[key: string]: DmtCollectible}},
    ) {
      const {payload} = action;
      state.dmtCollectibleMap = {...state.dmtCollectibleMap, ...payload};
    },
    resetDmtCollectibleMap(state: AccountsState) {
      state.dmtCollectibleMap = {};
    },

    setDmtGroupMap(
      state: AccountsState,
      action: {payload: {[key: string]: DmtDeployInfo}},
    ) {
      const {payload} = action;
      state.dmtGroupMap = {...state.dmtGroupMap, ...payload};
    },
    resetDmtGroupMap(state: AccountsState) {
      state.dmtGroupMap = {};
    },
  },
});

export const AccountActions = AccountSlice.actions;
export default AccountSlice;
