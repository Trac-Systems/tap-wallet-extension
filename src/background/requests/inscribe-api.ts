/* eslint-disable no-unsafe-optional-chaining */
import {InscribeOrder, Network, OrderType} from '@/src/wallet-instance';
import {networkConfig} from '../service/singleton';
import {AxiosRequest} from './axios';
import { dta } from '@/src/ui/interfaces'
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
    inscriptionAuthority?: string,
  ) {
    const res = await this.api.post('/v1/inscribe/order/texts', {
      feeRate,
      postage: outputValue,
      connectedAddress: receiveAddress, // connectedAddress is receiveAddress
      rebar: false,
      data: [{text, receiver: receiveAddress}],
      orderType: type,
      inscriptionAuthority,
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
    dta?: dta,
  ) {
    console.log("data to send to api tapTransfer", dta)
    
    const res = await this.api.post('/v1/inscribe/order/tapTransfer', {
      feeRate,
      postage: outputValue,
      connectedAddress,
      rebar: false,
      ticker,
      receiver: receiveAddress,
      amount,
      data: dta,
    });
    if (!res.data) {
      throw new Error('Inscribe tap transfer order failed');
    }
    return {...res?.data?.data};
  }

  // get orders ready to tap
  async getReadyToTap(address: string, orderType: OrderType) {
    const res = await this.api.get(
      `/v1/inscribe/order/readyToTap/${address}?orderType=${orderType}`,
      {},
    );
    if (!res.data) {
      throw new Error('Get ready to tap order failed');
    }
    // type cast
    return res?.data?.data as InscribeOrder[];
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
  async tappingOrder(orderId: string, headers?: any) {
    const res = await this.api.post(
      `/v1/inscribe/order/tapping/${orderId}`,
      {},
      headers,
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

  // mark order as  cancel
  async cancelOrder(orderId: string, headers?: any) {
    await this.api.post(`/v1/inscribe/order/cancel/${orderId}`, {}, headers);
  }

  // get cancel authority by authority inscription id
  async getCancelAuthority(authorityInscriptionId: string) {
    const res = await this.api.get(
      `/v1/inscribe/order/cancelAuthority/${authorityInscriptionId}`,
      {},
    );
    if (!res.data) {
      throw new Error('Get cancel authority failed');
    }
    return res?.data?.data as InscribeOrder;
  }

  // get Unat script by ticker
  async getUnatScriptByTicker(ticker: string) {
    const encodedTicker = encodeURIComponent(ticker);
    const res = await this.api.get(
      `/v1/inscribe/order/unats/${encodedTicker}`,
      {},
    );
    if (!res.data) {
      throw new Error('Get unat script failed');
    }
    return res?.data?.data?.scriptInscription || null;
  }
}
