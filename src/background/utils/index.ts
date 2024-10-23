import {AddressType, Network} from '../../wallet-instance';
import {bitcoin} from './bitcoin-core';

export * from './bitcoin-core';
export * from './tx-helper';
export function getBitcoinNetwork(networkType: Network) {
  if (networkType === Network.MAINNET) {
    return bitcoin.networks.bitcoin;
  } else if (networkType === Network.TESTNET) {
    return bitcoin.networks.testnet;
  } else {
    return bitcoin.networks.regtest;
  }
}
export function publicKeyToPayment(
  publicKey: string,
  type: AddressType,
  networkType: Network,
) {
  const network = getBitcoinNetwork(networkType);
  if (!publicKey) {
    return null;
  }
  const pubkey = Buffer.from(publicKey, 'hex');
  if (type === AddressType.P2PKH) {
    return bitcoin.payments.p2pkh({
      pubkey,
      network,
    });
  } else if (type === AddressType.P2WPKH || type === AddressType.M44_P2WPKH) {
    return bitcoin.payments.p2wpkh({
      pubkey,
      network,
    });
  } else if (type === AddressType.P2TR || type === AddressType.M44_P2TR) {
    return bitcoin.payments.p2tr({
      internalPubkey: pubkey.slice(1, 33),
      network,
    });
  } else if (type === AddressType.P2SH_P2WPKH) {
    const data = bitcoin.payments.p2wpkh({
      pubkey,
      network,
    });
    return bitcoin.payments.p2sh({
      pubkey,
      network,
      redeem: data,
    });
  }
}

export function deriveAddressFromPublicKey(
  publicKey: string,
  type: AddressType,
  networkType: Network,
) {
  const payment = publicKeyToPayment(publicKey, type, networkType);
  if (payment && payment.address) {
    return payment.address;
  } else {
    return '';
  }
}

export function addressToScriptPk(address: string, networkType: Network) {
  const network = getBitcoinNetwork(networkType);
  return bitcoin.address.toOutputScript(address, network);
}

export const underline2CamelCase = (str: string) => {
  return str.replace(/_(.)/g, (m, p1) => p1.toUpperCase());
};

export function getUtxoDustThreshold(addressType: AddressType) {
  switch (addressType) {
    case AddressType.P2WPKH:
    case AddressType.M44_P2WPKH:
      return 294;
    case AddressType.P2TR:
    case AddressType.M44_P2TR:
      return 330;
    default:
      return 546;
  }
}

export function extractAddressFromScript({
  script,
  tapInternalKey,
  network,
}: {
  script: Buffer;
  tapInternalKey?: Buffer ;
  network: bitcoin.Network;
}) {
  // For P2TR address
  if (tapInternalKey) {
    try {
      return bitcoin.payments.p2tr({internalPubkey: tapInternalKey, network})
        .address;
    } catch {
      throw new Error('Unknown output type');
    }
  }

  // For another type
  let address = '';
  const paymentInput = {output: script, network};
  try {
    address = bitcoin.payments.p2pkh(paymentInput).address || '';
  } catch {
    try {
      address = bitcoin.payments.p2sh(paymentInput).address || '';
    } catch {
      try {
        address = bitcoin.payments.p2wpkh(paymentInput).address || '';
      } catch {
        try {
          address = bitcoin.payments.p2wsh(paymentInput).address || '';
        } catch {
          throw new Error('Unknown output type');
        }
      }
    }
  }
  return address;
}
