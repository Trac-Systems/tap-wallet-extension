import { describe, it, expect, jest } from '@jest/globals';

// MOCK 1: Create global 'chrome' object to prevent Node.js ReferenceError
(global as any).chrome = {
  storage: {
    local: { 
      get: jest.fn().mockImplementation(() => Promise.resolve({})), 
      set: jest.fn().mockImplementation(() => Promise.resolve()) 
    },
  },
};

// MOCK 2: Complete structure to mock a real extension environment
jest.mock('webextension-polyfill', () => {
  const mockEvent = { addListener: jest.fn(), removeListener: jest.fn() };
  
  return {
    runtime: {
      onConnect: mockEvent,
      onMessage: mockEvent,
      onInstalled: mockEvent,
      onStartup: mockEvent,
      getURL: jest.fn(),
      getPlatformInfo: jest.fn(),
      connect: jest.fn(),
    },
    storage: {
      local: { 
        // Mocking a Promise return safely for TypeScript
        get: jest.fn().mockImplementation(() => Promise.resolve({})), 
        set: jest.fn().mockImplementation(() => Promise.resolve()) 
      },
    },
    tabs: {
      onRemoved: mockEvent,
      create: jest.fn(),
      query: jest.fn(),
      sendMessage: jest.fn(),
      getCurrent: jest.fn(),
    },
    windows: {
      onFocusChanged: mockEvent,
      onRemoved: mockEvent,
      getCurrent: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
      WINDOW_ID_NONE: -1,
    },
    alarms: {
      onAlarm: mockEvent,
      create: jest.fn(),
      clear: jest.fn(),
    }
  };
});

import * as bitcoin from 'bitcoinjs-lib';
import { extractAddressFromScript } from '../../../src/background/utils'; 

describe('extractAddressFromScript', () => {
  const network = bitcoin.networks.bitcoin;

  it('should correctly extract the address from a standard script (e.g., P2WPKH)', () => {
    const fakePubKey = Buffer.from(
      '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 
      'hex'
    );
    const { address, output } = bitcoin.payments.p2wpkh({
      pubkey: fakePubKey,
      network,
    });

    const result = extractAddressFromScript({
      script: output!,
      network,
    });

    expect(result).toBe(address);
  });

  it('should return "OP_RETURN" and NOT throw an error when receiving a script with metadata', () => {
    const metadata = Buffer.from('marketplace data', 'utf8');
    const opReturnScript = bitcoin.script.compile([
      bitcoin.opcodes.OP_RETURN,
      metadata,
    ]);

    const result = extractAddressFromScript({
      script: opReturnScript,
      network,
    });

    expect(result).toBe('OP_RETURN');
  });
});