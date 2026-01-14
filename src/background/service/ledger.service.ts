import Transport from '@ledgerhq/hw-transport';
import AppBTC from '@ledgerhq/hw-app-btc';
import * as bitcoin from 'bitcoinjs-lib';
import {encode as encodeVarint} from 'varuint-bitcoin';

// Import transport classes - window is polyfilled in background/index.ts
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';

import {ECPair} from '@/src/background/utils/bitcoin-core';
import {networkConfig} from '@/src/background/service/singleton';
import {Network} from '@/src/wallet-instance';

/**
 * Connection method type
 */
export type ConnectionMethod = 'usb' | 'auto';

/**
 * Ledger Service Interface
 */
export interface LedgerService {
  connect(method?: ConnectionMethod): Promise<{name: string; version: string}>;
  disconnect(): Promise<void>;
  getStatus(): Promise<{connected: boolean; name?: string; version?: string}>;
  getWalletPublicKey(
    path: string,
    options?: {verify?: boolean; format?: string},
  ): Promise<{
    publicKey: Uint8Array;
    publicKeyHex: string;
    bitcoinAddress: string;
    chainCode: Uint8Array;
    xOnlyPublicKey?: Uint8Array;
    taprootAddress?: string;
  }>;
  signTransaction(psbt: bitcoin.Psbt, paths: string[]): Promise<string>;
  signMessage(path: string, message: string): Promise<Uint8Array>;
}

let ledgerServiceInstance: LedgerService | null = null;

const txHexCache = new Map<string, string>();

const MEMPOOL_API_BASE: Record<Network, string> = {
  [Network.MAINNET]: 'https://mempool.space/api',
  [Network.TESTNET]: 'https://mempool.space/testnet/api',
};

function serializeOutputs(outputs: Array<{value: number; script: Buffer}>): string {
  const parts: Buffer[] = [];
  parts.push(encodeVarint(outputs.length));
  outputs.forEach(output => {
    const valueBuffer = Buffer.allocUnsafe(8);
    valueBuffer.writeBigUInt64LE(BigInt(output.value));
    parts.push(valueBuffer);
    const script = output.script || Buffer.alloc(0);
    parts.push(encodeVarint(script.length));
    parts.push(script);
  });
  return Buffer.concat(parts).toString('hex');
}

async function fetchTransactionHex(txid: string): Promise<string> {
  if (txHexCache.has(txid)) {
    return txHexCache.get(txid)!;
  }
  const network = networkConfig.getActiveNetwork();
  const baseUrl = MEMPOOL_API_BASE[network] ?? MEMPOOL_API_BASE[Network.MAINNET];
  const response = await fetch(`${baseUrl}/tx/${txid}/hex`);
  if (!response.ok) {
    throw new Error(
      `Unable to fetch previous transaction ${txid}: ${response.statusText}`,
    );
  }
  const hex = (await response.text()).trim();
  if (!hex) {
    throw new Error(`Empty transaction data for ${txid}`);
  }
  txHexCache.set(txid, hex);
  return hex;
}

