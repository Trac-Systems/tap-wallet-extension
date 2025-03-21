export class CreateTextOrderDto {
    feeRate: number;
    postage: number;
    connectedAddress: string;
    data: {
        text: string;
        receiver: string;
    }[];
}
//
export interface InscribeOrderResponse {
    id: string;
    totalFee: number;
    payAddress: string;
    status: number;
    files: FileResponse[];
    connectedAddress: string;
}

export interface FileResponse {
    filename: string;
    size: number;
    receiver: string;
    status: number;
}
//
export class FileDetailDto {
    filename: string;
    size: number;
    receiver: string;
    status: number;
    reveal_as_pay_address: boolean;
}

export class OrderDetailsDto {
    updateAt: string;
    createAt: string;
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

export class InscribeOrderTransferDto {
    orderId: string;
    orderDetails: OrderDetailsDto;
}