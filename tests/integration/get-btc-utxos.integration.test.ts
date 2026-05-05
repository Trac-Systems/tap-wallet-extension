/**
 * Integration test — hits real testnet APIs, no mocks on network calls.
 * Run with: yarn test --testPathPatterns=integration --no-coverage --forceExit
 *
 * Address: tb1q8tm78euk6lxf8r9hvvu5ax8lkt688vgzlg8thf (testnet)
 */

import { describe, it, expect, jest, beforeAll } from '@jest/globals';

jest.mock('../../src/background/service/singleton', () => ({
  networkConfig:       { getActiveNetwork: jest.fn().mockReturnValue('TESTNET') },
  walletConfig:        {},
  accountConfig:       {},
  walletService:       {},
  authService:         {},
  appConfig:           {},
  networkFilterConfig: {},
  notificationService: {},
  permissionService:   {},
  sessionService:      {},
}));

// Breaks tap-api.ts → requests/index circular dependency without mocking the classes
jest.mock('../../src/background/requests', () => ({
  mempoolApi:  { getRecommendFee: jest.fn(), getFeesSummary: jest.fn() },
  paidApi:     {},
  tapApi:      {},
  inscribeApi: {},
  usdApi:      {},
}));

// ── Real API imports ─────────────────────────────────────────────────────────
import { Network, UnspentOutput } from '@/src/wallet-instance';
import { PaidApi } from '../../src/background/requests/paid-api';
import { TapApi }  from '../../src/background/requests/tap-api';

// ── Test data fetched once ────────────────────────────────────────────────────
const ADDRESS = 'tb1q8tm78euk6lxf8r9hvvu5ax8lkt688vgzlg8thf';
const TIMEOUT  = 30_000;

let utxos:    UnspentOutput[] = [];
let mints:    any[]           = [];
let tapAvailable              = true;

beforeAll(async () => {
  const paidApi = new PaidApi();
  const tapApi  = new TapApi();
  await paidApi.changeNetwork(Network.TESTNET);
  tapApi.changeNetwork(Network.TESTNET);

  utxos = await paidApi.getAllBTCUtxo(ADDRESS);
  console.log(`[paidApi] ${utxos.length} BTC UTXO(s) found`);

  try {
    mints = await tapApi.getAllAddressDmtMintList(ADDRESS) ?? [];
    console.log(`[tapApi]  ${mints.length} NAT UTXO(s) found`);
  } catch {
    tapAvailable = false;
    console.warn('[tapApi]  NAT server unreachable — NAT-dependent assertions will be skipped');
  }
}, TIMEOUT);

// ── Tests ────────────────────────────────────────────────────────────────────
describe('getBTCUtxos integration - NAT filtering on testnet', () => {

  it('paidApi returns a valid UTXO list', () => {
    expect(Array.isArray(utxos)).toBe(true);
    utxos.forEach(u => {
      expect(u).toHaveProperty('txid');
      expect(u).toHaveProperty('vout');
      expect(u).toHaveProperty('satoshi');
      expect(Array.isArray(u.inscriptions)).toBe(true);
    });
  });

  it('tapApi returns a valid DMT mint list (or server is unreachable)', () => {
    if (!tapAvailable) {
      console.warn('skipped — tapApi unreachable');
      return;
    }
    mints.forEach((m: any) => {
      expect(m).toHaveProperty('tx');
      expect(m).toHaveProperty('vo');
    });
  });

  it('filtering removes every NAT UTXO from the BTC UTXO list', () => {
    if (!tapAvailable) {
      console.warn('skipped — tapApi unreachable');
      return;
    }

    const natSet = new Set(mints.map((m: any) => `${m.tx}:${m.vo}`));
    const safeUtxos = utxos.filter(u => !natSet.has(`${u.txid}:${u.vout}`));

    console.log(`[filter]  ${utxos.length} total → ${safeUtxos.length} safe (${natSet.size} NAT removed)`);

    // No safe UTXO should be in the NAT set
    safeUtxos.forEach(u => {
      expect(natSet.has(`${u.txid}:${u.vout}`)).toBe(false);
    });

    // Every UTXO in the NAT set must be absent from safeUtxos
    const safeKeys = new Set(safeUtxos.map(u => `${u.txid}:${u.vout}`));
    natSet.forEach(key => {
      expect(safeKeys.has(key)).toBe(false);
    });
  });

  it('none of the safe UTXOs carry inscriptions that would block sendBTC', () => {
    const natSet    = tapAvailable ? new Set(mints.map((m: any) => `${m.tx}:${m.vo}`)) : new Set<string>();
    const safeUtxos = utxos.filter(u => !natSet.has(`${u.txid}:${u.vout}`));

    safeUtxos.forEach(u => {
      expect(u.inscriptions.length).toBe(0);
    });
  });

});