function getSigningOptionsFromPath(path: string): {
  additionals: string[];
  segwit: boolean;
} {
  const segments = path.split('/');
  const purposeSegment = segments[0] || '';
  const purpose = parseInt(purposeSegment.replace(/'/g, ''), 10);
  if (purpose === 84) {
    return {additionals: ['bech32'], segwit: true};
  }
  if (purpose === 86) {
    return {additionals: ['bech32m'], segwit: true};
  }
  if (purpose === 49) {
    return {additionals: [], segwit: true};
  }
  return {additionals: [], segwit: false};
}

function adjustPathForActiveNetwork(path: string): string {
  // Ensure coin_type' matches active network: 0' for mainnet, 1' for testnet
  // Path format expected like "84'/0'/0'/0/0"
  const active = networkConfig.getActiveNetwork();
  const wantCoinType = active === Network.TESTNET ? "1'" : "0'";
  const parts = path.split('/');
  if (parts.length >= 2) {
    // parts[0] = purpose', parts[1] = coin_type'
    const coin = parts[1]?.replace(/'/g, '');
    if (coin !== undefined) {
      parts[1] = wantCoinType;
    }
    return parts.join('/');
  }
  return path;
}

function getExpectedAppName(): string {
  const active = networkConfig.getActiveNetwork();
  return active === Network.TESTNET ? 'Bitcoin Test' : 'Bitcoin';
}

async function fetchLedgerAppInfo(
  app: AppBTC | null,
  transport: Transport | null,
): Promise<{name: string; version: string} | null> {
  if (app && typeof (app as any).getAppAndVersion === 'function') {
    try {
      const appInfo = await (app as any).getAppAndVersion();
      if (appInfo?.name && appInfo?.version) {
        return {name: appInfo.name, version: appInfo.version};
      }
    } catch (error) {
      // fall back to raw transport command
    }
  }

  if (!transport) {
    return null;
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('getAppInfo timeout')), 5000);
    });
    
    const response = await Promise.race([
      transport.send(0xb0, 0x01, 0x00, 0x00),
      timeoutPromise,
    ]);
    
    // Response format: [formatId][nameLen][name...][versionLen][version...][flagsLen][flags...]
    let offset = 0;
    if (response.length < 2) {
      return null;
    }
    const formatId = response[offset++];
    if (formatId !== 1 && formatId !== 2) {
      return null;
    }
    const nameLength = response[offset++];
    const name = response.slice(offset, offset + nameLength).toString('utf8');
    offset += nameLength;
    const versionLength = response[offset++];
    const version = response.slice(offset, offset + versionLength).toString('utf8');
    return {name, version};
  } catch (error) {
    return null;
  }
}

/**
 * Create a Ledger service to connect with a real Ledger device
 * Use WebUSB or WebHID transport
 */
