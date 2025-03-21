import { InscribeOrder, Network } from "@/src/wallet-instance";
import { AxiosRequest } from "./axios";
import axios from "axios";
import { CreateTextOrderDto, InscribeOrderTransferDto } from "../inscribe-tap-api/inscribe.dto";
import { networkConfig } from "../service/singleton";



const TAP_API_TESTNET = 'http://192.168.0.73:8080/v1/inscribe/order';
const TAP_API_MAINET = 'https://open-api.unisat.io';
export class TapInscribeApi {
  api!: AxiosRequest;
  constructor() {
    if (!this.api) {
      this.init();
    }
  }
  //
  private init() {
    this.changeNetwork();
  }
  //
  changeNetwork (network?: Network) {
    if (!network) {
      network = networkConfig.getActiveNetwork();
      console.log(`value network: ${network}`);
        // network = Network.TESTNET;
    }
    console.log(`result network: ${network}`);
    this.api = new AxiosRequest({
      baseUrl: network === Network.TESTNET ?  TAP_API_TESTNET : TAP_API_MAINET,
    });
    console.log(`this is url: ${JSON.stringify(this.api)}`);
  }
  async createOrderRequest(
    address: string,
    tick: string,
    amt: string,
    feeRate: number,
    outputValue: number,
  ) : Promise<InscribeOrder>
   {
    const requestData: CreateTextOrderDto = {
      feeRate: feeRate,
      postage: outputValue,
      connectedAddress: address,
      data: [
        {
          text: JSON.stringify({
            p: 'tap',
            op: 'token-transfer',
            tick,
            amt,
          }),
          receiver: address,
        },
      ],
    };
    try{
        const res = await this.api.post('/texts', requestData);
        if (!res.data?.data) {
          throw new Error('API response does not contain valid data');
        }
        const backendData = res.data.data;
        console.log(`backend data: ${backendData}`);
        return {
          orderId: backendData.id,
          payAddress: backendData.payAddress,
          totalFee: backendData.totalFee,
          minerFee: backendData.networkFee,
          originServiceFee: backendData.serviceFee,
          serviceFee: backendData.serviceFee,
          outputValue: backendData.postage,
        };
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const {statusCode, message, error: errorName } = error.response.data || {};
            console.error(`🚨 API Error (${statusCode} - ${errorName}): ${message}`);
            throw new Error(`API Error: ${message}`);
        }
        console.error(`❌ Unexpected Error: ${(error as Error).message}`);
        throw new Error(`Unexpected Error: ${(error as Error).message}`);
    }
}

  async getInscribeTapResult(orderId: string): Promise<InscribeOrderTransferDto> {
    try {
      const response = await this.api.get(`/details/${orderId}`, {});
      const responseData = response?.data?.data;
      if (!responseData) {
        throw new Error('Invalid response format from backend');
      }
      return responseData;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const {statusCode, message, error: errorName } = error.response.data || {};
            console.error(`🚨 API Error (${statusCode} - ${errorName}): ${message}`);
            throw new Error(`API Error: ${message}`);
        }
        console.error(`❌ Unexpected Error: ${(error as Error).message}`);
        throw new Error(`Unexpected Error: ${(error as Error).message}`);
    }
  }
}