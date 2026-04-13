import { describe, it, expect, jest } from '@jest/globals';

// MOCK 1: Global Chrome object
(global as any).chrome = {
  storage: {
    local: { 
      get: jest.fn().mockImplementation(() => Promise.resolve({})), 
      set: jest.fn().mockImplementation(() => Promise.resolve()) 
    },
  },
};

// MOCK 2: WebExtension Polyfill
jest.mock('webextension-polyfill', () => {
  const mockEvent = { addListener: jest.fn(), removeListener: jest.fn() };
  return {
    runtime: { onConnect: mockEvent, onMessage: mockEvent, onInstalled: mockEvent, onStartup: mockEvent, getURL: jest.fn(), getPlatformInfo: jest.fn(), connect: jest.fn() },
    storage: { local: { get: jest.fn().mockImplementation(() => Promise.resolve({})), set: jest.fn().mockImplementation(() => Promise.resolve()) } },
    tabs: { onRemoved: mockEvent, create: jest.fn(), query: jest.fn(), sendMessage: jest.fn(), getCurrent: jest.fn() },
    windows: { onFocusChanged: mockEvent, onRemoved: mockEvent, getCurrent: jest.fn(), create: jest.fn(), remove: jest.fn(), WINDOW_ID_NONE: -1 },
    alarms: { onAlarm: mockEvent, create: jest.fn(), clear: jest.fn() }
  };
});

// MOCK 3: Singleton Services
jest.mock('../../src/background/service/singleton', () => ({
  networkConfig: { getActiveNetwork: jest.fn().mockReturnValue('MAINNET') },
  walletConfig: {},
  accountConfig: {},
  walletService: {},
  authService: {},
  appConfig: {},
  networkFilterConfig: {},
  notificationService: {},
  permissionService: {},
  sessionService: {},
}));

// MOCK 4: Bypassing ESM Modules that Jest struggles to parse
jest.mock('@noble/secp256k1', () => ({
  signAsync: jest.fn(),
  verify: jest.fn(),
  Signature: jest.fn()
}));

import * as bitcoin from 'bitcoinjs-lib';
import Provider from '../../src/background/provider'; 

describe('Provider PSBT Extraction Integration', () => {
  it('should successfully extract a full transaction from a PSBT containing an OP_RETURN output', async () => {
    const network = bitcoin.networks.bitcoin;
    const psbt = new bitcoin.Psbt({ network });

    // 1. Add a dummy Input (so the PSBT has a source of funds)
    psbt.addInput({
      hash: '0000000000000000000000000000000000000000000000000000000000000000',
      index: 0,
      witnessUtxo: {
        script: bitcoin.address.toOutputScript('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', network),
        value: 10000, 
      },
    });

    // 2. Add a standard Output (sending funds to a recipient)
    psbt.addOutput({
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      value: 8000, 
    });

    // 3. Add an OP_RETURN Output (The marketplace instruction)
    const opReturnScript = bitcoin.script.compile([
      bitcoin.opcodes.OP_RETURN,
      Buffer.from('marketplace data', 'utf8'),
    ]);

    psbt.addOutput({
      script: opReturnScript,
      value: 0,
    });

    const psbtHex = psbt.toHex();

    // 4. Call the method that powers the approval screen UI
    const extractedData = await Provider.extractTransactionFromPsbtHex(psbtHex, false);

    // 5. Assertions
    expect(extractedData.outputs).toHaveLength(2); 
    
    expect(extractedData.outputs[0].address).toBe('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    expect(extractedData.outputs[0].value).toBe(8000);
    
    expect(extractedData.outputs[1].address).toBe('OP_RETURN');
    expect(extractedData.outputs[1].value).toBe(0);

    expect(extractedData.fee).toBe(2000);
  });
});