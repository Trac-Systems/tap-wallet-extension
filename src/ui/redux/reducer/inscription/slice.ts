import {Inscription, TokenBalance} from '@/src/wallet-instance';
import {createSlice} from '@reduxjs/toolkit';

export interface InscriptionState {
  listInscription: Inscription[];
  totalInscription: number;
  listTapToken: TokenBalance[];
  totalTap: number;
}

export const initialState: InscriptionState = {
  listInscription: [],
  totalInscription: 0,
  listTapToken: [],
  totalTap: 0,
};

const InscriptionSlice = createSlice({
  name: 'inscription',
  initialState,
  reducers: {
    setListInscription(state, action: {payload: {list: Inscription[]}}) {
      const {list} = action.payload;
      return {
        ...state,
        listInscription: list
      };
    },
    setTotalInscription(state, action: {payload: number}) {
      const {payload} = action;
      return {
       ...state,
        totalInscription: payload,
      };
    },
    setListTapToken(state, action: {payload: {list: TokenBalance[]}}) {
      const {list} = action.payload;
      return {
        ...state,
        listTapToken: list
      };
    },
    setTotalTap(state, action: {payload: number}) {
      const {payload} = action;
      return {
       ...state,
       totalTap: payload,
      };
    }
  },
});

export const InscriptionActions = InscriptionSlice.actions;
export default InscriptionSlice;
