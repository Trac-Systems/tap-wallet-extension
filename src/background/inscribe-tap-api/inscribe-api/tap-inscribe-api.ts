
import { AxiosRequest } from '../../requests/axios';
import { CreateTextOrderDto } from '../inscribe-dto/create-text-order-dto';
import { InscribeOrderResponse } from '../inscribe-dto/inscribe-order-response';
import { InscribeOrderTransferDto } from '../inscribe-dto/inscribe-order-transfer-dto';


const TAP_API = 'http://157.230.45.91:8080/v1/inscribe/order';

export class InscribeService {
  private api: AxiosRequest;

  constructor(apiInstance: AxiosRequest) {
    this.api = apiInstance;
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

    const res = await this.api.post(`${TAP_API}/texts`, requestData);
    if (!res.data?.data) {
      throw new Error('API request failed');
    }
    return { ...res?.data?.data, totalFee: res?.data?.data?.amount };
  }

  async getInscribeTapResult(orderId: string): Promise<InscribeOrderTransferDto> {
    try {
      const response = await this.api.get(`${TAP_API}/details/${orderId}`, {});
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