function createRealLedgerService(): LedgerService {
  let transport: Transport | null = null;
  let appBTC: AppBTC | null = null;
  let isConnected = false;

  /**
   * Helper function to detect if error is a connection/transport error
   */
  const isConnectionError = (error: any): boolean => {
    const errorMsg = error?.message || String(error || '');
    return (
      errorMsg.includes('disconnected') ||
      errorMsg.includes('disconnect') ||
      errorMsg.includes('not connected') ||
      errorMsg.includes('Device') ||
      errorMsg.includes('transfer') ||
      errorMsg.includes('transferOut') ||
      errorMsg.includes('ETIMEDOUT') ||
      errorMsg.includes('timeout') ||
      errorMsg.includes('device was disconnect') ||
      error?.code === 'ETIMEDOUT'
    );
  };

  /**
   * Helper function to detect if error is an app error (wrong app or app closed)
   */
  const isAppError = (error: any): boolean => {
    const errorMsg = error?.message || String(error || '');
    return (
      errorMsg.includes('CLA_NOT_SUPPORTED') ||
      errorMsg.includes('INS_NOT_SUPPORTED') ||
      errorMsg.includes('UNKNOWN_APDU') ||
      errorMsg.includes('0x6e00') ||
      errorMsg.includes('0x6d00') ||
      errorMsg.includes('0x6d02') ||
      errorMsg.includes('6e00') ||
      errorMsg.includes('6d00') ||
      errorMsg.includes('6d02') ||
      (error?.statusCode !== undefined &&
       (error.statusCode === 0x6e00 ||
        error.statusCode === 0x6d00 ||
        error.statusCode === 0x6d02))
    );
  };

  /**
   * Ensures transport is valid, reconnects if needed
   * Returns true if transport is valid, false if reconnect failed
   */
  const ensureTransportValid = async (): Promise<boolean> => {
    // Cleanup old transport first (it may be invalid)
    if (transport) {
      try {
        await transport.close();
      } catch (e) {
        // Ignore cleanup errors - transport may already be closed
      }
      transport = null;
      appBTC = null;
    }
    isConnected = false;

    // Reconnect with timeout to prevent hanging
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      await Promise.race([
        service.connect('auto'),
        timeoutPromise,
      ]);
      return true;
    } catch (error) {
      return false;
    }
  };

  const service: LedgerService = {
    async connect(method: ConnectionMethod = 'auto'): Promise<{name: string; version: string}> {
      if (isConnected && transport) {
        // Already connected, just fetch app info
        if (appBTC) {
          const appInfo = await fetchLedgerAppInfo(appBTC, transport);
          if (appInfo) {
            return {
              name: appInfo.name,
              version: appInfo.version,
            };
          }
        }
      }

      try {
        let transportInstance: Transport | null = null;
        let connectionError: Error | null = null;

        // Try the specified connection method
        if (method === 'usb') {
          // Try USB only
          try {
            transportInstance = await TransportWebUSB.create();
          } catch (usbError) {
            try {
              transportInstance = await TransportWebHID.create();
            } catch (hidError) {
              connectionError = new Error(
                'Unable to connect via USB. Please:\n' +
                '1. Ensure the Ledger is connected via USB\n' +
                '2. Open the Bitcoin app on the Ledger\n' +
                '3. Close Ledger Live if it is open\n' +
                '4. Allow the browser to access the USB device when prompted',
              );
            }
          }
        } else {
          // Auto: try all methods
          // Try USB first (most common)
          try {
            transportInstance = await TransportWebUSB.create();
          } catch (usbError) {
            try {
              transportInstance = await TransportWebHID.create();
            } catch (hidError) {
              connectionError = new Error(
                'Unable to connect to Ledger via USB. Please try:\n' +
                '1. Ensure the Ledger is connected via USB\n' +
                '2. Open the Bitcoin app on the Ledger\n' +
                '3. Close Ledger Live if it is open\n' +
                '4. Allow the browser to access the USB device when prompted',
              );
            }
          }
        }

        if (!transportInstance) {
          if (connectionError) {
            throw connectionError;
          }
          throw new Error('Unable to create transport connection');
        }

        transport = transportInstance;
        appBTC = new AppBTC({transport});

        // Check which app is running on Ledger
        const appInfo = await fetchLedgerAppInfo(appBTC, transport);

        isConnected = true;

        return {
          name: appInfo?.name ?? '',
          version: appInfo?.version ?? '',
        };
      } catch (error: any) {
        // Cleanup on error
        if (transport) {
          try {
            await transport.close();
          } catch (e) {
            // Ignore cleanup errors
          }
          transport = null;
          appBTC = null;
        }
        isConnected = false;

        throw error;
      }
    },

    async disconnect(): Promise<void> {
      if (transport) {
        try {
          await transport.close();
        } catch (error) {
          // Ignore disconnect errors
        }
        transport = null;
        appBTC = null;
        isConnected = false;
      }
    },

    async getStatus(): Promise<{connected: boolean; name?: string; version?: string}> {
      try {
        // If not connected, try to reconnect (with timeout) to check actual device state
        if (!isConnected || !transport) {
          try {
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Connection check timeout')), 3000);
            });

            await Promise.race([
              service.connect('auto'),
              timeoutPromise,
            ]);
          } catch (connectError) {
            // Failed to connect - device not available
            return {connected: false};
          }
        }

        // Now we have a connection, get app info
        if (!appBTC && transport) {
          appBTC = new AppBTC({transport});
        }

        const appInfo = await fetchLedgerAppInfo(appBTC, transport);
        if (!appInfo) {
          return {connected: true};
        }
        return {connected: true, name: appInfo.name, version: appInfo.version};
      } catch (error: any) {
        const errorMsg = error?.message || String(error || '');

        // If transport error (timeout, device locked, etc.), mark as disconnected
        if (
          errorMsg.includes('timeout') ||
          errorMsg.includes('ETIMEDOUT') ||
          errorMsg.includes('Transport') ||
          error?.code === 'ETIMEDOUT'
        ) {
          isConnected = false;
        }

        return {connected: false};
      }
    },

    async getWalletPublicKey(
      path: string,
      options: {verify?: boolean; format?: string} = {},
    ): Promise<{
      publicKey: Uint8Array;
      publicKeyHex: string;
      bitcoinAddress: string;
      chainCode: Uint8Array;
      xOnlyPublicKey?: Uint8Array;
      taprootAddress?: string;
    }> {
      // Check if Ledger is connected
      // Don't auto-reconnect here - only reconnect if operation fails
      // This prevents hanging when Ledger is disconnected before operation
      if (!isConnected || !appBTC || !transport) {
        throw new Error('Ledger is not connected. Please ensure the device is unlocked and connected.');
      }

      const normalizedPath = path.replace(/^m\//, '');
      const adjusted = adjustPathForActiveNetwork(normalizedPath);

      // Helper function to process result
      const processResult = (result: any) => {
        // Convert string to Buffer
        let publicKeyBuffer: Uint8Array = Buffer.from(result.publicKey, 'hex');
        const chainCodeBuffer: Uint8Array = Buffer.from(result.chainCode, 'hex');

        // Ensure compressed pubkey for p2wpkh (33 bytes). Ledger often returns uncompressed (65 bytes).
        if (publicKeyBuffer.length === 65 && publicKeyBuffer[0] === 0x04) {
          try {
            publicKeyBuffer = ECPair.fromPublicKey(Buffer.from(publicKeyBuffer), {
              compressed: true,
            }).publicKey;
          } catch (e) {
            // Fallback: keep as-is; downstream may handle, but p2wpkh requires compressed
          }
        }

        const publicKeyHex = Buffer.from(publicKeyBuffer).toString('hex');

        return {
          publicKey: publicKeyBuffer,
          publicKeyHex,
          bitcoinAddress: result.bitcoinAddress || '',
          chainCode: chainCodeBuffer,
          // Taproot will be handled separately if needed
        };
      };

      try {
        const result: any = await appBTC!.getWalletPublicKey(adjusted, {
          verify: options.verify || false,
          format: (options.format as any) || 'bech32',
        });

        return processResult(result);
      } catch (error: any) {
        const errorMsg = error?.message || String(error || '');

        // Only attempt reconnect if we detect a transport/app error during operation
        // This means Ledger was connected but became disconnected
        if (isConnectionError(error) || isAppError(error)) {
          const reconnected = await ensureTransportValid();
          if (!reconnected) {
            if (isAppError(error)) {
              const appName = getExpectedAppName();
              throw new Error(`Please open the ${appName} app on your Ledger and try again.`);
            }
            throw new Error('Ledger connection lost. Please ensure the device is unlocked and connected.');
          }

          // Retry the operation after successful reconnection
          try {
            const result: any = await appBTC!.getWalletPublicKey(adjusted, {
              verify: options.verify || false,
              format: (options.format as any) || 'bech32',
            });

            return processResult(result);
          } catch (retryError: any) {
            const retryErrorMsg = retryError?.message || String(retryError || '');
            throw new Error(
              `Failed to get public key after reconnection: ${retryErrorMsg}`,
            );
          }
        }

        // Non-connection errors - but check if message suggests connection issue
        if (errorMsg.toLowerCase().includes('disconnect') || errorMsg.toLowerCase().includes('device')) {
          throw new Error('Ledger connection lost. Verify the device is unlocked and connected.');
        }

        // Other errors - preserve original message for debugging
        throw new Error(
          `Failed to get public key: ${errorMsg}`,
        );
      }
    },

    async signTransaction(psbt: bitcoin.Psbt, paths: string[]): Promise<string> {
      // Note: Don't check isConnected here - the flag may be stale after physical disconnect/reconnect
      // Instead, ensure we have a valid connection before preparing transaction data
      try {
        // Ensure appBTC is available before we start (needed for splitTransaction below)
        if (!appBTC || !transport) {
          const isValid = await ensureTransportValid();
          if (!isValid) {
            throw new Error('Failed to connect to Ledger. Please ensure the device is unlocked and the Bitcoin app is open, then try again.');
          }
          if (!appBTC && transport) {
            appBTC = new AppBTC({transport});
          }
        }

        // Normalize paths (remove leading "m/")
        const normalizedPaths = paths
          .map(path => path.replace(/^m\//, ''))
          .map(p => adjustPathForActiveNetwork(p));
        if (normalizedPaths.length === 0) {
          throw new Error('No derivation paths provided for signing');
        }

        const signingOptions = getSigningOptionsFromPath(normalizedPaths[0]);

        // Clone PSBT to avoid modifying original
        const psbtNetwork = (psbt as any).network || bitcoin.networks.bitcoin;
        const psbtClone = bitcoin.Psbt.fromHex(psbt.toHex(), {
          network: psbtNetwork,
        });

        const ledgerInputs: any[] = [];
        const associatedKeysets: string[] = [];
        const additionals = [...signingOptions.additionals];

        // Prepare inputs for Ledger (requires appBTC.splitTransaction)
        for (let i = 0; i < psbtClone.inputCount; i++) {
          const input = psbtClone.data.inputs[i];
          const txInput = psbtClone.txInputs[i];
          const txid = Buffer.from(txInput.hash).reverse().toString('hex');

          let prevTxHex: string;
          if (input.nonWitnessUtxo) {
            prevTxHex = input.nonWitnessUtxo.toString('hex');
          } else {
            prevTxHex = await fetchTransactionHex(txid);
          }
          const prevTxObj = bitcoin.Transaction.fromHex(prevTxHex);
          const prevOut = prevTxObj.outs[txInput.index];

          const isSegwitInput =
            !!input.witnessUtxo || signingOptions.segwit || additionals.length > 0;

          // appBTC should exist at this point (ensured above)
          if (!appBTC) {
            throw new Error('Ledger appBTC not initialized. Please reconnect.');
          }

          const splitTx = appBTC.splitTransaction(
            prevTxHex,
            isSegwitInput,
            false,
            additionals,
          );

          const redeemScript = input.redeemScript
            ? input.redeemScript.toString('hex')
            : null;
          const sequence =
            typeof txInput.sequence === 'number' ? txInput.sequence : undefined;

          const inputTuple: any[] = [splitTx, txInput.index, redeemScript, sequence];
          if (isSegwitInput) {
            const amount =
              input.witnessUtxo?.value ??
              (prevOut?.value !== undefined ? prevOut.value : undefined);
            if (typeof amount === 'number') {
              inputTuple.push(amount);
            }
          }

          ledgerInputs.push(inputTuple);
          associatedKeysets.push(normalizedPaths[i] || normalizedPaths[0]);
        }

        if (ledgerInputs.length === 0) {
          throw new Error('No inputs found in PSBT');
        }

        const outputScriptHex = serializeOutputs(psbtClone.txOutputs);
        if (!outputScriptHex || outputScriptHex.length === 0) {
          throw new Error('No outputs found in PSBT');
        }

        const txCache = (psbtClone as any).__CACHE?.__TX;
        const lockTime = txCache?.locktime ?? 0;

        const params: any = {
          inputs: ledgerInputs,
          associatedKeysets,
          outputScriptHex,
          additionals,
          sigHashType: 0x01,
          lockTime,
        };

        if (signingOptions.segwit) {
          params.segwit = true;
          params.useTrustedInputForSegwit = true;
        }

        let signedTxHex: string;
        let retryCount = 0;
        const maxRetries = 3; // Retry up to 3 times to wait for user to unlock Ledger
        
        while (retryCount <= maxRetries) {
          try {
            // Check if we need to reconnect (first attempt with no connection, or retry after error)
            if (!appBTC || !transport || retryCount > 0) {
              if (retryCount > 0) {
                // Longer delay for later retries to give user time to unlock Ledger
                const delay = retryCount === 1 ? 1000 : 2000;
                await new Promise(resolve => setTimeout(resolve, delay));
              }

              const isValid = await ensureTransportValid();
              if (!isValid) {
                if (retryCount < maxRetries) {
                  retryCount++;
                  continue;
                }
                throw new Error('Failed to reconnect to Ledger. Please ensure the device is unlocked and the Bitcoin app is open, then try again.');
              }
              // Ensure appBTC is created with new transport
              if (!appBTC && transport) {
                appBTC = new AppBTC({transport});
              }
              if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }

            // Double-check appBTC exists after reconnect attempt
            if (!appBTC) {
              if (retryCount < maxRetries) {
                retryCount++;
                continue;
              }
              throw new Error('Ledger appBTC not initialized. Please reconnect.');
            }
            
            signedTxHex = await appBTC.createPaymentTransaction(params);
            break; // Success, exit retry loop
          } catch (ledgerError: any) {
            const errorMsg = ledgerError?.message || String(ledgerError || '');

            // Check if it's a transport/disconnection error
            const isTransportError =
              errorMsg.includes('device was disconnected') ||
              errorMsg.includes('disconnected') ||
              errorMsg.includes('transfer') ||
              errorMsg.includes('ETIMEDOUT') ||
              errorMsg.includes('timeout') ||
              errorMsg.includes('not connected') ||
              ledgerError?.code === 'ETIMEDOUT';

            // Check if it's an app error (wrong app or app closed)
            // 0x6e00 = CLA_NOT_SUPPORTED (wrong app)
            // 0x6d00 = INS_NOT_SUPPORTED (wrong app or app closed)
            // 0x6d02 = UNKNOWN_APDU (app not open or wrong app)
            const isAppError =
              errorMsg.includes('CLA_NOT_SUPPORTED') ||
              errorMsg.includes('INS_NOT_SUPPORTED') ||
              errorMsg.includes('UNKNOWN_APDU') ||
              errorMsg.includes('0x6e00') ||
              errorMsg.includes('0x6d00') ||
              errorMsg.includes('0x6d02') ||
              errorMsg.includes('6e00') ||
              errorMsg.includes('6d00') ||
              errorMsg.includes('6d02') ||
              (ledgerError?.statusCode !== undefined &&
               (ledgerError.statusCode === 0x6e00 ||
                ledgerError.statusCode === 0x6d00 ||
                ledgerError.statusCode === 0x6d02));

            // Check if it's app not ready error (0x6a80, 0x6a87)
            // 0x6a80: App was just opened and not fully initialized yet
            // 0x6a87: Device not ready (plugged in after modal opened, or just unlocked)
            // Should retry with delay instead of failing immediately
            const isAppNotReady =
              errorMsg.includes('not supported') ||
              errorMsg.includes('0x6a80') ||
              errorMsg.includes('6a80') ||
              errorMsg.includes('0x6a87') ||
              errorMsg.includes('6a87') ||
              errorMsg.includes('UNKNOWN_ERROR') ||
              (ledgerError?.statusCode !== undefined &&
               (ledgerError.statusCode === 0x6a80 || ledgerError.statusCode === 0x6a87));

            // Combine transport, app errors, and app-not-ready - all need retry
            const needsReconnect = isTransportError || isAppError || isAppNotReady;
            
            if (needsReconnect && retryCount < maxRetries) {
              retryCount++;
              continue;
            }
            
            // Non-transport errors or max retries reached
            if (
              errorMsg.includes('destructure') ||
              errorMsg.includes('inputs') ||
              errorMsg.includes('undefined')
            ) {
              throw new Error(
                `Ledger signing failed: The createPaymentTransaction API may have changed. Please check Ledger Bitcoin app version (requires 2.1.0+). Error: ${errorMsg}`,
              );
            }
            
            // If max retries reached with transport or app error, provide helpful message
            if (needsReconnect && retryCount >= maxRetries) {
              if (isAppNotReady) {
                // Special message for app-not-ready after exhausting retries
                throw new Error(
                  'Ledger app is not responding. Please ensure the Bitcoin app is open and try again. ' +
                  'If the problem persists, try closing and reopening the app on your Ledger.',
                );
              }
              if (isAppError) {
                const appName = getExpectedAppName();
                throw new Error(`Please open the ${appName} app on your Ledger and try again.`);
              }
              throw new Error(
                'Ledger connection failed. Please ensure the device is unlocked, the Bitcoin app is open, and connected via USB.',
              );
            }

            // If app error but not retrying, provide specific message
            if (isAppError) {
              const appName = getExpectedAppName();
              throw new Error(`Please open the ${appName} app on your Ledger and try again.`);
            }

            throw ledgerError;
          }
        }

        if (!signedTxHex || typeof signedTxHex !== 'string') {
          throw new Error('Ledger returned invalid signed transaction.');
        }

        const signedTx = bitcoin.Transaction.fromHex(signedTxHex);

        for (let i = 0; i < psbtClone.inputCount && i < signedTx.ins.length; i++) {
          const txInput = signedTx.ins[i];
          const psbtInput = psbtClone.data.inputs[i];
          const path = normalizedPaths[i] || normalizedPaths[0];

          let signatureBuf: Buffer | undefined;
          let pubkeyBuf: Buffer | undefined;

          if (txInput.witness && txInput.witness.length > 0) {
            signatureBuf = Buffer.from(txInput.witness[0]);
            if (txInput.witness[1]) {
              pubkeyBuf = Buffer.from(txInput.witness[1]);
            }
          } else if (txInput.script && txInput.script.length > 0) {
            const scriptChunks = bitcoin.script.decompile(txInput.script);
            if (scriptChunks && scriptChunks.length >= 2) {
              signatureBuf = Buffer.from(scriptChunks[0] as Buffer);
              pubkeyBuf = Buffer.from(scriptChunks[1] as Buffer);
            }
          }

          const isTaprootInput =
            additionals.includes('bech32m') || Boolean(psbtInput.tapInternalKey);

          if (!isTaprootInput && !pubkeyBuf) {
            let pubKeyResult;
            let pubKeyRetryCount = 0;
            const maxPubKeyRetries = 3; // Retry up to 3 times to wait for user to unlock Ledger
            
            while (pubKeyRetryCount <= maxPubKeyRetries) {
              try {
                if (pubKeyRetryCount > 0) {
                  const delay = pubKeyRetryCount === 1 ? 1000 : 2000;
                  await new Promise(resolve => setTimeout(resolve, delay));
                  
                  const isValid = await ensureTransportValid();
                  if (!isValid) {
                    if (pubKeyRetryCount < maxPubKeyRetries) {
                      pubKeyRetryCount++;
                      continue;
                    }
                    throw new Error('Failed to reconnect to Ledger. Please ensure the device is unlocked and the Bitcoin app is open, then try again.');
                  }
                  if (!appBTC && transport) {
                    appBTC = new AppBTC({transport});
                  }
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                if (!appBTC) {
                  if (pubKeyRetryCount < maxPubKeyRetries) {
                    pubKeyRetryCount++;
                    continue;
                  }
                  throw new Error('Ledger appBTC not initialized. Please reconnect.');
                }
                
                pubKeyResult = await this.getWalletPublicKey(`m/${path}`, {
                  verify: false,
                });
                break; // Success, exit retry loop
              } catch (error: any) {
                const errorMsg = error?.message || String(error || '');
                const isTransportError =
                  errorMsg.includes('device was disconnected') ||
                  errorMsg.includes('disconnected') ||
                  errorMsg.includes('transfer') ||
                  errorMsg.includes('ETIMEDOUT') ||
                  errorMsg.includes('timeout') ||
                  errorMsg.includes('not connected') ||
                  error?.code === 'ETIMEDOUT';
                
                // Check if it's an app error (wrong app or app closed)
                // 0x6e00 = CLA_NOT_SUPPORTED (wrong app)
                // 0x6d00 = INS_NOT_SUPPORTED (wrong app or app closed)
                // 0x6d02 = UNKNOWN_APDU (app not open or wrong app)
                const isAppError =
                  errorMsg.includes('CLA_NOT_SUPPORTED') ||
                  errorMsg.includes('INS_NOT_SUPPORTED') ||
                  errorMsg.includes('UNKNOWN_APDU') ||
                  errorMsg.includes('0x6e00') ||
                  errorMsg.includes('0x6d00') ||
                  errorMsg.includes('0x6d02') ||
                  errorMsg.includes('6e00') ||
                  errorMsg.includes('6d00') ||
                  errorMsg.includes('6d02') ||
                  (error?.statusCode !== undefined && 
                   (error.statusCode === 0x6e00 || 
                    error.statusCode === 0x6d00 || 
                    error.statusCode === 0x6d02));
                
                // Combine transport and app errors - both need reconnect
                const needsReconnect = isTransportError || isAppError;
                
                if (needsReconnect && pubKeyRetryCount < maxPubKeyRetries) {
                  pubKeyRetryCount++;
                  continue;
                }
                
                // If max retries reached with transport or app error, provide helpful message
                if (needsReconnect && pubKeyRetryCount >= maxPubKeyRetries) {
                  if (isAppError) {
                    const appName = getExpectedAppName();
                    throw new Error(`Please open the ${appName} app on your Ledger and try again.`);
                  }
                  throw new Error(
                    'Ledger connection failed. Please ensure the device is unlocked, the Bitcoin app is open, and connected via USB.',
                  );
                }
                
                // If app error but not retrying, provide specific message
                if (isAppError) {
                  const appName = getExpectedAppName();
                  throw new Error(`Please open the ${appName} app on your Ledger and try again.`);
                }
                
                throw error; // Re-throw if not transport/app error or max retries reached
              }
            }
            
            pubkeyBuf = Buffer.from(pubKeyResult.publicKeyHex, 'hex');
          }

          if (isTaprootInput) {
            if (signatureBuf) {
              psbtClone.updateInput(i, {
                tapKeySig: signatureBuf,
              });
            }
          } else if (signatureBuf && pubkeyBuf) {
            psbtClone.updateInput(i, {
              partialSig: [
                {
                  pubkey: pubkeyBuf,
                  signature: signatureBuf,
                },
              ],
            });

            psbtClone.validateSignaturesOfInput(
              i,
              (pubkey, hash, sig) => {
                try {
                  const key = ECPair.fromPublicKey(pubkey);
                  return key.verify(hash, sig);
                } catch (err) {
                  return false;
                }
              },
              pubkeyBuf,
            );
          }
        }

        return psbtClone.toHex();
      } catch (error: any) {
        // Re-throw the error as-is - specific error messages are already set in the retry loop
        throw error;
      }
    },

    async signMessage(path: string, message: string): Promise<Uint8Array> {
      // Check if Ledger is connected
      // Don't auto-reconnect here - only reconnect if operation fails
      if (!isConnected || !appBTC) {
        throw new Error('Ledger is not connected');
      }

      // Normalize and adjust derivation path for active network
      const normalizedPath = path.replace(/^m\//, '');
      const adjustedPath = adjustPathForActiveNetwork(normalizedPath);
      const messageHex = Buffer.from(message, 'utf8').toString('hex');

      // Helper to process result
      const processResult = (result: any): Uint8Array => {
        // Ensure r/s are 32-byte padded (64 hex chars)
        const rHex = result.r.padStart(64, '0');
        const sHex = result.s.padStart(64, '0');

        // Convert result to Buffer (header + r + s) with recovery ID
        const v = result.v + 27 + 4; // Add recovery ID
        const signatureHex = v.toString(16).padStart(2, '0') + rHex + sHex;
        return Buffer.from(signatureHex, 'hex');
      };

      try {
        const result = await appBTC!.signMessage(adjustedPath, messageHex);
        return processResult(result);
      } catch (error: any) {
        const errorMsg = error?.message || String(error || '');

        // Only attempt reconnect if we detect a transport/app error during operation
        if (isConnectionError(error) || isAppError(error)) {
          const reconnected = await ensureTransportValid();
          if (!reconnected) {
            if (isAppError(error)) {
              const appName = getExpectedAppName();
              throw new Error(`Please open the ${appName} app on your Ledger and try again.`);
            }
            throw new Error('Ledger connection lost. Please ensure the device is unlocked and connected.');
          }

          // Retry the operation after successful reconnection
          try {
            const result = await appBTC!.signMessage(adjustedPath, messageHex);
            return processResult(result);
          } catch (retryError: any) {
            const retryErrorMsg = retryError?.message || String(retryError || '');
            throw new Error(`Failed to sign message after reconnection: ${retryErrorMsg}`);
          }
        }

        // Non-connection errors
        throw new Error(`Failed to sign message: ${errorMsg}`);
      }
    },
  };
  
  return service;
}

/**
 * Get Ledger service instance (singleton)
 */
export function getLedgerService(): LedgerService {
  if (!ledgerServiceInstance) {
    ledgerServiceInstance = createRealLedgerService();
  }
  return ledgerServiceInstance;
}

/**
 * Reset Ledger service (use when you need to recreate the connection)
 */
export function resetLedgerService(): void {
  if (ledgerServiceInstance) {
    ledgerServiceInstance.disconnect().catch(() => {
      // Ignore errors
    });
  }
  ledgerServiceInstance = null;
}





