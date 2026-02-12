/**
 * Hook to fetch Bitcoin transaction history
 */

import { useState, useEffect } from 'react';
import { mempoolApi } from '@/src/background/requests';
import { processBitcoinTransaction } from '@/src/ui/utils/bitcoin-transaction-processor';
import { useAppSelector } from '@/src/ui/utils';
import { GlobalSelector } from '@/src/ui/redux/reducer/global/selector';

export const useBitcoinHistory = (address: string) => {
  const networkType = useAppSelector(GlobalSelector.networkType);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastTxid, setLastTxid] = useState<string | undefined>();

  const fetchHistory = async (loadMore = false) => {
    if (loading || loadingMore) return;

    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Ensure mempoolApi is using the correct network
      mempoolApi.changeNetwork(networkType);

      const txs = await mempoolApi.getAddressTransactions(
        address,
        loadMore ? lastTxid : undefined
      );

      // Process transactions
      const processed = txs.map((tx: any) => processBitcoinTransaction(tx, address));

      if (loadMore) {
        setTransactions(prev => [...prev, ...processed]);
      } else {
        setTransactions(processed);
      }

      // Update pagination
      if (txs.length > 0) {
        setLastTxid(txs[txs.length - 1].txid);
        setHasMore(txs.length >= 25); // Mempool returns 25 by default
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error('Failed to fetch Bitcoin history:', err);

      // Handle specific error types
      if (err?.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else if (err?.message?.includes('Network')) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to load Bitcoin transactions. Please try again.');
      }

      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading && !loadingMore) {
      fetchHistory(true);
    }
  };

  const refresh = () => {
    setLastTxid(undefined);
    setHasMore(true);
    setTransactions([]);
    fetchHistory(false);
  };

  useEffect(() => {
    if (address && address.trim()) {
      // Reset pagination when network or address changes
      setTransactions([]);
      setLastTxid(undefined);
      setHasMore(true);
      fetchHistory(false);
    }
  }, [address, networkType]);

  return {
    transactions,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  };
};
