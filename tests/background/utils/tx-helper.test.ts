import { describe, it, expect, jest } from '@jest/globals';

jest.mock('@/src/wallet-instance/transaction', () => ({
  Transaction: jest.fn().mockImplementation(() => ({
    addUtxos: jest.fn(),
    addInscriptionInput: jest.fn(),
    addOutput: jest.fn(),
    prepareTransaction: jest.fn().mockImplementation(() =>
      Promise.resolve({ psbt: 'mock-psbt' as any, inputForSigns: [], inputs: [], outputs: [] }),
    ),
  })),
}));

import { AddressType, Network, UnspentOutput } from '@/src/wallet-instance';
import {
  sendBTC,
  sendInscription,
  sendInscriptions,
} from '../../../src/background/utils/tx-helper';

const BASE_PARAMS = {
  networkType: Network.MAINNET,
  fromAddress: 'bc1qtest',
  addressType: AddressType.P2WPKH,
  pubkey: '02aabbcc',
  feeRate: 10,
};

const INSCRIPTION = {
  inscriptionNumber: 1,
  inscriptionId: 'abc:0',
  offset: 0,
  moved: false,
  sequence: 0,
  isCursed: false,
  isVindicate: false,
  isBRC20: false,
};

const makeUtxo = (withInscription = false): UnspentOutput => ({
  txid: 'aabbcc',
  vout: 0,
  satoshi: 10000,
  scriptType: 'P2WPKH',
  scriptPk: '0014aabb',
  codeType: 0,
  address: 'bc1qtest',
  height: 100,
  idx: 0,
  isOpInRBF: false,
  isSpent: false,
  inscriptions: withInscription ? [INSCRIPTION] : [],
});

// ──────────────────────────────────────────────
// sendBTC
// ──────────────────────────────────────────────
describe('sendBTC – inscription guard on btcUtxos', () => {
  it('filters out fee UTXOs containing an inscription instead of throwing', async () => {
    await expect(
      sendBTC({
        ...BASE_PARAMS,
        btcUtxos: [makeUtxo(true)],
        tos: [{ address: 'bc1qdest', satoshis: 5000 }],
      }),
    ).resolves.toBeDefined();
  });

  it('does not throw when all fee UTXOs are inscription-free', async () => {
    await expect(
      sendBTC({
        ...BASE_PARAMS,
        btcUtxos: [makeUtxo(false)],
        tos: [{ address: 'bc1qdest', satoshis: 5000 }],
      }),
    ).resolves.toBeDefined();
  });

  it('filters out the inscribed UTXO in a mixed list instead of throwing', async () => {
    await expect(
      sendBTC({
        ...BASE_PARAMS,
        btcUtxos: [makeUtxo(false), makeUtxo(true)],
        tos: [{ address: 'bc1qdest', satoshis: 5000 }],
      }),
    ).resolves.toBeDefined();
  });
});

// ──────────────────────────────────────────────
// sendInscription
// ──────────────────────────────────────────────
describe('sendInscription – inscription guards', () => {
  const SEND_INS_BASE = {
    ...BASE_PARAMS,
    toAddress: 'bc1qdest',
    outputValue: 546,
  };

  it('filters out fee UTXOs containing an inscription instead of throwing', async () => {
    await expect(
      sendInscription({
        ...SEND_INS_BASE,
        btcUtxos: [makeUtxo(true)],
        assetUtxo: makeUtxo(true),
      }),
    ).resolves.toBeDefined();
  });

  // OS TESTES ABAIXO CONTINUAM EXPLODINDO POIS VALIDAM O ASSET EM SI
  it('throws when assetUtxo has 0 inscriptions', async () => {
    await expect(
      sendInscription({
        ...SEND_INS_BASE,
        btcUtxos: [makeUtxo(false)],
        assetUtxo: makeUtxo(false),
      }),
    ).rejects.toThrow('Unsafe balance');
  });

  it('throws when assetUtxo has more than 1 inscription', async () => {
    const doubleInscribed: UnspentOutput = {
      ...makeUtxo(true),
      inscriptions: [
        { ...INSCRIPTION, inscriptionNumber: 1, inscriptionId: 'abc:0', offset: 0 },
        { ...INSCRIPTION, inscriptionNumber: 2, inscriptionId: 'def:0', offset: 1 },
      ],
    };
    await expect(
      sendInscription({
        ...SEND_INS_BASE,
        btcUtxos: [makeUtxo(false)],
        assetUtxo: doubleInscribed,
      }),
    ).rejects.toThrow('Unsafe balance');
  });

  it('does not throw when fee UTXOs are clean and assetUtxo has exactly 1 inscription', async () => {
    await expect(
      sendInscription({
        ...SEND_INS_BASE,
        btcUtxos: [makeUtxo(false)],
        assetUtxo: makeUtxo(true),
      }),
    ).resolves.toBeDefined();
  });
});

// ──────────────────────────────────────────────
// sendBTC – spendable inscriptions (regression)
// ──────────────────────────────────────────────
describe('sendBTC – user-marked spendable inscription UTXOs', () => {
  // When a user explicitly marks an inscription as spendable via the UI,
  // inscription-response-adapter copies the UnspentOutput including its
  // inscriptions array into utxoInfo. getBTCUtxos then merges those UTXOs
  // into btcUtxos. The guard must NOT block them — the user already accepted
  // the risk.

  it('does not throw when btcUtxo has inscriptions the user marked as spendable', async () => {
    const spendable = {...makeUtxo(true), isUserSpendable: true as const};
    await expect(
      sendBTC({
        ...BASE_PARAMS,
        btcUtxos: [spendable],
        tos: [{ address: 'bc1qdest', satoshis: 5000 }],
      }),
    ).resolves.toBeDefined();
  });

  it('does not throw when fee list mixes clean UTXOs with a user-marked spendable one', async () => {
    const spendable = {...makeUtxo(true), isUserSpendable: true as const};
    await expect(
      sendBTC({
        ...BASE_PARAMS,
        btcUtxos: [makeUtxo(false), spendable],
        tos: [{ address: 'bc1qdest', satoshis: 5000 }],
      }),
    ).resolves.toBeDefined();
  });
});

// ──────────────────────────────────────────────
// sendInscriptions
// ──────────────────────────────────────────────
describe('sendInscriptions – inscription guards', () => {
  const SEND_INSS_BASE = {
    ...BASE_PARAMS,
    toAddress: 'bc1qdest',
  };

  it('throws when an assetUtxo has no inscriptions', async () => {
    await expect(
      sendInscriptions({
        ...SEND_INSS_BASE,
        btcUtxos: [makeUtxo(false)],
        assetUtxos: [makeUtxo(false)],
      }),
    ).rejects.toThrow('Unsafe balance');
  });

  it('filters out fee UTXOs containing an inscription instead of throwing', async () => {
    await expect(
      sendInscriptions({
        ...SEND_INSS_BASE,
        btcUtxos: [makeUtxo(true)],
        assetUtxos: [makeUtxo(true)],
      }),
    ).resolves.toBeDefined();
  });

  it('does not throw when assetUtxos have inscriptions and fee UTXOs are clean', async () => {
    await expect(
      sendInscriptions({
        ...SEND_INSS_BASE,
        btcUtxos: [makeUtxo(false)],
        assetUtxos: [makeUtxo(true)],
      }),
    ).resolves.toBeDefined();
  });
});