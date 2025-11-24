import {bitcoin, ECPair} from '@/src/background/utils/bitcoin-core';
import {getLedgerService} from '@/src/background/service/ledger.service';
import {isEmpty} from 'lodash';
import {Buffer} from 'buffer';

const WALLET_TYPE = 'Hardware Wallet';
export class LedgerWallet {
  static type = WALLET_TYPE;
  type = WALLET_TYPE;
  network: bitcoin.Network = bitcoin.networks.bitcoin;
  derivationRoot: string = '';
  activeIndexes: number[] = [];
  indexToPubkeyHex: Map<number, string> = new Map();

  constructor(options?: any) {
    if (options?.derivationPath) {
      this.derivationRoot = options.derivationPath;
    }
  }

  changeDerivationPath(newPath: string) {
    if (!newPath) {
      return;
    }
    this.derivationRoot = newPath;
    // Keep cache; caller should re-activate if needed
  }

  async initializeWallet(options: {derivationPath?: string; activeIndexes?: number[]}) {
    const {derivationPath, activeIndexes = []} = options || {};
    if (derivationPath) {
      this.derivationRoot = derivationPath;
    }
    if (!this.derivationRoot) {
      throw new Error('Derivation path is required for hardware wallets');
    }
    if (activeIndexes.length) {
      await this.activateAccounts(activeIndexes);
    }
  }

  async initializeRoot(opts: any): Promise<void> {
    await this.initializeWallet(opts || {});
  }

  serialize(): any {
    return {
      derivationPath: this.derivationRoot,
      activeIndexes: this.activeIndexes,
    };
  }

  private _pathForIndex(index: number, derivationRoot?: string): string {
    const root = derivationRoot || this.derivationRoot;
    if (!root) {
      throw new Error('Derivation path is not initialized');
    }
    return `${root}/${index}`;
  }

