import {AppState} from '../../../redux/store';

export const TransactionSelector = {
  bitcoinTx: (state: AppState) => state.transactionReducer.bitcoinTx,
  ordinalsTx: (state: AppState) => state.transactionReducer.ordinalsTx,
  btcUtxos: (state: AppState) => state.transactionReducer.btcUtxos,
  inscriptionUtxos: (state: AppState) =>
    state.transactionReducer.inscriptionUtxos,
  spendUnavailableUtxos: (state: AppState) =>
    state.transactionReducer.spendUnavailableUtxos,
  assetUtxos_inscriptions: (state: AppState) =>
    state.transactionReducer.assetUtxos_inscriptions,
  txStateInfo: (state: AppState) => state.transactionReducer.txStateInfo,
};
