/* eslint-disable no-unsafe-optional-chaining */
import {
  convertInscriptionTransferList,
  transferResponseToInscription,
} from '@/src/shared/utils/inscription-response-adapter';
import {
  InscribeOrder,
  InscribeOrderTransfer,
  Inscription,
  Network,
  UnspentOutput,
} from '@/src/wallet-instance';
import {networkConfig} from '../service/singleton';
import {AxiosRequest} from './axios';
import {isEmpty} from 'lodash';
export const PAID_API_TESTNET = 'https://open-api-testnet.unisat.io';
export const PAID_API_KEY_TESTNET =
  '9390cb53fbd387be6fe5e3d997e5759805de93fbfcae9298a314bf500df2a527';
export const PAID_API_MAINNET = 'https://open-api.unisat.io';
export const PAID_API_KEY_MAINNET =
  'e3133d5812314a4e912e3e3aaaef2e5980e476663543811c92aee34cf7887875';

export interface IResponseAddressBalance {
  address: string;
  satoshi: number;
  pendingSatoshi: number;
  utxoCount: number;
  btcSatoshi: number;
  btcPendingSatoshi: number;
  btcUtxoCount: number;
  inscriptionSatoshi: number;
  inscriptionPendingSatoshi: number;
  inscriptionUtxoCount: number;
}
export class PaidApi {
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
      baseUrl: PAID_API_MAINNET,
      apiKey: PAID_API_KEY_MAINNET,
    });
    if (network === Network.TESTNET) {
      this.api = new AxiosRequest({
        baseUrl: PAID_API_TESTNET,
        apiKey: PAID_API_KEY_TESTNET,
      });
    }
  }

  async getAddressBalance(address: string): Promise<IResponseAddressBalance> {
    const response = await this.api.get(
      `/v1/indexer/address/${address}/balance`,
      {},
    );
    return response.data?.data;
  }
  async getBtcUtxo(address: string, cursor = 0, size = 200): Promise<any> {
    const response = await this.api.get(
      `/v1/indexer/address/${address}/utxo-data`,
      {cursor, size},
    );
    return response.data?.data;
  }

  async getAllBTCUtxo(address: string): Promise<UnspentOutput[]> {
    const utxos: UnspentOutput[] = [];
    let cursor = 0;
    const size = 100;

    let response = await this.getBtcUtxo(address, cursor, size);
    const total = response?.total || 0;

    utxos.push(...response?.utxo);

    while (cursor + size < total) {
      cursor += size;
      response = await this.getBtcUtxo(address, cursor, size);
      utxos.push(...response?.utxo);
    }

    return utxos;
  }

  async getInscriptionsUtxo(address: string, pageNumber = 0, pageSize = 200) {
    const response = await this.api.get(
      `/v1/indexer/address/${address}/inscription-utxo-data`,
      {cursor: pageNumber, size: pageSize},
    );
    return response.data?.data;
  }

  async getAllInscriptionUtxo(address: string): Promise<UnspentOutput[]> {
    const utxos: UnspentOutput[] = [];

    let cursor = 0;
    const size = 100;

    let response = await this.getInscriptionsUtxo(address, cursor, size);
    const total = response?.total || 0;

    utxos.push(...response?.utxo);

    while (cursor + size < total) {
      cursor += size;
      response = await this.getInscriptionsUtxo(address, cursor, size);
      utxos.push(...response?.utxo);
    }

    return utxos;
  }

  async getInscriptions(
    address: string,
    pageNumber: number,
    pageSize: number,
  ): Promise<{list: Inscription[]; total: number; cursor: number}> {
    const dataResult = await this.getInscriptionsUtxo(
      address,
      pageNumber,
      pageSize,
    );
    const network = networkConfig.getActiveNetwork();
    return {
      list: !isEmpty(dataResult?.utxo)
        ? convertInscriptionTransferList(network, dataResult?.utxo)
        : [],
      total: dataResult?.total,
      cursor: dataResult?.cursor,
    };
  }

  async getInscriptionInfo(inscriptionId: string): Promise<Inscription> {
    const result = await this.api.get(
      `/v1/indexer/inscription/info/${inscriptionId}`,
      {},
    );
    const dataResult = result.data?.data;
    const network = networkConfig.getActiveNetwork();
    return transferResponseToInscription(network, dataResult);
  }

  async getInscriptionUtxoByInscriptions(address, inscriptions: string[]) {
    const inscriptionsMap: {[key: string]: true} = {};
    inscriptions.forEach(ins => (inscriptionsMap[ins] = true));
    const utxos = await this.getAllInscriptionUtxo(address);
    return utxos.filter(utxo => {
      if (utxo.inscriptions?.length === 1) {
        const ins = utxo.inscriptions[0].inscriptionId;
        if (inscriptionsMap[ins]) {
          return true;
        }
      }
    });
  }

  async createOrderRequest(
    address: string,
    tick: string,
    amt: string,
    feeRate: number,
    outputValue: number,
  ): Promise<InscribeOrder> {
    const dataInscribeObject = {
      p: 'tap',
      op: 'token-transfer',
      tick,
      amt,
    };
    const dataInscribe = JSON.stringify(dataInscribeObject);
    const res = await this.api.post('/v2/inscribe/order/create', {
      receiveAddress: address,
      feeRate: feeRate,
      outputValue: outputValue,
      files: [
        {
          filename: dataInscribe,
          dataURL: `data:text/plain;charset=utf-8;base64,${Buffer.from(
            dataInscribe,
          ).toString('base64')}`,
        },
      ],
      devAddress: address,
      devFee: 0,
    });
    return {...res?.data.data, totalFee: res?.data?.data.amount};
  }

  async getInscribeTapResult(orderId: string): Promise<InscribeOrderTransfer> {
    try {
      const response = await this.api.get(`/v2/inscribe/order/${orderId}`, {});
      return {...response?.data?.data};
    } catch (error) {
      throw new Error((error as any).message);
    }
  }
}