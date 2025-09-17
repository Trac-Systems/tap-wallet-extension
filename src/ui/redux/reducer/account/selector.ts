import {AppState} from '../../store';

export const AccountSelector = {
  accounts: (state: AppState) => state.accountReducer.accounts,
  activeAccount: (state: AppState) => state.accountReducer.activeAccount,
  // tracAddress is now enriched on activeAccount via listWallets
  tracBalanceMap: (state: AppState) => state.accountReducer.tracBalanceMap,
  tracBalanceByActive: (state: AppState) => {
    const active = state.accountReducer.activeAccount;
    const map = state.accountReducer.tracBalanceMap || {};
    return map?.[active?.key] || '0';
  },
  accountBalanceMap: (state: AppState) => state.accountReducer.balanceMap,
  inscriptionsMap: (state: AppState) => state.accountReducer.inscriptionsMap,
  inscriptionSummary: (state: AppState) =>
    state.accountReducer.inscriptionSummary,
  isReloadAccount: (state: AppState) => state.accountReducer.isReloadAccount,
  runeUtxos: (state: AppState) => state.accountReducer.runeUtxos,
  dmtCollectibleMap: (state: AppState) => state.accountReducer.dmtCollectibleMap,
  dmtGroupMap: (state: AppState) => state.accountReducer.dmtGroupMap,
  currentAuthority: (state: AppState) => state.accountReducer.currentAuthority,
};
