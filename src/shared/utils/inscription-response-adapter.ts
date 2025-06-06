import {Inscription, UnspentOutput, Network} from '@/src/wallet-instance';

export const convertInscriptionTransferList = (
  network: Network,
  data: UnspentOutput[],
): Inscription[] => {
  const urlPreview =
    network === Network.TESTNET
      ? 'http://trac.intern.ungueltig.com:55002/preview/'
      : 'https://ord-tw.tap-hosting.xyz/preview/';
  const urlContent =
    network === Network.TESTNET
      ? 'http://trac.intern.ungueltig.com:55002/content/'
      : 'https://ord-tw.tap-hosting.xyz/content/';
  const result: Inscription[] = [];
  data.forEach(v => {
    const hasMoreInscriptions = v.inscriptions.map(ins => ins?.inscriptionId);

    for (let i = 0; i < v.inscriptions.length; i++) {
      const inscription = v.inscriptions[i];
      const satoshi = i === 0 ? v.satoshi : 0;
      const utxoInfo = {...v, satoshi};

      const transfer: Inscription = {
        inscriptionId: inscription?.inscriptionId,
        inscriptionNumber: inscription?.inscriptionNumber,
        address: v.address,
        outputValue: v.satoshi,
        preview: `${urlPreview}${inscription?.inscriptionId}`,
        content: `${urlContent}${inscription?.inscriptionId}`,
        contentType: '',
        contentLength: 0,
        timestamp: 1722918147,
        genesisTransaction: v.txid,
        location: '',
        output: '',
        offset: inscription?.offset,
        contentBody: '',
        utxoHeight: v.height,
        utxoConfirmation: 0,
        utxoInfo: utxoInfo,
        hasMoreInscriptions,
      };

      if (i > 0) {
        transfer.utxoInfo.satoshi = 0;
      }

      result.push(transfer);
    }
  });
  return result;
};

export const transferResponseToInscription = (
  network: Network,
  response: any,
): Inscription[] => {
  const urlPreview =
    network === Network.TESTNET
      ? 'http://trac.intern.ungueltig.com:55002/preview/'
      : 'https://ord-tw.tap-hosting.xyz/preview/';
  const urlContent =
    network === Network.TESTNET
      ? 'http://trac.intern.ungueltig.com:55002/content/'
      : 'https://ord-tw.tap-hosting.xyz/content/';
  const hasMoreInscriptions = response?.utxo?.inscriptions?.map(ins => ins?.utxo);

  return response?.utxo?.inscriptions?.map(ins => {
    return {
      inscriptionId: ins?.inscriptionId,
      inscriptionNumber: ins?.inscriptionNumber,
      address: response?.utxo?.address,
      outputValue: response?.utxo?.satoshi,
      preview: `${urlPreview}${ins?.inscriptionId}`,
      content: `${urlContent}${ins?.inscriptionId}`,
      contentType: response?.contentType,
      contentLength: response?.contentLength,
      timestamp: response?.timestamp,
      genesisTransaction: response?.utxo?.txid,
      location: '',
      output: '',
      offset: ins?.offset || 0,
      contentBody: response?.contentBody,
      utxoHeight: 0,
      utxoConfirmation: 0,
      hasMoreInscriptions: hasMoreInscriptions,
    };
  });
};
