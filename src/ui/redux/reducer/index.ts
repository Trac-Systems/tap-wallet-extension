import {combineReducers} from 'redux';
import GlobalSlice from './global/slice';
import WalletSlice from './wallet/slice';
import AccountSlice from './account/slice';
import InscriptionSlice from './inscription/slice';
import TransactionSlice from './transaction/slice';
import TracBalanceSlice from './trac-balance/slice';

const rootReducers = combineReducers({
  globalReducer: GlobalSlice.reducer,
  walletReducer: WalletSlice.reducer,
  accountReducer: AccountSlice.reducer,
  inscriptionReducer: InscriptionSlice.reducer,
  transactionReducer: TransactionSlice.reducer,
  tracBalanceReducer: TracBalanceSlice.reducer,
});
export default rootReducers;
