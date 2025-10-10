import {createSlice} from '@reduxjs/toolkit';

export interface TracBalancesState {
  map: {[address: string]: {total: string; confirmed: string; unconfirmed: string}};
}

const initialState: TracBalancesState = {
  map: {},
};

const TracBalanceSlice = createSlice({
  name: 'tracBalance',
  initialState,
  reducers: {
    setBalancesIfChanged(
      state,
      action: {
        payload: {address: string; total?: string; confirmed?: string; unconfirmed?: string};
      },
    ) {
      const {address, total, confirmed, unconfirmed} = action.payload;
      if (!address) return;
      const prev = state.map[address] || {total: '', confirmed: '', unconfirmed: ''};
      const next = {
        total: total !== undefined ? total : prev.total,
        confirmed: confirmed !== undefined ? confirmed : prev.confirmed,
        unconfirmed: unconfirmed !== undefined ? unconfirmed : prev.unconfirmed,
      };
      if (
        next.total !== prev.total ||
        next.confirmed !== prev.confirmed ||
        next.unconfirmed !== prev.unconfirmed
      ) {
        state.map[address] = next;
      }
    },
  },
});

export const TracBalanceActions = TracBalanceSlice.actions;
export default TracBalanceSlice;


