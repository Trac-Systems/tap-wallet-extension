import {toXOnly} from 'bitcoinjs-lib/src/psbt/bip371';
import {
  ECPair,
  bitcoin,
  deriveAddressFromPublicKey,
  getBitcoinNetwork,
} from '../../background/utils';
import {convertScriptToAddress} from '../../shared/utils/btc-helper';
import {SingleWallet} from '../keychain';
import {
  AddressType,
  InputForSigning,
  Network,
  TransactionSigningOptions,
} from '../types';

export class TempWallet {
  private wallet: SingleWallet;
  publicKey: string;
  address: string;
  private bitcoinNetwork: bitcoin.Network;
  private chainType: Network;
  private addressType: AddressType;

  constructor(
    privateKeyWIF: string,
    chainType: Network = Network.MAINNET,
    addressType: AddressType = AddressType.P2WPKH,
  ) {
    const network = getBitcoinNetwork(chainType);
    const keyPair = ECPair.fromWIF(privateKeyWIF, network);
    this.wallet = new SingleWallet({
      privateKeys: [keyPair.privateKey?.toString('hex')],
    });
    this.wallet.addNewAccounts(0);
    this.publicKey = keyPair.publicKey.toString('hex');
    this.address = deriveAddressFromPublicKey(
      this.publicKey,
      addressType,
      chainType,
    );
    this.bitcoinNetwork = network;
    this.chainType = chainType;
    this.addressType = addressType;
  }

  static generateRandom(
    addressType: AddressType = AddressType.P2WPKH,
    chainType: Network = Network.MAINNET,
  ) {
    const network = getBitcoinNetwork(chainType);
    const ecpair = ECPair.makeRandom({network});
    return new TempWallet(ecpair.toWIF(), chainType, addressType);
  }

  getActiveNetwork() {
    return this.chainType;
  }

  private async prepareInputsForSigning(
    psbtData: string | bitcoin.Psbt,
    options?: TransactionSigningOptions,
  ): Promise<InputForSigning[]> {
    const accountAddress = this.address;
    const accountPublicKey = this.getPublicKey();
    let inputsForSigning: InputForSigning[] = [];

    if (options && options.inputForSigns) {
      inputsForSigning = options.inputForSigns.map(input => {
        const index = Number(input.index);
        if (isNaN(index)) {
          throw new Error('Invalid input index');
        }

        const {address, publicKey} = input as any;
        if (!address && !publicKey) {
          throw new Error('Input requires either an address or a public key');
        }

        if (address && address !== accountAddress) {
          throw new Error('Address mismatch in input');
        }

        if (publicKey && publicKey !== accountPublicKey) {
          throw new Error('Public key mismatch in input');
        }

        const validSighashTypes = input.sighashTypes?.map(Number);
        if (validSighashTypes?.some(isNaN)) {
          throw new Error('Invalid sighash type provided');
        }

        return {
          index,
          publicKey: accountPublicKey,
          sighashTypes: validSighashTypes,
          disableTweakSigner: input.disableTweakSigner,
        };
      });
    } else {
      const psbtInstance =
        typeof psbtData === 'string'
          ? bitcoin.Psbt.fromHex(psbtData as string, {
              network: this.bitcoinNetwork,
            })
          : (psbtData as bitcoin.Psbt);

      psbtInstance.data.inputs.forEach((inputData, index) => {
        let script: any = null;

        if (inputData.witnessUtxo) {
          script = inputData.witnessUtxo.script;
        } else if (inputData.nonWitnessUtxo) {
          const rawTransaction = bitcoin.Transaction.fromBuffer(
            inputData.nonWitnessUtxo,
          );
          const outputData =
            rawTransaction.outs[psbtInstance.txInputs[index].index];
          script = outputData.script;
        }

        const isInputSigned =
          inputData.finalScriptSig || inputData.finalScriptWitness;

        if (script && !isInputSigned) {
          const derivedAddress = convertScriptToAddress(script, this.chainType);
          if (derivedAddress === accountAddress) {
            inputsForSigning.push({
              index,
              publicKey: accountPublicKey,
              sighashTypes: inputData.sighashType
                ? [inputData.sighashType]
                : undefined,
            });
          }
        }
      });
    }

    return inputsForSigning;
  }

  async finalizePsbt(
    psbt: bitcoin.Psbt,
    signingOptions?: TransactionSigningOptions,
  ) {
    const options = signingOptions || {autoFinalized: true, inputForSigns: []};
    const inputsForSigning = await this.prepareInputsForSigning(psbt, options);

    if (inputsForSigning.length === 0) {
      throw new Error('No inputs available for signing');
    }

    psbt.data.inputs.forEach(inputData => {
      const isUnprocessed = !(
        inputData.finalScriptSig || inputData.finalScriptWitness
      );
      const requiresTaproot =
        this.addressType === AddressType.P2TR ||
        this.addressType === AddressType.M44_P2TR;

      if (isUnprocessed && requiresTaproot && !inputData.tapInternalKey) {
        const xOnlyKey = toXOnly(Buffer.from(this.publicKey, 'hex'));
        const {output} = bitcoin.payments.p2tr({
          internalPubkey: xOnlyKey,
          network: getBitcoinNetwork(this.chainType),
        });
        if (
          inputData.witnessUtxo?.script.toString('hex') ===
          output?.toString('hex')
        ) {
          inputData.tapInternalKey = xOnlyKey;
        }
      }
    });

    psbt = await this.wallet.signTransaction(psbt, inputsForSigning);

    if (options.autoFinalized) {
      inputsForSigning.forEach(input => psbt.finalizeInput(input.index));
    }

    return psbt;
  }

  getPublicKey(): string {
    return this.wallet.retrievePublicKeys()[0];
  }
}
