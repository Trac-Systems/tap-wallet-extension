import {createSlice} from '@reduxjs/toolkit';
import {Inscription, UnspentOutput} from '@/src/wallet-instance';

export interface BitcoinTx {
  fromAddress: string;
  toAddress: string;
  toSatoshis: number;
  rawtx: string;
  txid: string;
  fee: number;
  estimateFee: number;
  changeSatoshis: number;
  sending: boolean;
  autoAdjust: boolean;
  psbtHex: string;
  feeRate: number;
  toDomain: string;
  enableRBF: boolean;
}

export interface OrdinalsTx {
  fromAddress: string;
  toAddress: string;
  inscription: Inscription;
  rawtx: string;
  txid: string;
  fee: number;
  estimateFee: number;
  changeSatoshis: number;
  sending: boolean;
  psbtHex: string;
  feeRate: number;
  toDomain: string;
  outputValue: number;
  enableRBF: boolean;
}

export interface TransactionsState {
  bitcoinTx: BitcoinTx;
  ordinalsTx: OrdinalsTx;
  btcUtxos: UnspentOutput[];
  inscriptionUtxos: UnspentOutput[];
  spendUnavailableUtxos: UnspentOutput[];
  assetUtxos_atomicals_ft: UnspentOutput[];
  assetUtxos_atomicals_nft: UnspentOutput[];
  assetUtxos_inscriptions: UnspentOutput[];
  txStateInfo: {
    toInfo: {
      address: string;
      domain: string;
    };
    inputAmount: string;
    enableRBF: boolean;
    feeRate: number;
  };
}

export const initialState: TransactionsState = {
  bitcoinTx: {
    fromAddress: '',
    toAddress: '',
    toSatoshis: 0,
    rawtx: '',
    txid: '',
    fee: 0,
    estimateFee: 0,
    changeSatoshis: 0,
    sending: false,
    autoAdjust: false,
    psbtHex: '',
    feeRate: 5,
    toDomain: '',
    enableRBF: false,
  },
  ordinalsTx: {
    fromAddress: '',
    toAddress: '',
    inscription: {
      inscriptionId: '',
      inscriptionNumber: 0,
      address: '',
      outputValue: 0,
      preview: '',
      content: '',
      contentType: '',
      contentLength: 0,
      timestamp: 0,
      genesisTransaction: '',
      location: '',
      output: '',
      offset: 0,
      contentBody: '',
      utxoHeight: 0,
      utxoConfirmation: 0,
    },
    rawtx: '',
    txid: '',
    fee: 0,
    estimateFee: 0,
    changeSatoshis: 0,
    sending: false,
    psbtHex: '',
    feeRate: 5,
    toDomain: '',
    outputValue: 10000,
    enableRBF: false,
  },

  spendUnavailableUtxos: [],
  assetUtxos_atomicals_ft: [],
  assetUtxos_atomicals_nft: [],
  assetUtxos_inscriptions: [],
  txStateInfo: {
    toInfo: {
      address: '',
      domain: '',
    },
    inputAmount: '',
    enableRBF: false,
    feeRate: 1,
  },
  btcUtxos: [],
  inscriptionUtxos: [],
};

const TransactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    updateBitcoinTx(
      state,
      action: {
        payload: {
          fromAddress?: string;
          toAddress?: string;
          toSatoshis?: number;
          changeSatoshis?: number;
          rawtx?: string;
          txid?: string;
          fee?: number;
          estimateFee?: number;
          sending?: boolean;
          autoAdjust?: boolean;
          psbtHex?: string;
          feeRate?: number;
          toDomain?: string;
          enableRBF?: boolean;
        };
      },
    ) {
      const {payload} = action;
      state.bitcoinTx = Object.assign({}, state.bitcoinTx, payload);
    },
    updateOrdinalsTx(
      state,
      action: {
        payload: {
          fromAddress?: string;
          toAddress?: string;
          inscription?: Inscription;
          changeSatoshis?: number;
          rawtx?: string;
          txid?: string;
          fee?: number;
          estimateFee?: number;
          sending?: boolean;
          psbtHex?: string;
          feeRate?: number;
          toDomain?: string;
          outputValue?: number;
          enableRBF?: boolean;
        };
      },
    ) {
      const {payload} = action;
      state.ordinalsTx = Object.assign({}, state.ordinalsTx, payload);
    },
    setBtcUtxos(state, action: {payload: UnspentOutput[]}) {
      state.btcUtxos = action.payload;
    },
    setInscriptionUtxos(state, action: {payload: UnspentOutput[]}) {
      state.inscriptionUtxos = action.payload;
    },
    setSpendUnavailableUtxos(state, action: {payload: UnspentOutput[]}) {
      state.spendUnavailableUtxos = action.payload;
    },
    setAssetUtxosInscriptions(state, action: {payload: UnspentOutput[]}) {
      state.assetUtxos_inscriptions = action.payload;
    },

    setTxStateInfo(
      state,
      action: {
        payload: {
          toInfo?: {
            address: string;
            domain: string;
          };
          inputAmount?: string;
          enableRBF?: boolean;
          feeRate?: number;
        };
      },
    ) {
      if (action.payload.toInfo !== undefined) {
        state.txStateInfo.toInfo = action.payload.toInfo;
      }
      if (action.payload.inputAmount !== undefined) {
        state.txStateInfo.inputAmount = action.payload.inputAmount;
      }
      if (action.payload.enableRBF !== undefined) {
        state.txStateInfo.enableRBF = action.payload.enableRBF;
      }
      if (action.payload.feeRate !== undefined) {
        state.txStateInfo.feeRate = action.payload.feeRate;
      }
    },
    resetTxStateInfo(state) {
      state.txStateInfo = initialState.txStateInfo;
    },
  },
});

export const TransactionsActions = TransactionSlice.actions;
export default TransactionSlice;
