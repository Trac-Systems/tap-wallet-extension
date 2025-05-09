import {TapTokenInfo} from '@/src/shared/utils/tap-response-adapter';
import {PublicWallet} from '../background/service/wallet.service';

export enum OrderType {
  TEXT = 'TEXT',
  TAP_TRANSFER = 'TAP_TRANSFER',
  TAP_MINT = 'TAP_MINT',
  TAP_DEPLOY = 'TAP_DEPLOY',
  FILE = 'FILE',
  AUTHORITY = 'AUTHORITY',
  REDEEM = 'REDEEM',
}

export enum AddressType {
  P2PKH = 'P2PKH',
  P2WPKH = 'P2WPKH',
  P2TR = 'P2TR',
  P2SH_P2WPKH = 'P2SH_P2WPKH',
  M44_P2WPKH = 'M44_P2WPKH',
  M44_P2TR = 'M44_P2TR',
  UNKNOWN = 'UNKNOWN',
}

export enum Network {
  MAINNET = 'MAINNET',
  TESTNET = 'TESTNET',
}

export enum TxType {
  SIGN_TX,
  SEND_BITCOIN,
  SEND_ORDINALS_INSCRIPTION,
  INSCRIBE_TAP,
}

export interface TokenInfo {
  totalSupply: string;
  totalMinted: string;
  decimal: number;
  holder: string;
  inscriptionId: string;
  dmt: boolean;
}

export interface TokenBalance {
  availableBalance: string;
  overallBalance: string;
  ticker: string;
  transferableBalance: string;
  availableBalanceSafe: string;
  availableBalanceUnSafe: string;
  tokenInfo?: TapTokenInfo;
}

export interface TokenTransfer {
  ticker: string;
  amount: string;
  inscriptionId: string;
  inscriptionNumber: number;
  timestamp: number;
}

export interface AddressTokenSummary {
  tokenInfo: TokenInfo;
  tokenBalance: TokenBalance;
  historyList: TokenTransfer[];
  transferableList: TokenTransfer[];
}

export interface IWalletDisplayUI {
  type: string;
  accounts: {
    pubkey: string;
    origin: string;
  }[];
  wallet: PublicWallet;
  addressType: AddressType;
  index: number;
}

export interface IDisplayAccount {
  type: string;
  pubkey: string;
  address: string;
  origin?: string;
  name?: string;
  displayOrigin?: string;
  index?: number;
  balance?: number;
  key: string;
}

export type WalletDisplay = {
  key: string;
  index: number;
  type: string;
  addressType: AddressType;
  accounts: IDisplayAccount[];
  name: string;
  derivationPath: string;
};

export interface TxHistoryItem {
  txid: string;
  time: number;
  date: string;
  amount: string;
  symbol: string;
  address: string;
}

export interface Inscription {
  inscriptionId: string;
  inscriptionNumber: number;
  address: string;
  outputValue: number;
  preview: string;
  content: string;
  contentType: string;
  contentLength: number;
  timestamp: number;
  genesisTransaction: string;
  location: string;
  output: string;
  offset: number;
  contentBody: string;
  utxoHeight: number;
  utxoConfirmation: number;
  // utxo info
  utxoInfo?: UnspentOutput;
  // for many inscriptions in one utxo
  hasMoreInscriptions?: string[];
}

export interface InscriptionMintedItem {
  title: string;
  desc: string;
  inscriptions: Inscription[];
}

export interface InscriptionSummary {
  mintedList: InscriptionMintedItem[];
}

export interface AddressSummary {
  address: string;
  totalSatoshis: number;
  btcSatoshis: number;
  assetSatoshis: number;
  inscriptionCount: number;
  loading?: boolean;
}

export interface UnspentOutput {
  txid: string;
  vout: number;
  satoshi: number;
  scriptType: string;
  scriptPk: string;
  codeType: number;
  address: string;
  height: number;
  idx: number;
  isOpInRBF: boolean;
  isSpent: boolean;
  inscriptions: {
    inscriptionNumber: number;
    inscriptionId: string;
    offset: number;
    moved: boolean;
    sequence: number;
    isCursed: boolean;
    isVindicate: boolean;
    isBRC20: boolean;
  }[];
}
export interface ToAddressInfo {
  address: string;
  domain?: string;
  inscription?: Inscription;
}

