export class CreateTextOrderDto {
    feeRate: number;
    postage: number;
    connectedAddress: string;
    data: {
      text: string;
      receiver: string;
    }[];
}  