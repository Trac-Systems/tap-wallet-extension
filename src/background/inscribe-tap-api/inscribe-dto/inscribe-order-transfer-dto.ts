export class FileDetailDto{
    filename: string;
    size: number;
    receiver: string;
    status: number;
    reveal_as_pay_address: boolean;
}
export class OrderDetailsDto{
    updateAt: string;
    createdAt: string;
    id: string;
    payAddress: string;
    files: FileDetailDto[];
    type: string;
    postage: number;
    feeRate: number;
    totalFee: number;
    networkFee: number;
    serviceFee: number;
    sizeToFee: number;
    paidAmount: number | null;
    status: number;
    requestFrom: string | null;
    connectedAddress: string;
    repeat: string | null;
}
export class InscribeOrderTransferDto{
    orderId: string;
    orderDetails: OrderDetailsDto;
}