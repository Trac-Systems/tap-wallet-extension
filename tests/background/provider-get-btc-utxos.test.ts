import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ── Environment shims ────────────────────────────────────────────────────────
(global as any).chrome = {
  storage: { local: { get: jest.fn(), set: jest.fn() } },
};

jest.mock('webextension-polyfill', () => {
  const ev = { addListener: jest.fn(), removeListener: jest.fn() };
  return {
    runtime:  { onConnect: ev, onMessage: ev, onInstalled: ev, onStartup: ev, getURL: jest.fn(), getPlatformInfo: jest.fn(), connect: jest.fn() },
    storage:  { local: { get: jest.fn().mockImplementation(() => Promise.resolve({})), set: jest.fn().mockImplementation(() => Promise.resolve()) } },
    tabs:     { onRemoved: ev, create: jest.fn(), query: jest.fn(), sendMessage: jest.fn(), getCurrent: jest.fn() },
    windows:  { onFocusChanged: ev, onRemoved: ev, getCurrent: jest.fn(), create: jest.fn(), remove: jest.fn(), WINDOW_ID_NONE: -1 },
    alarms:   { onAlarm: ev, create: jest.fn(), clear: jest.fn() },
  };
});

jest.mock('@noble/secp256k1', () => ({ signAsync: jest.fn(), verify: jest.fn(), Signature: jest.fn() }));

jest.mock('../../src/background/service/singleton', () => ({
  networkConfig:       { getActiveNetwork: jest.fn().mockReturnValue('mainnet') },
  walletConfig:        {},
  accountConfig:       { getActiveAccount: jest.fn(), getAccountSpendableInscriptions: jest.fn() },
  walletService:       {},
  authService:         {},
  appConfig:           {},
  networkFilterConfig: {},
  notificationService: {},
  permissionService:   {},
  sessionService:      {},
}));

jest.mock('../../src/background/requests', () => ({
  paidApi:     { getAllBTCUtxo: jest.fn(), changeNetwork: jest.fn() },
  tapApi:      { getAllAddressDmtMintList: jest.fn(), changeNetwork: jest.fn() },
  mempoolApi:  {},
  inscribeApi: {},
  usdApi:      {},
}));

jest.mock('../../src/background/service/ledger.service', () => ({
  getLedgerService: jest.fn().mockReturnValue({}),
}));

// ── Imports after mocks ──────────────────────────────────────────────────────
import { Provider } from '../../src/background/provider';

// ── Helpers ──────────────────────────────────────────────────────────────────
const makeUtxo = (txid: string, vout: number) => ({
  txid, vout, satoshi: 10000,
  scriptType: 'P2WPKH', scriptPk: '0014aa', codeType: 0,
  address: 'bc1qtest', height: 100, idx: 0,
  isOpInRBF: false, isSpent: false, inscriptions: [] as any[],
});

const ADDRESS = 'bc1qtest';

// Casts the provider to `any` so we can override instance methods with jest mocks
// without fighting the strict method signatures in tests.
type AnyProvider = any;

describe('Provider.getBTCUtxos – NAT UTXO filtering', () => {
  let provider: AnyProvider;

  beforeEach(() => {
    provider = new Provider();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    provider.getActiveAccount = jest.fn().mockReturnValue({ address: ADDRESS });
    provider.getAccountSpendableInscriptions = jest.fn().mockImplementation(() => Promise.resolve([]));
  });

  it('filters out UTXOs that appear in the DMT mint list', async () => {
    const normalUtxo = makeUtxo('aaaa', 0);
    const natUtxo    = makeUtxo('bbbb', 1);

    provider.paidApi = { getAllBTCUtxo: jest.fn().mockImplementation(() => Promise.resolve([normalUtxo, natUtxo])) };
    provider.tapApi  = { getAllAddressDmtMintList: jest.fn().mockImplementation(() => Promise.resolve([{ tx: 'bbbb', vo: 1 }])) };

    const result = await provider.getBTCUtxos(ADDRESS);

    expect(result).toHaveLength(1);
    expect(result[0].txid).toBe('aaaa');
  });

  it('returns all UTXOs when none match the DMT mint list', async () => {
    const utxos = [makeUtxo('aaaa', 0), makeUtxo('cccc', 2)];

    provider.paidApi = { getAllBTCUtxo: jest.fn().mockImplementation(() => Promise.resolve(utxos)) };
    provider.tapApi  = { getAllAddressDmtMintList: jest.fn().mockImplementation(() => Promise.resolve([{ tx: 'bbbb', vo: 1 }])) };

    const result = await provider.getBTCUtxos(ADDRESS);

    expect(result).toHaveLength(2);
  });

  it('falls back to unfiltered UTXOs when tapApi throws', async () => {
    const utxos = [makeUtxo('aaaa', 0), makeUtxo('bbbb', 1)];

    provider.paidApi = { getAllBTCUtxo: jest.fn().mockImplementation(() => Promise.resolve(utxos)) };
    provider.tapApi  = { getAllAddressDmtMintList: jest.fn().mockImplementation(() => Promise.reject(new Error('network error'))) };

    const result = await provider.getBTCUtxos(ADDRESS);

    expect(result).toHaveLength(2);
    expect(console.error).toHaveBeenCalled();
  });

  it('still merges spendable inscription UTXOs after NAT filtering', async () => {
    const normalUtxo      = makeUtxo('aaaa', 0);
    const natUtxo         = makeUtxo('bbbb', 1);
    const inscriptionUtxo = makeUtxo('cccc', 2);

    provider.paidApi = { getAllBTCUtxo: jest.fn().mockImplementation(() => Promise.resolve([normalUtxo, natUtxo])) };
    provider.tapApi  = { getAllAddressDmtMintList: jest.fn().mockImplementation(() => Promise.resolve([{ tx: 'bbbb', vo: 1 }])) };
    provider.getAccountSpendableInscriptions = jest.fn().mockImplementation(() =>
      Promise.resolve([{ inscriptionId: 'ins1:0', utxoInfo: { ...inscriptionUtxo, satoshi: 546 } }]),
    );

    const result = await provider.getBTCUtxos(ADDRESS);

    // normalUtxo (kept) + inscriptionUtxo (spendable) = 2; natUtxo removed
    expect(result).toHaveLength(2);
    expect(result.map((u: AnyProvider) => u.txid)).toEqual(['aaaa', 'cccc']);
  });

  it('excludes spendable inscriptions listed in ignoreAsset', async () => {
    const normalUtxo      = makeUtxo('aaaa', 0);
    const inscriptionUtxo = makeUtxo('cccc', 2);

    provider.paidApi = { getAllBTCUtxo: jest.fn().mockImplementation(() => Promise.resolve([normalUtxo])) };
    provider.tapApi  = { getAllAddressDmtMintList: jest.fn().mockImplementation(() => Promise.resolve([])) };
    provider.getAccountSpendableInscriptions = jest.fn().mockImplementation(() =>
      Promise.resolve([{ inscriptionId: 'ins1:0', utxoInfo: { ...inscriptionUtxo, satoshi: 546 } }]),
    );

    const result = await provider.getBTCUtxos(ADDRESS, ['ins1:0']);

    expect(result).toHaveLength(1);
    expect(result[0].txid).toBe('aaaa');
  });
});
