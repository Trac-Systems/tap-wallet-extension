import {MempoolApi} from './mempool-api';
import {PaidApi} from './paid-api';
import {TapApi} from './tap-api';
import { TapInscribeApi } from './tap-inscribe-api';
import {UsdAPI} from './usd-api';

export const paidApi = new PaidApi();
export const mempoolApi = new MempoolApi();
export const tapApi = new TapApi();
export const usdApi = new UsdAPI();
export const tapInscribeApi= new TapInscribeApi();
export const loadApi = async () => {
  await Promise.all([
    paidApi.changeNetwork(),
    mempoolApi.changeNetwork(),
    tapApi.changeNetwork(),
    tapInscribeApi.changeNetwork(),
  ]);
};


