import {Inscription, InscriptionUTXO, Network} from '@/src/wallet-instance';

export const convertInscriptionTransferList = (
  network: Network,
  data: InscriptionUTXO[],
): Inscription[] => {
  const urlPreview =
    network === Network.TESTNET
      ? 'https://static-testnet.unisat.io/preview/'
      : 'https://static.unisat.io/preview/';
  const urlContent =
    network === Network.TESTNET
      ? 'https://static-testnet.unisat.io/content/'
      : 'https://static.unisat.io/content/';
  const result: Inscription[] = [];
  data.forEach(v => {
    const transfer: Inscription = {
      inscriptionId: v.inscriptions[0]?.inscriptionId,
      inscriptionNumber: v.inscriptions[0]?.inscriptionNumber,
      address: v.address,
      outputValue: v.satoshi,
      preview: `${urlPreview}${v.inscriptions[0]?.inscriptionId}`,
      content: `${urlContent}${v.inscriptions[0]?.inscriptionId}`,
      contentType: '',
      contentLength: 0,
      timestamp: 1722918147,
      genesisTransaction: v.txid,
      location: '',
      output: '',
      offset: v.inscriptions[0]?.offset,
      contentBody: '',
      utxoHeight: v.height,
      utxoConfirmation: 0,
    };
    result.push(transfer);
  });
  return result;
};

export const transferResponseToInscription = (
  network: Network,
  response: any,
): Inscription => {
  const urlPreview =
    network === Network.TESTNET
      ? 'https://static-testnet.unisat.io/preview/'
      : 'https://static.unisat.io/preview/';
  const urlContent =
    network === Network.TESTNET
      ? 'https://static-testnet.unisat.io/content/'
      : 'https://static.unisat.io/content/';
  return {
    inscriptionId: response?.inscriptionId,
    inscriptionNumber: response?.inscriptionNumber,
    address: response?.utxo?.address,
    outputValue: response?.utxo?.satoshi,
    preview: `${urlPreview}${response.inscriptionId}`,
    content: `${urlContent}${response.inscriptionId}`,
    contentType: response?.contentType,
    contentLength: response?.contentLength,
    timestamp: response?.timestamp,
    genesisTransaction: response?.utxo?.txid,
    location: '',
    output: '',
    offset: response?.offset,
    contentBody: response?.contentBody,
    utxoHeight: 0,
    utxoConfirmation: 0,
  };
};