export interface InputForSigning {
  index: number;
  publicKey: string;
  sighashTypes?: number[];
}
export interface RawTxInfo {
  psbtHex: string;
  rawtx: string;
  outputs?: TxOutput[];
  inputs?: TxInput[];
  inputForSigns?: InputForSigning[];
  toAddressInfo?: ToAddressInfo;
  fee?: number;
  feeRate?: number;
  assetAmount?: string;
  ticker?: string;
  enableRBF?: boolean;
}

export interface TxInput {
  data: {
    hash: string;
    index: number;
    witnessUtxo?: {value: number; script: Buffer};
    tapInternalKey?: Buffer;
    nonWitnessUtxo?: Buffer;
  };
  utxo: UnspentOutput;
}

export interface TxOutput {
  address?: string;
  script?: Buffer;
  value: number;
}

interface BaseUserInputForSigning {
  index: number;
  sighashTypes?: number[] | undefined;
  disableTweakSigner?: boolean;
}

export interface AddressUserInputForSigning extends BaseUserInputForSigning {
  address: string;
}

export interface PublicKeyUserInputForSigning extends BaseUserInputForSigning {
  publicKey: string;
}

export type UserInputForSigning =
  | AddressUserInputForSigning
  | PublicKeyUserInputForSigning;

export interface TransactionSigningOptions {
  autoFinalized: boolean;
  inputForSigns?: UserInputForSigning[];
}

export interface ExtractPsbt {
  outputs: {
    txid: string;
    vout: number;
    address: string;
    value: number;
    sighashType: number;
  }[];
  inputs: {
    address: string;
    value: number;
  }[];
  feeRate: number;
  fee: number;
  features: {
    rbf: boolean;
  };
}

export interface InputForSigning {
  index: number;
  publicKey: string;
  sighashTypes?: number[];
}

// export interface InscribeOrder {
//   orderId: string;
//   payAddress: string;
//   totalFee: number;
//   minerFee: number;
//   originServiceFee: number;
//   serviceFee: number;
//   outputValue: number;
// }

export interface InscribeOrder {
  payAddress: string;
  files: InscribeTransferFile[];
  type: OrderType;
  postage: number;
  feeRate: number;
  totalFee: number;
  networkFee: number;
  serviceFee: number;
  sizeToFee: number;
  connectedAddress: string;
  rebar: boolean;
  firstRevealTxSize: number;
  remainingRevealTxsSize: number;
  tappingStatus: number;
  paidAmount: number;
  requestFrom: string;
  repeat: string;
  updatedAt: string;
  createdAt: string;
  id: string;
  status: number;
}

export interface InscribeTransferFile {
  filename: string;
  receiver: string;
  inscriptionId: string;
  txId: string;
}

export interface InscribeOrderTransfer {
  orderId: string;
  status: string;
  payAddress: string;
  receiveAddress: string;
  amount: number;
  paidAmount: number;
  outputValue: number;
  feeRate: number;
  minerFee: number;
  serviceFee: number;
  files: InscribeTransferFile[];
  count: number;
  pendingCount: number;
  unconfirmedCount: number;
  confirmedCount: number;
  createTime: number;
  devFee: number;
  leftAmount: number;
}

export interface IListInscription {
  inscriptionNumber: number;
  inscriptionId: string;
  offset: number;
  moved: boolean;
  sequence: number;
  isCursed: boolean;
  isVindicate: boolean;
  isBRC20: boolean;
}

export interface TokenAuth {
  proto: string;
  isValid: boolean;
}

export interface TokenAuthority {
  addr: string;
  auth: string[];
  sig: {
    v: string;
    r: string;
    s: string;
  };
  hash: string;
  slt: string;
  blck: number;
  tx: string;
  vo: number;
  val: string;
  ins: string;
  num: number;
  ts: number;
}
