import * as bitcoin from 'bitcoinjs-lib';
import {
  AddressType,
  Network,
  InputForSigning,
  TxInput,
  TxOutput,
  UnspentOutput,
} from '../types';
import {TempWallet} from './temp-wallet';
import {addressToScriptPk, getBitcoinNetwork} from '../../background/utils';
import {toXOnly} from 'bitcoinjs-lib/src/psbt/bip371';
import {UTXO_DUST} from '../constant';

function convertUtxoToInput(
  utxo: UnspentOutput,
  addressType: AddressType,
  pubkey: string,
): TxInput | undefined {
  if (
    addressType === AddressType.P2TR ||
    addressType === AddressType.M44_P2TR
  ) {
    const data = {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.satoshi,
        script: Buffer.from(utxo.scriptPk, 'hex'),
      },
      tapInternalKey: toXOnly(Buffer.from(pubkey, 'hex')),
    };
    return {
      data,
      utxo,
    };
  } else if (
    addressType === AddressType.P2WPKH ||
    addressType === AddressType.M44_P2WPKH
  ) {
    const data = {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.satoshi,
        script: Buffer.from(utxo.scriptPk, 'hex'),
      },
    };
    return {
      data,
      utxo,
    };
  } else if (addressType === AddressType.P2PKH) {
    const data = {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.satoshi,
        script: Buffer.from(utxo.scriptPk, 'hex'),
      },
    };
    return {
      data,
      utxo,
    };
  } else if (addressType === AddressType.P2SH_P2WPKH) {
    const redeemData = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(pubkey, 'hex'),
    });
    const data = {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.satoshi,
        script: Buffer.from(utxo.scriptPk, 'hex'),
      },
      redeemScript: redeemData.output,
    };
    return {
      data,
      utxo,
    };
  }
}
export class Transaction {
  networkType: Network;
  fromAddress: string;
  addressType: AddressType;
  pubkey: string;
  feeRate: number;
  enableRBF: boolean;
  allBtcUtxos: UnspentOutput[] = [];
  selectedUtxos: UnspentOutput[] = [];
  outputs: TxOutput[] = [];
  inputs: TxInput[] = [];

  constructor({
    networkType,
    fromAddress,
    addressType,
    pubkey,
    feeRate,
    enableRBF,
  }: {
    networkType: Network;
    fromAddress: string;
    addressType: AddressType;
    pubkey: string;
    feeRate: number;
    enableRBF: boolean;
  }) {
    this.networkType = networkType;
    this.fromAddress = fromAddress;
    this.addressType = addressType;
    this.pubkey = pubkey;
    this.feeRate = feeRate;
    this.enableRBF = enableRBF;
  }

  // Add UTXOs to the transaction
  addUtxos(utxos: UnspentOutput[]) {
    this.allBtcUtxos = utxos.sort((a, b) => b.satoshi - a.satoshi);
  }

  addInscriptionInput(assetUtxo: UnspentOutput) {
    const assetUtxoInput = convertUtxoToInput(
      assetUtxo,
      this.addressType,
      this.pubkey,
    );
    if (assetUtxoInput) {
      this.inputs.push(assetUtxoInput);
      this.selectedUtxos.push(assetUtxo);
    }
  }

  addBtcInput(utxo: UnspentOutput) {
    const utxoInput = convertUtxoToInput(utxo, this.addressType, this.pubkey);
    if (utxoInput) {
      this.inputs.push(utxoInput);
    }
  }

  // Add outputs to the transaction
  addOutput(output: TxOutput) {
    this.outputs.push(output);
  }

  getTotalInput() {
    return this.inputs.reduce((pre, cur) => pre + cur.utxo.satoshi, 0);
  }

  getTotalOutput() {
    return this.outputs.reduce((pre, cur) => pre + cur.value, 0);
  }

  // Estimate the size of the input based on address type
  estimateInputSize(): number {
    switch (this.addressType) {
      case AddressType.P2PKH:
        return 148;
      case AddressType.P2WPKH:
        return 68;
      case AddressType.P2TR:
      case AddressType.M44_P2TR:
        return 58;
      case AddressType.P2SH_P2WPKH:
        return 91;
      default:
        throw new Error('Unsupported address type');
    }
  }

  estimateOutputSize(): number {
    switch (this.addressType) {
      case AddressType.P2PKH:
        return 34;
      case AddressType.P2WPKH:
        return 31;
      case AddressType.P2TR:
      case AddressType.M44_P2TR:
        return 43;
      case AddressType.P2SH_P2WPKH:
        return 32;
      default:
        throw new Error('Unsupported address type');
    }
  }

  // Estimate the total transaction size (in vbytes)
  estimateTransactionSize(inputCount: number, outputCount: number): number {
    const inputSize = this.estimateInputSize();
    const baseSize = 10; // Base overhead size (version, locktime, etc.)
    const outputSize = this.estimateOutputSize(); // Standard output size for P2PKH/P2WPKH outputs
    // const witnessSize = inputSize;
    return baseSize + inputSize * inputCount + outputSize * outputCount;
  }

