/* eslint-disable no-unsafe-optional-chaining */
import {
  convertInscriptionTransferList,
  transferResponseToInscription,
} from '@/src/shared/utils/inscription-response-adapter';
import {
  InscribeOrder,
  InscribeOrderTransfer,
  Inscription,
  InscriptionOrdClient,
  Network,
  UnspentOutput,
} from '@/src/wallet-instance';
import {isEmpty} from 'lodash';
import {networkConfig} from '../service/singleton';
import {AxiosRequest} from './axios';
export const PAID_API_TESTNET = 'https://open-api-testnet.unisat.io';
export const PAID_API_KEY_TESTNET =
  '9390cb53fbd387be6fe5e3d997e5759805de93fbfcae9298a314bf500df2a527';
export const PAID_API_MAINNET = 'https://open-api.unisat.io';
export const PAID_API_KEY_MAINNET =
  'e3133d5812314a4e912e3e3aaaef2e5980e476663543811c92aee34cf7887875';

export const ORD_SCAN_API_KEY_TESTNET = 'http://trac.intern.ungueltig.com:55002';
export const ORD_SCAN_API_KEY_MAINNET = 'https://ord-tw.tap-hosting.xyz';

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
  ordinalScanApi!: AxiosRequest;
  constructor() {
    if (!this.api || !this.ordinalScanApi) {
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
    this.ordinalScanApi = new AxiosRequest({
      baseUrl: ORD_SCAN_API_KEY_MAINNET,
    });

    if (network === Network.TESTNET) {
      this.api = new AxiosRequest({
        baseUrl: PAID_API_TESTNET,
        apiKey: PAID_API_KEY_TESTNET,
      });

      this.ordinalScanApi = new AxiosRequest({
        baseUrl: ORD_SCAN_API_KEY_TESTNET,
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
    // Fetch Rune UTXOs
    const runeUtxos = await this.getAllRuneUtxos(address);
    const runeUtxoSet =
      runeUtxos?.length > 0
        ? new Set(runeUtxos.map(utxo => `${utxo.txid}:${utxo.vout}`))
        : null;
    // Fetch BTC UTXOs
    let response = await this.getBtcUtxo(address, cursor, size);

    if (response === undefined) {
      throw new Error('[getInscriptionList] Invalid API response structure');
    }
    const total = response?.total || 0;

    const filterUtxos = utxoList => {
      if (!runeUtxoSet) return utxoList;
      return utxoList.filter(utxo => {
        const key = `${utxo.txid}:${utxo.vout}`;
        if (runeUtxoSet?.has(key)) {
          runeUtxoSet.delete(key); // Remove matched UTXO from the set
          return false; // Exclude it
        }
        return true; // Keep the UTXO
      });
    };

    utxos.push(...filterUtxos(response?.utxo || []));

    while (cursor + size < total) {
      cursor += size;
      response = await this.getBtcUtxo(address, cursor, size);
      utxos.push(...filterUtxos(response?.utxo || []));
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

  async getInscriptionInfoOrdClient(inscriptionId: string): Promise<InscriptionOrdClient> {
    const result = await this.ordinalScanApi.get(
      `/inscription/${inscriptionId}`,
      {},
    );
    return result?.data;
  }

  async getInscriptionInfo(inscriptionId: string): Promise<Inscription[]> {
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
      for (const ins of utxo.inscriptions) {
        if (inscriptionsMap[ins.inscriptionId]) {
          return true;
        }
      }
    });
  }

  async getAllInscriptions(address: string) {
    const utxos = await this.getAllInscriptionUtxo(address);
    const network = networkConfig.getActiveNetwork();
    return convertInscriptionTransferList(network, utxos);
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
    if (!res.data?.data) {
      throw new Error('Unisat API request failed');
    }
    return {...res?.data?.data, totalFee: res?.data?.data?.amount};
  }

  async getInscribeTapResult(orderId: string): Promise<InscribeOrderTransfer> {
    try {
      const response = await this.api.get(`/v2/inscribe/order/${orderId}`, {});
      return {...response?.data?.data};
    } catch (error) {
      throw new Error((error as any).message);
    }
  }

  async getRunes(
    address: string,
    pageNumber = 0,
    pageSize = 100,
  ): Promise<any> {
    const response = await this.api.get(
      `/v1/indexer/address/${address}/runes/balance-list`,
      {cursor: pageNumber, size: pageSize},
    );
    return response.data?.data;
  }

  async getRuneUtxos(
    address: string,
    runeid: string,
    pageNumber = 0,
    pageSize = 100,
  ): Promise<any> {
    const response = await this.api.get(
      `/v1/indexer/address/${address}/runes/${runeid}/utxo`,
      {cursor: pageNumber, size: pageSize},
    );
    return response.data?.data;
  }

  async getAllRunes(address: string): Promise<any[]> {
    const allRunes: any[] = [];
    let cursor = 0;
    const size = 100;

    // Paginate through the runes list
    let response = await this.getRunes(address, cursor, size);
    // let response = await this.getBtcUtxo(address, cursor, size);
    const total = response?.total || 0;

    allRunes.push(...response?.detail);

    while (cursor + size < total) {
      cursor += size;
      response = await this.getRunes(address, cursor, size);
      allRunes.push(...response?.detail);
    }

    return allRunes;
  }

  async getAllRuneUtxos(address: string): Promise<any[]> {
    const allUtxos: any[] = [];

    // Fetch all runes for the address
    const runes = await this.getAllRunes(address);
    for (const rune of runes) {
      const runeid = rune.runeid; // Adjust this if API response structure differs
      let cursor = 0;
      const size = 100;

      let response = await this.getRuneUtxos(address, runeid, cursor, size);
      const total = response?.total || 0;

      // Use default empty array if response.utxo is undefined
      allUtxos.push(...(response?.utxo || []));

      while (cursor + size < total) {
        cursor += size;
        response = await this.getRuneUtxos(address, runeid, cursor, size);
        // Use default empty array if response.detail is undefined
        allUtxos.push(...(response?.detail || []));
      }
    }

    return allUtxos;
  }

  async getInscriptionContent(inscriptionId: string) {
    const result = await this.ordinalScanApi.get(
      `/content/${inscriptionId}`,
      {},
    );
    return result?.data;
  }
}
