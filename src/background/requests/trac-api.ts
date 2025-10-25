/**
 * TRAC API - Handles all external TRAC API calls
 */

import { TRAC_BASE_URL_MAINNET, TRAC_BASE_URL_TESTNET } from '../constants/trac-api';
import { Network } from '../../wallet-instance';

export interface BroadcastResponse {
  success?: boolean;
  error?: string;
  txid?: string;
}

export interface ValidityResponse {
  validityHex: string;
}

export interface FeeResponse {
  fee: string;
}

export class TracApi {
  /**
   * Get the appropriate API base URL based on network type
   */
  private static getBaseUrl(network: Network = Network.MAINNET): string {
    return network === Network.TESTNET ? TRAC_BASE_URL_TESTNET : TRAC_BASE_URL_MAINNET;
  }

  /**
   * Broadcast transaction to TRAC network
   */
  static async broadcastTransaction(payload: string, network: Network = Network.MAINNET): Promise<BroadcastResponse> {
    try {
      const baseUrl = this.getBaseUrl(network);
      const response = await fetch(`${baseUrl}/broadcast-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      });
      
      const json = await response.json().catch(() => ({}));
      
      if (response.ok) {
        return { success: true, ...json };
      } else {
        return { error: json?.error || 'Transaction failed' };
      }
    } catch (error) {
      return { error: 'Network error occurred' };
    }
  }
  
  /**
   * Fetch transaction fee from TRAC network
   */
  static async fetchTransactionFee(network: Network = Network.MAINNET): Promise<string> {
    try {
      const baseUrl = this.getBaseUrl(network);
      const resp = await fetch(`${baseUrl}/fee`);
      if (!resp.ok) {
        throw new Error(`Fetch /fee failed: ${resp.status}`);
      }
      const data = (await resp.json()) as FeeResponse;
      if (!data?.fee) {
        throw new Error('Missing fee in response');
      }
      return data.fee;
    } catch (error) {
      console.error('Error fetching fee:', error);
      throw error;
    }
  }
  
  /**
   * Fetch transaction validity from TRAC network
   */
  static async fetchTransactionValidity(network: Network = Network.MAINNET): Promise<string> {
    try {
      const baseUrl = this.getBaseUrl(network);
      const resp = await fetch(`${baseUrl}/txv`);
      if (!resp.ok) {
        throw new Error(`Fetch /txv failed: ${resp.status}`);
      }
      const data = (await resp.json()) as {txv?: string};
      if (!data?.txv) {
        throw new Error('Missing txv in response');
      }
      return data.txv;
    } catch (error) {
      console.error('Error fetching validity:', error);
      throw error;
    }
  }
}
