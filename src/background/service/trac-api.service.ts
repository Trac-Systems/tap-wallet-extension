/**
 * TRAC API Service - Handles all trac-crypto-api operations
 */

import TracCrypto from 'trac-crypto-api';
import * as Blake3Module from '@tracsystems/blake3';

type Blake3Fn = (data: string | Buffer | Uint8Array) => Promise<Uint8Array>;
const blake3Raw = (Blake3Module as any).blake3 as Blake3Fn;

export interface TracCryptoInstance {
  address: {
    generate: (type: string, mnemonic: string, index: string | null) => Promise<{
      address: string;
      secretKey: string;
      publicKey: string;
    }>;
  };
  transaction: {
    preBuild: (from: string, to: string, amountHex: string, validityHex: string, networkId?: number) => Promise<any>;
    build: (txData: any, secret: Buffer) => string;
    decode?: (payload: string) => any;
  };

  MAINNET_ID: number;
  TESTNET_ID: number;
}

export interface TracTransactionData {
  from: string;
  to: string;
  amountHex: string;
  validityHex: string;
}

export interface GeneratedKeypair {
  address: string;
  secretKey: string;
  publicKey: string;
}

export class TracApiService {
  /**
   * Get trac-crypto-api instance
   */
  static getTracCryptoInstance(): TracCryptoInstance | null {
    if (!TracCrypto?.transaction?.preBuild) {
      return null;
    }

    return TracCrypto as TracCryptoInstance;
  }

  /**
   * Generate keypair from mnemonic with derivation path
   */
  static async generateKeypairFromMnemonic(
    mnemonic: string,
    accountIndex: number
  ): Promise<GeneratedKeypair> {
    const tracCrypto = this.getTracCryptoInstance();
    if (!tracCrypto) {
      throw new Error("TracCryptoApi not available");
    }

    const tracDerivationPath = `m/918'/0'/0'/${accountIndex}'`;
    const generated = await tracCrypto.address.generate('trac', mnemonic, tracDerivationPath);

    if (!generated || !generated.secretKey) {
      throw new Error("Failed to generate keypair from mnemonic");
    }

    // Get publicKey - either from generated or decode from address
    let publicKey = generated.publicKey;
    
    if (!publicKey && generated.address) {
      // Fallback: decode address to get publicKey
      try {
        const tracCryptoAny = TracCrypto as any;
        if (tracCryptoAny?.address?.decode) {
          publicKey = tracCryptoAny.address.decode(generated.address);
        }
      } catch (error) {
        console.error('[TracApiService] Failed to decode publicKey:', error);
      }
    }

    return {
      address: generated.address,
      secretKey: generated.secretKey,
      publicKey: publicKey || ''
    };
  }

  /**
   * Sign message using Ed25519
   */
  static async signMessage(message: string, secretKey: Buffer | Uint8Array | string): Promise<string> {
    const tracCrypto = TracCrypto as any;
    if (!tracCrypto?.sign) {
      throw new Error("TracCryptoApi.sign not available");
    }

    // Convert message to Buffer
    const msgBuffer = Buffer.from(message, 'utf8');
    
    // Convert secretKey to Buffer if needed
    const secretBuffer = this.toSecretBuffer(secretKey);
    
    // Sign using Ed25519
    const signature = tracCrypto.sign(msgBuffer, secretBuffer);
    
    // Return as hex string
    return Buffer.from(signature).toString('hex');
  }

