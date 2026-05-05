import { describe, it, expect } from '@jest/globals';

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