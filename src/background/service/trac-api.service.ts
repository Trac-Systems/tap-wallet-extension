/**
 * TRAC API Service - Handles all trac-crypto-api operations
 */

export interface TracCryptoInstance {
  address: {
    generate: (type: string, mnemonic: string, index: string | null) => Promise<{
      address: string;
      secretKey: string;
    }>;
  };
  transaction: {
    preBuild: (from: string, to: string, amountHex: string, validityHex: string) => Promise<any>;
    build: (txData: any, secret: Buffer) => string;
  };
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
}

export class TracApiService {
  /**
   * Get trac-crypto-api instance from window
   */
  static getTracCryptoInstance(): TracCryptoInstance | null {
    const w = window as any;
    const tracCrypto: TracCryptoInstance = w.TracCryptoApi || w.tracCrypto;
    
    if (!tracCrypto?.transaction?.preBuild) {
      return null;
    }
    
    return tracCrypto;
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
    
    const tracDerivationPath = `m/0'/0'/${accountIndex}'`;
    const generated = await tracCrypto.address.generate('trac', mnemonic, tracDerivationPath);
    
    if (!generated || !generated.secretKey) {
      throw new Error("Failed to generate keypair from mnemonic");
    }
    
    return generated;
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
  static async preBuildTransaction(txData: TracTransactionData): Promise<any> {
    const tracCrypto = this.getTracCryptoInstance();
    if (!tracCrypto) {
      throw new Error("TracCryptoApi not available");
    }
    
    return await tracCrypto.transaction.preBuild(
      txData.from,
      txData.to,
      txData.amountHex,
      txData.validityHex
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
   * Convert amount to hex string using BigInt
   * Amount must be 16 bytes (32 hex characters) with 18 decimal places
   */
  static amountToHex(amount: number): string {
    try {
      // Handle edge cases
      if (!isFinite(amount) || amount < 0) {
        return '00000000000000000000000000000000';
      }
      
      // Handle scientific notation by using toFixed(18) for all numbers
      // This ensures we get the full decimal representation
      let amountStr: string;
      if (amount < 1e-10 || amount.toString().includes('e')) {
        // For very small numbers or scientific notation, use toFixed(18)
        amountStr = amount.toFixed(18);
      } else {
        amountStr = amount.toString();
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
   * Validate TRAC address format
   */
  static isValidTracAddress(addr: string): boolean {
    const a = addr.trim();
    if (!a) return false;
    // Basic TRAC address check: must start with 'trac' and be bech32-like lowercase
    return /^trac[0-9a-z]+$/.test(a);
  }
}
