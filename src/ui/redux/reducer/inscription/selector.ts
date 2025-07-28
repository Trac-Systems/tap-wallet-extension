import {AppState} from '../../store';

export const InscriptionSelector = {
  listInscription: (state: AppState) =>
    state.inscriptionReducer.listInscription,
  totalInscription: (state: AppState) =>
    state.inscriptionReducer.totalInscription,
  listTapToken: (state: AppState) => state.inscriptionReducer.listTapToken,
  totalTap: (state: AppState) => state.inscriptionReducer.totalTap,
  spendableInscriptionsMap: (state: AppState) => state.inscriptionReducer.spendableInscriptionsMap,
  allInscriptions: (state: AppState) => state.inscriptionReducer.allInscriptions,
  allInscriptionsLoading: (state: AppState) => state.inscriptionReducer.allInscriptionsLoading,
  allInscriptionsError: (state: AppState) => state.inscriptionReducer.allInscriptionsError,
};