  // Calculate the fee based on transaction size and fee rate
  calculateTransactionFee(numInputs: number, numOutputs: number): number {
    const txSize = this.estimateTransactionSize(numInputs, numOutputs); // vbytes
    return txSize * this.feeRate; // Fee in satoshis
  }
  // Generate temp wallet
  async generateTempWallet() {
    const tempWallet = TempWallet.generateRandom(
      this.addressType,
      this.networkType,
    );

    const tx = new Transaction({
      networkType: this.networkType,
      fromAddress: this.fromAddress,
      addressType: this.addressType,
      pubkey: this.pubkey,
      feeRate: this.feeRate,
      enableRBF: this.enableRBF,
    });
    tx.selectedUtxos = [...this.selectedUtxos];
    // tx.inputs = [...this.inputs];
    tx.outputs = [...this.outputs];
    tx.inputs = [];

    const scriptPk = addressToScriptPk(
      tempWallet.address,
      this.networkType,
    ).toString('hex');
    tx.selectedUtxos.forEach(v => {
      v.scriptPk = scriptPk;
    });
    this.selectedUtxos.forEach(v => {
      const input = convertUtxoToInput(
        v,
        this.addressType,
        tempWallet.publicKey,
      );
      if (input) {
        tx.inputs.push(input);
      }
    });
    const psbt = tx.createPsbt();
    const inputForSigns = tx.inputs.map((v, index) => ({
      index,
      publicKey: tempWallet.publicKey,
    }));
    await tempWallet.finalizePsbt(psbt, {
      autoFinalized: true,
      inputForSigns: inputForSigns,
    });
    return psbt;
  }

  // Calculate network fee from temp wallet
  async calNetworkFeeFromTempWallet() {
    const psbt = await this.generateTempWallet();
    const txSize = psbt.extractTransaction(true).virtualSize();
    const fee = Math.ceil(txSize * this.feeRate);
    return fee;
  }

  // Select UTXOs while preserving the ordinal inscription
  selectUtxos() {
    let totalValue = this.getTotalInput() || 0;
    let numInputs = this.inputs.length || 0;
    let estimatedFee: number;
    let requiredAmount: number;

    // if there are already inputs, calculate the fee and required amount
    if (this.inputs.length > 0) {
      estimatedFee = this.calculateTransactionFee(
        numInputs,
        this.outputs.length + 1,
      );
      requiredAmount = this.getTotalOutput() + estimatedFee;
      if (totalValue >= requiredAmount) {
        // selects enough utxos to cover amount and fee and skip the rest
        return;
      }
    }

    for (const utxo of this.allBtcUtxos) {
      this.addBtcInput(utxo);
      this.selectedUtxos.push(utxo);
      totalValue += utxo.satoshi;
      numInputs += 1;

      // Recalculate fee and required amount based on the number of inputs
      estimatedFee = this.calculateTransactionFee(
        numInputs,
        this.outputs.length + 1,
      ); // +1 for the change output
      requiredAmount = this.getTotalOutput() + estimatedFee;
      if (totalValue >= requiredAmount) {
        return;
      }
    }

    throw new Error('Insufficient BTC to cover amount and fee');
  }

  // Generate inputs for signing the PSBT
  generateInputForSignings(selectedUtxos: UnspentOutput[]): InputForSigning[] {
    return selectedUtxos.map((utxo, index) => ({
      index,
      publicKey: this.pubkey, // Public key associated with the UTXO
    }));
  }

  // Create the PSBT from selected UTXOs and outputs
  createPsbt(): bitcoin.Psbt {
    const network = getBitcoinNetwork(this.networkType);
    const psbt = new bitcoin.Psbt({network});

    // Add UTXOs to PSBT
    this.inputs.forEach((v, index) => {
      if (this.addressType === AddressType.P2PKH) {
        if (v.data.witnessUtxo) {
          //@ts-expect-error
          psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = true;
        }
      }
      psbt.data.addInput(v.data);
      if (this.enableRBF) {
        psbt.setInputSequence(index, 0xfffffffd);
      }
    });

    // Add outputs to PSBT
    this.outputs.forEach(v => {
      if (v.address) {
        psbt.addOutput({
          address: v.address,
          value: v.value,
        });
      } else if (v.script) {
        psbt.addOutput({
          script: v.script,
          value: v.value,
        });
      }
    });

    return psbt;
  }

  // Main function to prepare PSBT for signing
  async prepareTransaction() {
    // add temp outputs for sender
    this.addOutput({address: this.fromAddress, value: 0});

    // select btc utxo to cover amount and fee
    this.selectUtxos();
    const networkFee = await this.calNetworkFeeFromTempWallet();
    const changeAmount =
      this.getTotalInput() - this.getTotalOutput() - networkFee;
    // remove temp output for sender
    this.outputs.splice(this.outputs.length - 1, 1);

    // add change amount to outputs
    if (changeAmount > UTXO_DUST) {
      this.addOutput({address: this.fromAddress, value: changeAmount});
    }
    const psbt = this.createPsbt();
    const inputForSigns = this.generateInputForSignings(this.selectedUtxos);
    return {psbt, inputForSigns, inputs: this.inputs, outputs: this.outputs};
  }
}
