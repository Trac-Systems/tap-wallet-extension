import { InscribeOrder } from "@/src/wallet-instance";
import { CreateTextOrderDto } from "../inscribe-tap-api/create-text-order-dto";
import { InscribeOrderResponse } from "../inscribe-tap-api/inscribe-order-response";
import { AxiosRequest } from "./axios";
import { InscribeOrderTransferDto } from "../inscribe-tap-api/inscribe-order-transfer-dto";

const TAP_API_TESTNET = 'http://192.168.0.105:8080/v1/inscribe/order';
const TAP_API_MAINET = 'https://open-api.unisat.io';
export class TapInscribeApi {
  private api!: AxiosRequest;
  private baseUrl !: string;
  constructor(isTestnet: boolean = false){
    this.changeNetwork(isTestnet);
  }
  changeNetwork(isTestnet: boolean = false){
    this.baseUrl = isTestnet ? TAP_API_TESTNET : TAP_API_MAINET;
    this.api = new AxiosRequest({baseUrl: this.baseUrl});
  }

  async createOrderRequest(
    address: string,
    tick: string,
    amt: string,
    feeRate: number,
    outputValue: number,
  ): Promise<InscribeOrderResponse> {
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

    const res = await this.api.post(`${this.baseUrl}/texts`, requestData);
    if (!res.data?.data) {
      throw new Error('API request failed');
    }
    return { ...res?.data?.data, totalFee: res?.data?.data?.amount };
  }

  async getInscribeTapResult(orderId: string): Promise<InscribeOrderTransferDto> {
    try {
      const response = await this.api.get(`${this.baseUrl}/details/${orderId}`, {});
      const responseData = response?.data?.data;
      if (!responseData) {
        throw new Error('Invalid response format from backend');
      }
      return responseData;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}