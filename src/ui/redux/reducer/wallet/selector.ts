import {AppState} from '../../store';

export const WalletSelector = {
  wallets: (state: AppState) => state.walletReducer.wallets,
  activeWallet: (state: AppState) => state.walletReducer.activeWallet,
};
