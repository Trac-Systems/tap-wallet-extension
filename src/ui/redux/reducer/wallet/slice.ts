import {AddressType, WalletDisplay} from '@/src/wallet-instance';
import {createSlice} from '@reduxjs/toolkit';

export interface WalletsState {
  wallets: WalletDisplay[];
  activeWallet: WalletDisplay;
}

const initialKeyring: WalletDisplay = {
  key: '',
  index: 0,
  type: '',
  addressType: AddressType.P2TR,
  accounts: [],
  name: '',
  derivationPath: '',
};

export const initialState: WalletsState = {
  wallets: [],
  activeWallet: initialKeyring,
};

const WalletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setActiveWallet(state, action: {payload: WalletDisplay}) {
      const {payload} = action;
      state.activeWallet = payload || initialKeyring;
    },
    setListWallet(state, action: {payload: WalletDisplay[]}) {
      const {payload} = action;
      state.wallets = payload.filter(
        wallet => wallet?.accounts && wallet.accounts.length > 0,
      );

      if (
        state.activeWallet &&
        (!state.activeWallet.accounts || state.activeWallet.accounts.length === 0)
      ) {
        state.activeWallet =
          state.wallets.length > 0 ? state.wallets[0] : initialKeyring;
      }
    },

    reset() {
      return initialState;
    },
    updateWalletName(state, action: {payload: WalletDisplay}) {
      const keyring = action.payload;
      if (state.activeWallet.key === keyring.key) {
        state.activeWallet.name = keyring.name;
      }
      state.wallets.forEach(v => {
        if (v.key === keyring.key) {
          v.name = keyring.name;
        }
      });
    },
  },
});

export const WalletActions = WalletSlice.actions;
export default WalletSlice;
