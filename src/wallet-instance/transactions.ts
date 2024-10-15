export interface ISignTxInput {
  index: number;
  publicKey: string;
  sighashTypes?: number[];
}