  /**
   * Get Ledger format based on derivation path
   * Determines the correct format (legacy, p2sh, bech32, bech32m) from the path
   */
  private _getFormatFromPath(path: string): string {
    // Remove 'm/' prefix if present
    const normalizedPath = path.replace(/^m\//, '');
    const segments = normalizedPath.split('/');
    const purposeSegment = segments[0] || '';
    const purpose = parseInt(purposeSegment.replace(/'/g, ''), 10);
    
    if (purpose === 44) {
      return 'legacy'; // P2PKH
    } else if (purpose === 49) {
      return 'p2sh'; // P2SH-P2WPKH
    } else if (purpose === 86) {
      return 'bech32m'; // P2TR (Taproot)
    } else if (purpose === 84) {
      return 'bech32'; // P2WPKH (Native Segwit)
    }
    // Default to bech32 for unknown purposes
    return 'bech32';
  }

  private async _fetchPubkey(path: string, index: number, cacheRoot: string): Promise<string> {
    const ledger = getLedgerService();
    try {
      const status = await ledger.getStatus?.();
      if (!status?.connected) {
        await ledger.connect?.('auto' as any);
      }
    } catch {}
    try {
      // Determine format from derivation path
      const format = this._getFormatFromPath(cacheRoot);
      const {publicKeyHex} = await ledger.getWalletPublicKey(path, {
        verify: false,
        format: format as any,
      });
      const pubkeyHex = publicKeyHex || '';
      const rootMap = this.rootToIndexToPubkey.get(cacheRoot) || new Map();
      rootMap.set(index, pubkeyHex);
      this.rootToIndexToPubkey.set(cacheRoot, rootMap);
      if (cacheRoot === this.derivationRoot) {
        this.indexToPubkeyHex.set(index, pubkeyHex);
      }
      return pubkeyHex;
    } catch (e: any) {
      const msg: string = e?.message || '';
      if (msg.includes('0x6982')) {
        throw new Error('Ledger is locked or Bitcoin app not open. Please unlock device, open Bitcoin app, and try again.');
      }
      throw e;
    }
  }

  private rootToIndexToPubkey: Map<string, Map<number, string>> = new Map();

  private async _ensurePubkeyAtIndex(index: number, derivationRoot?: string): Promise<string> {
    const root = derivationRoot || this.derivationRoot;
    if (!root) {
      throw new Error('Derivation path is not initialized');
    }
    const rootMap = this.rootToIndexToPubkey.get(root);
    if (rootMap?.has(index)) {
      const value = rootMap.get(index);
      if (value) return value;
    }
    const path = this._pathForIndex(index, root);
    return this._fetchPubkey(path, index, root);
  }

  getAccountByDerivationPath(derivationPath: string, index: number): string {
    return this.rootToIndexToPubkey.get(derivationPath)?.get(index) || '';
  }

  retrievePublicKeys(): string[] {
    const result: string[] = [];
    const rootMap = this.rootToIndexToPubkey.get(this.derivationRoot) || new Map();
    const indexes =
      rootMap === this.rootToIndexToPubkey.get(this.derivationRoot)
        ? this.activeIndexes
        : Array.from(rootMap.keys());
    const pubkeys: string[] = [];
    for (const idx of indexes) {
      const pub = rootMap.get(idx);
      if (pub) {
        pubkeys.push(pub);
      }
    }
    return pubkeys;
  }

  async activateAccounts(indexes: number[]) {
    const unique = Array.from(new Set(indexes));
    for (const idx of unique) {
      const pubkey = await this._ensurePubkeyAtIndex(idx);
      if (!this.activeIndexes.includes(idx) && !isEmpty(pubkey)) {
        this.activeIndexes.push(idx);
      }
    }
  }

  async addNewAccounts(count = 1): Promise<string[]> {
    const currentMax = this.activeIndexes.length ? Math.max(...this.activeIndexes) : -1;
    const newIndexes: number[] = [];
    for (let i = 1; i <= count; i++) {
      newIndexes.push(currentMax + i);
    }
    await this.activateAccounts(newIndexes);
    return newIndexes.map(i => this.rootToIndexToPubkey.get(this.derivationRoot)?.get(i) || '');
  }

  async ensureAccountForDerivation(derivationPath: string, index: number): Promise<string> {
    return this._ensurePubkeyAtIndex(index, derivationPath);
  }

  async signTransaction(
    psbt: bitcoin.Psbt,
    inputs: {
      index: number;
      publicKey: string;
      sighashTypes?: number[];
      disableTweakSigner?: boolean;
    }[],
  ): Promise<bitcoin.Psbt> {
    const ledger = getLedgerService();
    
    // Normalize public key for comparison (remove prefix if any, convert to lowercase)
    const normalizePubkey = (pubkey: string): string => {
      // Remove 0x prefix if present
      let normalized = pubkey.startsWith('0x') ? pubkey.slice(2) : pubkey;
      // Convert to lowercase for comparison
      return normalized.toLowerCase();
    };
    
    // Convert public key to compressed format for comparison
    const toCompressedPubkey = (pubkeyHex: string): string => {
      try {
        const pubkeyBuffer = Buffer.from(pubkeyHex, 'hex');
        // If already compressed (33 bytes), return as is
        if (pubkeyBuffer.length === 33) {
          return pubkeyHex.toLowerCase();
        }
        // If uncompressed (65 bytes), convert to compressed
        if (pubkeyBuffer.length === 65) {
          try {
            const compressed = ECPair.fromPublicKey(pubkeyBuffer, {compressed: true}).publicKey;
            return Buffer.from(compressed).toString('hex').toLowerCase();
          } catch (e) {
            return pubkeyHex.toLowerCase();
          }
        }
        return pubkeyHex.toLowerCase();
      } catch (e) {
        return pubkeyHex.toLowerCase();
      }
    };
    
    // Compare two public keys (handles both compressed and uncompressed)
    const comparePubkeys = (key1: string, key2: string): boolean => {
      const normalized1 = normalizePubkey(key1);
      const normalized2 = normalizePubkey(key2);
      if (normalized1 === normalized2) return true;
      
      // Try comparing compressed versions
      const compressed1 = toCompressedPubkey(key1);
      const compressed2 = toCompressedPubkey(key2);
      return compressed1 === compressed2;
    };
    
    // Find derivation paths for each input
    const paths: string[] = [];

    for (const input of inputs) {
      const normalizedInputKey = normalizePubkey(input.publicKey);
      let foundPath: string | undefined;
      let foundIndex: number | undefined;
      let foundRoot: string | undefined;
      
      // Search in all cached roots
      for (const [root, rootMap] of this.rootToIndexToPubkey.entries()) {
        for (const [idx, pub] of rootMap.entries()) {
          if (comparePubkeys(pub, input.publicKey)) {
            foundPath = `${root}/${idx}`;
            foundIndex = idx;
            foundRoot = root;
            break;
          }
        }
        if (foundPath) break;
      }
      
      // If not found in cache, try to fetch from Ledger by scanning common indices
      // Also try to get public key from PSBT input data
      if (!foundPath) {
        // First, try to get public key from PSBT input's partialSig or tapInternalKey
        try {
          const psbtInput = psbt.data.inputs[input.index];
          if (psbtInput.partialSig && psbtInput.partialSig.length > 0) {
            // Try to match with partialSig pubkey
            for (const sig of psbtInput.partialSig) {
              const sigPubkey = Buffer.from(sig.pubkey).toString('hex');
              const normalizedSigKey = normalizePubkey(sigPubkey);
              if (normalizedSigKey === normalizedInputKey) {
                // Found matching pubkey in partialSig, but still need to find path
                // Continue to scan
                break;
              }
            }
          }
        } catch (e) {
          // Ignore errors when reading PSBT input
        }
        
        // Try to find by scanning indices 0-50 for each root (expanded range)
        const rootsToTry = this.rootToIndexToPubkey.size > 0 
          ? Array.from(this.rootToIndexToPubkey.keys())
          : [this.derivationRoot].filter(Boolean);
        
        if (rootsToTry.length === 0) {
          throw new Error(`No derivation paths available. Wallet may not be properly initialized.`);
        }
        
        let scanAttempts = 0;
        const maxScanAttempts = 50; // Scan up to index 50
        
        for (const root of rootsToTry) {
          // Determine format from root path
          const format = this._getFormatFromPath(root);
          for (let idx = 0; idx <= maxScanAttempts; idx++) {
            try {
              scanAttempts++;
              const path = `${root}/${idx}`;
              const {publicKeyHex} = await ledger.getWalletPublicKey(`m/${path}`, {
                verify: false,
                format: format as any,
              });
              // Cache the fetched key
              const rootMap = this.rootToIndexToPubkey.get(root) || new Map();
              rootMap.set(idx, publicKeyHex);
              this.rootToIndexToPubkey.set(root, rootMap);
              
              if (comparePubkeys(publicKeyHex, input.publicKey)) {
                foundPath = path;
                foundIndex = idx;
                foundRoot = root;
                break;
              }
            } catch (e) {
              // Continue searching
            }
          }
          if (foundPath) break;
        }
        
        // If still not found, try with activeIndexes
        if (!foundPath && this.activeIndexes.length > 0) {
          for (const root of rootsToTry) {
            // Determine format from root path
            const format = this._getFormatFromPath(root);
            for (const idx of this.activeIndexes) {
              try {
                const path = `${root}/${idx}`;
                const {publicKeyHex} = await ledger.getWalletPublicKey(`m/${path}`, {
                  verify: false,
                  format: format as any,
                });
                if (comparePubkeys(publicKeyHex, input.publicKey)) {
                  foundPath = path;
                  foundIndex = idx;
                  foundRoot = root;
                  break;
                }
              } catch (e) {
                // Continue
              }
            }
            if (foundPath) break;
          }
        }
      }
      
      if (!foundPath) {
        throw new Error(`Public key ${input.publicKey.substring(0, 16)}... not found in hardware wallet cache. Please ensure the account is activated.`);
      }
      
      paths.push(foundPath);
    }
    
    // Sign PSBT with Ledger
    const signedPsbtHex = await ledger.signTransaction(psbt, paths);
    return bitcoin.Psbt.fromHex(signedPsbtHex, {network: this.network});
  }

  async signMessage(publicKeyHex: string, message: string): Promise<string> {
    let foundIndex: number | undefined;
    for (const [idx, pub] of (this.rootToIndexToPubkey.get(this.derivationRoot) || new Map()).entries()) {
      if (pub === publicKeyHex) {
        foundIndex = idx;
        break;
      }
    }
    if (foundIndex === undefined) {
      throw new Error('Public key not found in hardware wallet cache');
    }
    const path = this._pathForIndex(foundIndex);
    const ledger = getLedgerService();
    const sig = await ledger.signMessage(path, message);
    return Buffer.from(sig).toString('base64');
  }

  exportPrivateKey(): never {
    throw new Error('Private key export is not available for hardware wallets');
  }
}









