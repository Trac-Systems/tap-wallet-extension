import { jest } from '@jest/globals';

// Node.js doesn't have browser extension APIs — shim them globally.
(global as any).chrome = {
  storage: {
    local: {
      get: jest.fn().mockImplementation(() => Promise.resolve({})),
      set: jest.fn().mockImplementation(() => Promise.resolve()),
    },
  },
};

jest.mock('webextension-polyfill', () => {
  const ev = { addListener: jest.fn(), removeListener: jest.fn() };
  return {
    runtime: { onConnect: ev, onMessage: ev, onInstalled: ev, onStartup: ev, getURL: jest.fn(), getPlatformInfo: jest.fn(), connect: jest.fn() },
    storage: { local: { get: jest.fn().mockImplementation(() => Promise.resolve({})), set: jest.fn().mockImplementation(() => Promise.resolve()) } },
    tabs:    { onRemoved: ev, create: jest.fn(), query: jest.fn(), sendMessage: jest.fn(), getCurrent: jest.fn() },
    windows: { onFocusChanged: ev, onRemoved: ev, getCurrent: jest.fn(), create: jest.fn(), remove: jest.fn(), WINDOW_ID_NONE: -1 },
    alarms:  { onAlarm: ev, create: jest.fn(), clear: jest.fn() },
  };
});

// Pure ESM module — Jest (CommonJS transform) cannot parse it without a mock.
jest.mock('@noble/secp256k1', () => ({ signAsync: jest.fn(), verify: jest.fn(), Signature: jest.fn() }));
