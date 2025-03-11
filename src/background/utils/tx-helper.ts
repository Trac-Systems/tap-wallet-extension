import {
  AddressType,
  Network,
  InputForSigning,
  UnspentOutput,
} from '@/src/wallet-instance';
import {Transaction} from '@/src/wallet-instance/transaction';
import {isEmpty} from 'lodash';

export async function sendBTC({
  btcUtxos,
  tos,
  networkType,
  fromAddress,
  addressType,
  pubkey,
  feeRate,
  enableRBF = true,
}: {
  btcUtxos: UnspentOutput[];
  tos: {
    address: string;
    satoshis: number;
  }[];
  networkType: Network;
  fromAddress: string;
  addressType: AddressType;
  pubkey: string;
  feeRate: number;
  enableRBF?: boolean;
}) {
  const tx = new Transaction({
    networkType: networkType,
    fromAddress: fromAddress,
    addressType: addressType,
    pubkey: pubkey,
    feeRate,
    enableRBF,
  });

  tos.forEach(v => {
    tx.addOutput({address: v.address, value: v.satoshis});
  });
  tx.addUtxos(btcUtxos);
  const {psbt, inputForSigns, outputs, inputs} = await tx.prepareTransaction();
  return {psbt, inputForSigns, outputs, inputs};
}

export async function sendInscription({
  assetUtxo,
  btcUtxos,
  toAddress,
  networkType,
  fromAddress,
  addressType,
  pubkey,
  feeRate,
  outputValue,
  enableRBF = true,
}: {
  assetUtxo: UnspentOutput;
  btcUtxos: UnspentOutput[];
  toAddress: string;
  networkType: Network;
  fromAddress: string;
  addressType: AddressType;
  pubkey: string;
  feeRate: number;
  outputValue: number;
  enableRBF?: boolean;
}) {
  // check safe Balance
  // btcUtxos.forEach(utxo => {
  //   if (!isEmpty(utxo.inscriptions)) {
  //     throw new Error('Unsafe balance');
  //   }
  // });

  // if (assetUtxo.inscriptions.length !== 1) {
  //   throw new Error('Unsafe balance');
  // }
  const tx = new Transaction({
    networkType: networkType,
    fromAddress: fromAddress,
    addressType: addressType,
    pubkey: pubkey,
    feeRate,
    enableRBF,
  });
  tx.addUtxos(btcUtxos);
  tx.addInscriptionInput(assetUtxo);
  tx.addOutput({address: toAddress, value: outputValue});

  const {psbt, inputForSigns, outputs, inputs} = await tx.prepareTransaction();
  return {psbt, inputForSigns, inputs, outputs};
}

export async function sendInscriptions({
  assetUtxos,
  btcUtxos,
  toAddress,
  networkType,
  fromAddress,
  addressType,
  pubkey,
  feeRate,
  enableRBF = true,
}: {
  assetUtxos: UnspentOutput[];
  btcUtxos: UnspentOutput[];
  toAddress: string;
  networkType: Network;
  fromAddress: string;
  addressType: AddressType;
  pubkey: string;
  feeRate: number;
  enableRBF?: boolean;
}) {
  assetUtxos.forEach(utxo => {
    if (isEmpty(utxo.inscriptions)) {
      throw new Error('Unsafe balance');
    }
  });

  const tx = new Transaction({
    networkType: networkType,
    fromAddress: fromAddress,
    addressType: addressType,
    pubkey: pubkey,
    feeRate,
    enableRBF,
  });
  tx.addUtxos(btcUtxos);

  const inputForSigns: InputForSigning[] = [];

  for (let i = 0; i < assetUtxos.length; i++) {
    const assetUtxo = assetUtxos[i];
    if (assetUtxo.inscriptions.length > 1) {
      throw new Error(
        'Multiple inscriptions in one UTXO! Please split them first.',
      );
    }
    tx.addInscriptionInput(assetUtxo);
    tx.addOutput({address: toAddress, value: assetUtxo.satoshi});
    // inputForSigns.push({index: i, publicKey: pubkey});
  }

  const res = await tx.prepareTransaction();
  const {inputs, outputs} = res;
  inputForSigns.push(...res.inputForSigns);

  const psbt = res.psbt;

  return {psbt, inputForSigns, inputs, outputs};
}