  /**
   * Verify message signature
   */
  static async verifyMessage(
    signature: string,
    message: string,
    publicKey: Buffer | Uint8Array | string
  ): Promise<boolean> {
    const tracCrypto = TracCrypto as any;
    if (!tracCrypto?.signature?.verify) {
      throw new Error("TracCryptoApi.signature.verify not available");
    }

    try {
      const sigBuffer = Buffer.from(signature, 'hex');
      const msgBuffer = Buffer.from(message, 'utf8');
      const pubBuffer = typeof publicKey === 'string' 
        ? Buffer.from(publicKey, 'hex') 
        : Buffer.from(publicKey);

      return tracCrypto.signature.verify(sigBuffer, msgBuffer, pubBuffer);
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  /**
   * Derive address from secret key bytes
   */
  static async addressFromSecretKey(secretBytes: Uint8Array | Buffer): Promise<{address: string}> {
    const tracCrypto = TracCrypto as any;
    if (!tracCrypto?.address?.fromSecretKey) {
      throw new Error("TracCryptoApi.address.fromSecretKey not available");
    }
    
    const result = await tracCrypto.address.fromSecretKey('trac', secretBytes);
    if (!result?.address) {
      throw new Error("Failed to derive address from secret key");
    }
    
    return result;
  }


  /**
   * Convert secret key to buffer
   */
  static toSecretBuffer(secret: any) {
    if (!secret) return secret;
    if (typeof secret === 'string') {
      return Buffer.from(secret.replace(/^0x/, ''), 'hex');
    }
    return secret;
  }

  /**
   * Pre-build transaction
   */
  static async preBuildTransaction(txData: TracTransactionData, networkId?: number): Promise<any> {
    const tracCrypto = this.getTracCryptoInstance();
    if (!tracCrypto) {
      throw new Error("TracCryptoApi not available");
    }

    const chainId = networkId || 918; // MAINNET_ID
    return await tracCrypto.transaction.preBuild(
      txData.from,
      txData.to,
      txData.amountHex,
      txData.validityHex,
      chainId
    );
  }

  /**
   * Build transaction with signature
   */
  static buildTransaction(txData: any, secret: Buffer): string {
    const tracCrypto = this.getTracCryptoInstance();
    if (!tracCrypto) {
      throw new Error("TracCryptoApi not available");
    }

    return tracCrypto.transaction.build(txData, secret);
  }

  /**
   * Decode payload to extract transaction hash
   */
  static decodePayload(payload: string): string | null {
    try {
      // Try to decode as base64 first using browser's atob
      try {
        const decoded = atob(payload);
        const parsed = JSON.parse(decoded);
        return parsed?.tro?.tx || null;
      } catch {
        // If not base64 JSON, try direct JSON parse
        try {
          const parsed = JSON.parse(payload);
          return parsed?.tro?.tx || null;
        } catch {
          return null;
        }
      }
    } catch (error) {
      console.error('Error decoding payload:', error);
      return null;
    }
  }

  /**
   * Convert amount to hex string using BigInt
   * Amount must be 16 bytes (32 hex characters) with 18 decimal places
   * Now accepts string to preserve precision
   */
  static amountToHex(amount: string | number): string {
    try {
      // Convert to string first to preserve precision
      let amountStr: string;
      if (typeof amount === 'string') {
        amountStr = amount;
      } else {
        // Handle edge cases for number input
        if (!isFinite(amount) || amount < 0) {
          return '00000000000000000000000000000000';
        }

        // Handle scientific notation by using toFixed(18) for all numbers
        if (amount < 1e-10 || amount.toString().includes('e')) {
          amountStr = amount.toFixed(18);
        } else {
          amountStr = amount.toString();
        }
      }

      // Validate string format (should be a valid decimal number)
      if (!/^\d*\.?\d+$/.test(amountStr)) {
        console.error('Invalid amount string format:', amountStr);
        return '00000000000000000000000000000000';
      }

      const [integerPart, decimalPart = ''] = amountStr.split('.');
      const integerBigInt = BigInt(integerPart || '0');
      const multiplier = BigInt('1000000000000000000'); // 10^18

      let decimalBigInt = BigInt('0');
      if (decimalPart) {
        const paddedDecimal = decimalPart.padEnd(18, '0').slice(0, 18);
        decimalBigInt = BigInt(paddedDecimal);
      }

      const amountInSmallestUnit = integerBigInt * multiplier + decimalBigInt;
      return amountInSmallestUnit.toString(16).padStart(32, '0'); // 16 bytes = 32 hex chars
    } catch (error) {
      console.error('Error converting amount to hex:', error);
      return '00000000000000000000000000000000';
    }
  }

  /**
   * Convert balance from smallest unit (18 decimals) to display format using BigInt
   */
  static balanceToDisplay(balance: string): string {
    if (!balance || balance === '0') return '0';

    try {
      const balanceBigInt = BigInt(balance);
      const divisor = BigInt('1000000000000000000'); // 10^18
      const quotient = balanceBigInt / divisor;
      const remainder = balanceBigInt % divisor;

      // Convert remainder to decimal part
      const decimalPart = remainder.toString().padStart(18, '0');
      const trimmedDecimal = decimalPart.replace(/0+$/, '');

      if (trimmedDecimal === '') {
        return quotient.toString();
      }

      return `${quotient.toString()}.${trimmedDecimal}`;
    } catch (error) {
      console.error('Error converting balance:', error);
      return '0';
    }
  }

  /**
   * Convert display amount to smallest unit (18 decimals) using BigInt
   */
  static displayToBalance(displayAmount: string): string {
    try {
      const [integerPart, decimalPart = ''] = displayAmount.split('.');
      const integerBigInt = BigInt(integerPart || '0');
      const multiplier = BigInt('1000000000000000000'); // 10^18

      let decimalBigInt = BigInt('0');
      if (decimalPart) {
        const paddedDecimal = decimalPart.padEnd(18, '0').slice(0, 18);
        decimalBigInt = BigInt(paddedDecimal);
      }

      return (integerBigInt * multiplier + decimalBigInt).toString();
    } catch (error) {
      console.error('Error converting display amount:', error);
      return '0';
    }
  }

  /**
   * Validate TRAC address format with improved checks
   */
  static isValidTracAddress(addr: string): boolean {
    const a = addr.trim();
    if (!a) return false;

    // Basic format check: must start with 'trac' and be lowercase alphanumeric
    if (!/^trac[0-9a-z]+$/.test(a)) return false;

    // Check if it's a valid bech32m format
    // TRAC addresses use bech32m encoding with variable HRP length
    const separatorIndex = a.indexOf('1');
    if (separatorIndex === -1) return false;

    const prefix = a.slice(0, separatorIndex);
    const suffix = a.slice(separatorIndex + 1);

    // HRP must be 'trac' (4 characters)
    if (prefix !== 'trac') return false;

    // Suffix must be valid bech32 characters and have correct length
    const bech32Chars = /^[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$/;
    if (!bech32Chars.test(suffix)) return false;

    // Suffix length should be: Math.ceil((32 * 8) / 5) + 6 = 58 characters
    const expectedSuffixLength = Math.ceil((32 * 8) / 5) + 6; // 58
    if (suffix.length !== expectedSuffixLength) return false;

    return true;
  }

  /**
   * Validate TRAC address with detailed error messages
   */
  static validateTracAddress(addr: string): { valid: boolean; error?: string } {
    const a = addr.trim();

    if (!a) return { valid: false, error: 'Address cannot be empty' };

    if (!/^trac[0-9a-z]+$/.test(a)) {
      return { valid: false, error: 'Invalid TRAC address format. Must start with "trac" and contain only lowercase letters and numbers' };
    }

    // Check bech32m format
    const separatorIndex = a.indexOf('1');
    if (separatorIndex === -1) {
      return { valid: false, error: 'Invalid TRAC address format. Must contain separator "1"' };
    }

    const prefix = a.slice(0, separatorIndex);
    const suffix = a.slice(separatorIndex + 1);

    if (prefix !== 'trac') {
      return { valid: false, error: 'Invalid TRAC address prefix. Must start with "trac"' };
    }

    const bech32Chars = /^[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$/;
    if (!bech32Chars.test(suffix)) {
      return { valid: false, error: 'Invalid TRAC address suffix. Contains invalid bech32 characters' };
    }

    const expectedSuffixLength = Math.ceil((32 * 8) / 5) + 6; // 58
    if (suffix.length !== expectedSuffixLength) {
      return { valid: false, error: `Invalid TRAC address length. Suffix must be ${expectedSuffixLength} characters, got ${suffix.length}` };
    }

    return { valid: true };
  }

  static async blake3Hash(data: Buffer | Uint8Array): Promise<Buffer> {
    const tracCrypto = TracCrypto as any;
    if (!tracCrypto?.hash?.blake3) {
      throw new Error("TracCryptoApi.hash.blake3 not available");
    }

    const hash = await tracCrypto.hash.blake3(data);
    return Buffer.from(hash);
  }

  static async blake3HashFromString(str: string): Promise<Buffer> {
    if (!blake3Raw) {
      throw new Error("Raw blake3 function not available");
    }

    const hash = await blake3Raw(str);
    return Buffer.from(hash);
  }

  static serialize(...args: (Buffer | Uint8Array | number)[]): Buffer {
    const tracCrypto = TracCrypto as any;
    if (!tracCrypto?.utils?.serialize) {
      throw new Error("TracCryptoApi.utils.serialize not available");
    }

    const convertedArgs = args.map(arg => {
      if (arg instanceof Uint8Array && !(arg instanceof Buffer)) {
        return Buffer.from(arg);
      }
      return arg;
    });

    return Buffer.from(tracCrypto.utils.serialize(...convertedArgs));
  }

  static signHash(hash: Buffer | Uint8Array, secretKey: Buffer | Uint8Array): Buffer {
    const tracCrypto = TracCrypto as any;
    if (!tracCrypto?.signature?.sign) {
      throw new Error("TracCryptoApi.signature.sign not available");
    }

    const hashBuffer = Buffer.from(hash);
    const secretBuffer = Buffer.from(secretKey);
    const signature = tracCrypto.signature.sign(hashBuffer, secretBuffer);

    return Buffer.from(signature);
  }
}
