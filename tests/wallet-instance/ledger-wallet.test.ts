import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as bitcoin from 'bitcoinjs-lib';

// 1. Create mock functions that we can monitor and manipulate
const mockGetWalletPublicKey = jest.fn();
const mockSignTransaction = jest.fn();

// 2. MOCK: Intercept the real Ledger service to inject our "virtual device"
jest.mock('../../src/background/service/ledger.service', () => ({
  getLedgerService: () => ({
    getStatus: jest.fn().mockImplementation(() => Promise.resolve({ connected: true })),
    connect: jest.fn().mockImplementation(() => Promise.resolve({ name: 'Bitcoin', version: '2.1.0' })),
    getWalletPublicKey: mockGetWalletPublicKey,
    signTransaction: mockSignTransaction,
  })
}));

// MOCK: Global Chrome object (so storage doesn't complain)
(global as any).chrome = { 
  storage: { 
    local: { 
      get: jest.fn().mockImplementation(() => Promise.resolve({})), 
      set: jest.fn().mockImplementation(() => Promise.resolve()) 
    } 
  } 
};

// Import the real LedgerWallet class after the mocks
import { LedgerWallet } from '../../src/wallet-instance/keychain/ledger-wallet';

describe('LedgerWallet Integration', () => {
  let ledgerWallet: LedgerWallet;

  beforeEach(() => {
    // Clear mock history before each test
    jest.clearAllMocks();
    
    // Instantiate a Ledger wallet on Mainnet pointing to Native Segwit
    ledgerWallet = new LedgerWallet({ derivationPath: "m/84'/0'/0'/0" });
  });

  it('should request the public key from Ledger when adding a new account', async () => {
    // Simulate the Ledger response containing a fake public key
    const fakePubKeyHex = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
    mockGetWalletPublicKey.mockImplementation(() => Promise.resolve({
      publicKeyHex: fakePubKeyHex,
      bitcoinAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
    }));

    // When the user clicks "Add Account", the wallet calls this function
    // Since the wallet searches for multiple address types (P2PKH, P2TR, etc) in parallel, it will make multiple calls
    await ledgerWallet.addNewAccounts(1);

    // Verify if the Ledger method was triggered to talk to the USB (mocked)
    expect(mockGetWalletPublicKey).toHaveBeenCalled();
    
    // Verify if the returned public key was saved in the LedgerWallet's internal cache
    const cachedKeys = ledgerWallet.retrievePublicKeys();
    expect(cachedKeys).toContain(fakePubKeyHex);
  });

  it('should send the correct instructions to Ledger to sign a PSBT', async () => {
    const network = bitcoin.networks.bitcoin;
    const psbt = new bitcoin.Psbt({ network });
    psbt.addInput({
      hash: '0000000000000000000000000000000000000000000000000000000000000000',
      index: 0,
      witnessUtxo: {
        script: Buffer.from('0014751e76e8199196d454941c45d1b3a323f1433bd6', 'hex'),
        value: 10000,
      },
    });

    // Populate the cache simulating that the user already had the account activated
    const fakePubKeyHex = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
    
    // We need to populate the exact cache structures used by the LedgerWallet class
    const rootMap = new Map<number, string>();
    rootMap.set(0, fakePubKeyHex);
    // Using 'any' because rootToIndexToPubkey is private
    (ledgerWallet as any).rootToIndexToPubkey.set("m/84'/0'/0'/0", rootMap);
    (ledgerWallet as any).activeIndexes = [0];

    // Simulate the Ledger returning a signed PSBT (in hex)
    const fakeSignedPsbtHex = psbt.toHex(); 
    mockSignTransaction.mockImplementation(() => Promise.resolve(fakeSignedPsbtHex));

    // The input we need to sign, pointing to the public key we simulated
    const inputsToSign = [{
      index: 0,
      publicKey: fakePubKeyHex,
    }];

    // Execute the signature
    const signedPsbt = await ledgerWallet.signTransaction(psbt, inputsToSign);

    // Assertions
    // 1. Ensure the PSBT was returned
    expect(signedPsbt).toBeDefined();
    
    // 2. The ultimate proof: Verify if the Ledger service was called with the PSBT and the correct derivation path!
    expect(mockSignTransaction).toHaveBeenCalledWith(
      expect.any(bitcoin.Psbt), 
      ["m/84'/0'/0'/0/0"] // The exact path of the first account
    );
  });
});