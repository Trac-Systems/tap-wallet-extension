/* eslint-disable no-unsafe-optional-chaining */
import {Network} from '@/src/wallet-instance';
import {networkConfig} from '../service/singleton';
import {AxiosRequest} from './axios';
export const INSCRIBE_API_TESTNET = 'http://157.230.45.91:8080';

export const INSCRIBE_API_MAINNET = 'https://inscriber.trac.network';

export enum OrderType {
  TAP_MINT = 'TAP_MINT',
  TAP_DEPLOY = 'TAP_DEPLOY',
  TAP_TRANSFER = 'TAP_TRANSFER',
  FILE = 'FILE',
  TEXT = 'TEXT',
  AUTHORITY = 'AUTHORITY',
  REDEEM = 'REDEEM',
}
export class InscribeApi {
  api!: AxiosRequest;
  constructor() {
    if (!this.api) {
      this.init();
    }
  }
  private init() {
    this.changeNetwork();
  }

  changeNetwork(network?: Network) {
    if (!network) {
      network = networkConfig.getActiveNetwork();
    }
    this.api = new AxiosRequest({
      baseUrl:
        network === Network.MAINNET
          ? INSCRIBE_API_MAINNET
          : INSCRIBE_API_TESTNET,
    });
  }

  async createOrderText(
    text: string,
    type: OrderType,
    connectedAddress: string,
    receiveAddress: string,
    feeRate: number,
    outputValue: number,
  ) {
    const res = await this.api.post('/v1/inscribe/order/texts', {
      feeRate,
      postage: outputValue,
      connectedAddress,
      rebar: false,
      data: [{text, receiver: receiveAddress}],
      orderType: type,
    });
    if (!res?.data) {
      throw new Error('Inscribe text order failed');
    }
    return {...res?.data?.data};
  }

  async createOrderTapTransfer(
    feeRate: number,
    outputValue: number,
    connectedAddress: string,
    receiveAddress: string,
    ticker: string,
    amount: string,
    data?: string,
  ) {
    const res = await this.api.post('/v1/inscribe/order/tapTransfer', {
      feeRate,
      postage: outputValue,
      connectedAddress,
      rebar: false,
      ticker,
      receiver: receiveAddress,
      amount,
      data,
    });
    if (!res.data) {
      throw new Error('Inscribe tap transfer order failed');
    }
    return {...res?.data?.data};
  }
}
