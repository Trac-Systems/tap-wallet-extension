import {MempoolApi} from './mempool-api';
import {PaidApi} from './paid-api';
import {TapApi} from './tap-api';

export const paidApi = new PaidApi();
export const mempoolApi = new MempoolApi();
export const tapApi = new TapApi();

export const loadApi = async () => {
  await Promise.all([
    paidApi.changeNetwork(),
    mempoolApi.changeNetwork(),
    tapApi.changeNetwork(),
  ]);
};
