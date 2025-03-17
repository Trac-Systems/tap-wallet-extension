export interface InscribeOrderResponse {
  id: string;
  totalFee: number;
  payAddress: string;
  status: number;
  files: FileResponse[];
  connectedAddress: string;
}
//
export interface FileResponse {
  filename: string;
  size: number;
  receiver: string;
  status: number;
}
