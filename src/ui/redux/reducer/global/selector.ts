import {AppState} from '../../store';

export const GlobalSelector = {
  loadingGlobalState: (state: AppState) =>
    state.globalReducer.loadingGlobalState,
  isUnlocked: (state: AppState) => state.globalReducer.isUnlocked,
  isReady: (state: AppState) => state.globalReducer.isReady,
  isBooted: (state: AppState) => state.globalReducer.isBooted,
  networkType: (state: AppState) => state.globalReducer.networkType,
  randomColors: (state: AppState) => state.globalReducer.randomColors,
  showSpendableList: (state: AppState) => state.globalReducer.showSpendableList,
  auth: (state: AppState) => state.globalReducer.auth
};
