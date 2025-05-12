/* eslint-disable no-unsafe-optional-chaining */
import {InscribeOrder, Network, OrderType} from '@/src/wallet-instance';
import {networkConfig} from '../service/singleton';
import {AxiosRequest} from './axios';
export const INSCRIBE_API_TESTNET = 'http://157.230.45.91:8080';

export const INSCRIBE_API_MAINNET = 'https://inscriber.trac.network';

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
    receiveAddress: string,
    feeRate: number,
    outputValue: number,
  ) {
    const res = await this.api.post('/v1/inscribe/order/texts', {
      feeRate,
      postage: outputValue,
      connectedAddress: receiveAddress, // connectedAddress is receiveAddress
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

  // get orders ready to tap
  async getReadyToTap(address: string) {
    const res = await this.api.get(
      `/v1/inscribe/order/readyToTap/${address}`,
      {},
    );
    if (!res.data) {
      throw new Error('Get ready to tap order failed');
    }
    return {...res?.data?.data};
  }

  // get authority orders
  async getAuthorityOrders(address: string) {
    const res = await this.api.get(
      `/v1/inscribe/order/authority/${address}`,
      {},
    );

    if (!res.data) {
      throw new Error('Get authority order failed');
    }
    return res?.data?.data as InscribeOrder[];
  }

  // mark order as tapping
  async tappingOrder(orderId: string) {
    const res = await this.api.post(
      `/v1/inscribe/order/tapping/${orderId}`,
      {},
    );
    if (!res.data) {
      throw new Error('Tapping order failed');
    }
    return {...res?.data?.data};
  }

  // mark order as paid
  async paidOrder(orderId: string, headers?: any) {
    const res = await this.api.post(
      `/v1/inscribe/order/paid/${orderId}`,
      {},
      headers,
    );
    if (!res.data) {
      throw new Error('Paid order failed');
    }
  }
}
