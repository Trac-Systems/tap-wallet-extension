import {AppState} from '../../store';

export const InscriptionSelector = {
  listInscription: (state: AppState) =>
    state.inscriptionReducer.listInscription,
  totalInscription: (state: AppState) =>
    state.inscriptionReducer.totalInscription,
  listTapToken: (state: AppState) => state.inscriptionReducer.listTapToken,
  totalTap: (state: AppState) => state.inscriptionReducer.totalTap,
};
