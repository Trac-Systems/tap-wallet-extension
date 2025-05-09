import {AppState} from '../../store';

export const AccountSelector = {
  accounts: (state: AppState) => state.accountReducer.accounts,
  activeAccount: (state: AppState) => state.accountReducer.activeAccount,
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
