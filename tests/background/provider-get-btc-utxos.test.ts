import { describe, it, expect, jest, beforeEach } from '@jest/globals';

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

import { Provider } from '../../src/background/provider';

const makeUtxo = (txid: string, vout: number) => ({
  txid, vout, satoshi: 10000,
  scriptType: 'P2WPKH', scriptPk: '0014aa', codeType: 0,
  address: 'bc1qtest', height: 100, idx: 0,
  isOpInRBF: false, isSpent: false, inscriptions: [] as any[],
});

const ADDRESS = 'bc1qtest';

describe('Provider.getBTCUtxos – NAT UTXO filtering', () => {
  let provider: any;

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
    provider.tapApi  = { getAllAddressDmtMintList: jest.fn().mockImplementation(() => Promise.resolve(['bbbbi1'])) };

    const result = await provider.getBTCUtxos(ADDRESS);

    expect(result).toHaveLength(1);
    expect(result[0].txid).toBe('aaaa');
  });

  it('returns all UTXOs when none match the DMT mint list', async () => {
    const utxos = [makeUtxo('aaaa', 0), makeUtxo('cccc', 2)];

    provider.paidApi = { getAllBTCUtxo: jest.fn().mockImplementation(() => Promise.resolve(utxos)) };
    // CORRIGIDO AQUI
    provider.tapApi  = { getAllAddressDmtMintList: jest.fn().mockImplementation(() => Promise.resolve([])) };

    const result = await provider.getBTCUtxos(ADDRESS);

    expect(result).toHaveLength(2);
  });

  it('throws when tapApi fails — never returns a potentially unsafe UTXO set', async () => {
    const utxos = [makeUtxo('aaaa', 0), makeUtxo('bbbb', 1)];

    provider.paidApi = { getAllBTCUtxo: jest.fn().mockImplementation(() => Promise.resolve(utxos)) };
    provider.tapApi  = { getAllAddressDmtMintList: jest.fn().mockImplementation(() => Promise.reject(new Error('network error'))) };

    await expect(provider.getBTCUtxos(ADDRESS)).rejects.toThrow(
      'Unable to verify NAT UTXOs — cannot guarantee safe coin selection',
    );
  });

  it('still merges spendable inscription UTXOs after NAT filtering', async () => {
    const normalUtxo      = makeUtxo('aaaa', 0);
    const natUtxo         = makeUtxo('bbbb', 1);
    const inscriptionUtxo = makeUtxo('cccc', 2);

    provider.paidApi = { getAllBTCUtxo: jest.fn().mockImplementation(() => Promise.resolve([normalUtxo, natUtxo])) };
    // CORRIGIDO AQUI
    provider.tapApi  = { getAllAddressDmtMintList: jest.fn().mockImplementation(() => Promise.resolve(['bbbbi1'])) };
    provider.getAccountSpendableInscriptions = jest.fn().mockImplementation(() =>
      Promise.resolve([{ inscriptionId: 'ins1:0', utxoInfo: { ...inscriptionUtxo, satoshi: 546 } }]),
    );

    const result = await provider.getBTCUtxos(ADDRESS);

    expect(result).toHaveLength(2);
    expect(result.map((u: any) => u.txid)).toEqual(['aaaa', 'cccc']);
  });

  it('returns spendable inscription UTXOs with their inscriptions array intact (realistic utxoInfo)', async () => {
    const normalUtxo = makeUtxo('aaaa', 0);
    const spendableUtxoInfo = {
      ...makeUtxo('cccc', 2),
      inscriptions: [{ inscriptionNumber: 1, inscriptionId: 'ins1:0', offset: 0,
        moved: false, sequence: 0, isCursed: false, isVindicate: false, isBRC20: false }],
    };

    provider.paidApi = { getAllBTCUtxo: jest.fn().mockImplementation(() => Promise.resolve([normalUtxo])) };
    provider.tapApi  = { getAllAddressDmtMintList: jest.fn().mockImplementation(() => Promise.resolve([])) };
    provider.getAccountSpendableInscriptions = jest.fn().mockImplementation(() =>
      Promise.resolve([{ inscriptionId: 'ins1:0', utxoInfo: spendableUtxoInfo }]),
    );

    const result = await provider.getBTCUtxos(ADDRESS);

    expect(result).toHaveLength(2);
    const spendable = result.find((u: any) => u.txid === 'cccc');
    expect(spendable).toBeDefined();
    expect(spendable.inscriptions).toHaveLength(1);
    expect(spendable.isUserSpendable).toBe(true);
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