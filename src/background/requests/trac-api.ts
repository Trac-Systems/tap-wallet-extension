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
        if (json.result?.tx) {
          return { 
            success: true, 
            txid: json.result.tx 
          };
        }
        return { success: true, ...json };
      } else {
        return { error: json?.error || json?.result?.message || `Transaction failed with status ${response.status}` };
      }
    } catch (error: any) {
      return { error: error?.message || 'Network error occurred' };
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

  /**
   * Fetch balance for a TRAC address
   */
  static async fetchBalance(address: string, network: Network = Network.MAINNET): Promise<string> {
    try {
      const baseUrl = this.getBaseUrl(network);
      const resp = await fetch(`${baseUrl}/balance/${address}`);
      if (!resp.ok) {
        throw new Error(`Fetch /balance failed: ${resp.status}`);
      }
      const data = (await resp.json()) as {balance?: string};
      if (data?.balance === undefined) {
        throw new Error('Missing balance in response');
      }
      return data.balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  /**
   * Fetch transaction history for a TRAC address
   */
  static async getTransactionHistory(
    address: string,
    offset: number = 0,
    limit: number = 50,
    network: Network = Network.MAINNET
  ): Promise<any> {
    try {
      const explorerUrl = network === Network.TESTNET
        ? 'https://explorer-testnet.trac.network'
        : 'https://explorer.trac.network';

      const url = `${explorerUrl}/api/transactions?address=${address}&offset=${offset}&max=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Explorer API failed with status ${response.status}`);
      }

      const data = await response.json();

      // Handle different response formats
      let transactions: any[] = [];
      if (data && typeof data.transactions === 'string') {
        transactions = JSON.parse(data.transactions);
      } else if (data && Array.isArray(data.transactions)) {
        transactions = data.transactions;
      } else if (Array.isArray(data)) {
        transactions = data;
      }

      return {
        transactions,
        total: transactions.length
      };
    } catch (error) {
      console.error('[TracApi] getTransactionHistory error:', error);
      throw error;
    }
  }

  /**
   * Convert TRAC balance from wei (18 decimals) to display format
   */
  static balanceToDisplay(balance: string): string {
    if (!balance || balance === '0') return '0';
    try {
      const balanceBigInt = BigInt(balance);
      const divisor = BigInt('1000000000000000000'); // 10^18
      const quotient = balanceBigInt / divisor;
      const remainder = balanceBigInt % divisor;
      const decimalPart = remainder.toString().padStart(18, '0');
      const trimmedDecimal = decimalPart.replace(/0+$/, '');

      return trimmedDecimal === ''
        ? quotient.toString()
        : `${quotient.toString()}.${trimmedDecimal}`;
    } catch (error) {
      console.error('Error converting balance:', error);
      return '0';
    }
  }
}
