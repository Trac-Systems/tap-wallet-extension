/**
 * TRAC API - Handles all external TRAC API calls
 */

export interface BroadcastResponse {
  success?: boolean;
  error?: string;
  txid?: string;
}

export interface ValidityResponse {
  validityHex: string;
}

export class TracApi {
  private static readonly BROADCAST_URL = 'http://trac.intern.ungueltig.com:1337/broadcast-transaction';
  
  /**
   * Broadcast transaction to TRAC network
   */
  static async broadcastTransaction(payload: string): Promise<BroadcastResponse> {
    try {
      const response = await fetch(this.BROADCAST_URL, {
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
   * Fetch transaction validity from TRAC network
   */
  static async fetchTransactionValidity(): Promise<string> {
    try {
      const resp = await fetch('http://trac.intern.ungueltig.com:1337/txv');
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
