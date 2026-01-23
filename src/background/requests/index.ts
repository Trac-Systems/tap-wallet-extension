import { InscribeApi } from '@/src/background/requests/inscribe-api';
import {MempoolApi} from './mempool-api';
import {PaidApi} from './paid-api';
import {TapApi} from './tap-api';
import {UsdAPI} from './usd-api';

export const paidApi = new PaidApi();
export const mempoolApi = new MempoolApi();
export const tapApi = new TapApi();
export const usdApi = new UsdAPI();
export const inscribeApi = new InscribeApi();

export const loadApi = async () => {
  await Promise.all([
    paidApi.changeNetwork(),
    mempoolApi.changeNetwork(),
    tapApi.changeNetwork(),
    inscribeApi.changeNetwork(),
    usdApi.changeNetwork(),
  ]);
};
