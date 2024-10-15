import {Network} from '@/src/wallet-instance';
import {createSlice} from '@reduxjs/toolkit';

export interface GlobalState {
  isUnlocked: boolean;
  isReady: boolean;
  isBooted: boolean;
  loadingGlobalState: boolean;
  networkType: Network;
  randomColors: string[];
}

export const initialState: GlobalState = {
  isUnlocked: false,
  isReady: false,
  isBooted: false,
  loadingGlobalState: false,
  networkType: Network.MAINNET,
  randomColors: [],
};

const GlobalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    update(
      state,
      action: {
        payload: {
          isUnlocked?: boolean;
          isReady?: boolean;
          isBooted?: boolean;
        };
      },
    ) {
      const {payload} = action;
      state = Object.assign({}, state, payload);
      return state;
    },
    setGlobalLoading: (state: GlobalState, action) => {
      const {isLoading} = action.payload;
      return {
        ...state,
        loadingGlobalState: isLoading,
      };
    },
    updateNetwork(
      state,
      action: {
        payload: {
          networkType: Network;
        };
      },
    ) {
      const {payload} = action;
      state = Object.assign({}, state, payload);
      return state;
    },
    setListRandomColor: (state: GlobalState, action) => {
      const {listColor} = action.payload;
      return {
        ...state,
        randomColors: listColor,
      };
    },
  },
});

export const GlobalActions = GlobalSlice.actions;
export default GlobalSlice;
