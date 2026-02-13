/**
 * Custom hook for fetching Trac transaction history
 */

import { useState, useEffect } from 'react';
import { TracApi } from '@/src/background/requests/trac-api';
import { processTracTransaction } from '@/src/ui/utils/trac-transaction-processor';
import { useAppSelector } from '@/src/ui/utils';
import { GlobalSelector } from '@/src/ui/redux/reducer/global/selector';

export const useTracHistory = (address: string) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const LIMIT = 50;

  const networkType = useAppSelector(GlobalSelector.networkType);

  const fetchHistory = async (loadMore = false) => {
    if (!address) return;

    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setOffset(0);
      setHasMore(true);
    }
    setError(null);

    try {
      const currentOffset = loadMore ? offset : 0;

      const result = await TracApi.getTransactionHistory(
        address,
        currentOffset,
        LIMIT,
        networkType
      );

      // Process transactions
      const processed = result.transactions.map((tx: any) =>
        processTracTransaction(tx, address)
      );

      if (loadMore) {
        setTransactions(prev => [...prev, ...processed]);
      } else {
        setTransactions(processed);
      }

      // Update pagination state
      const newOffset = currentOffset + processed.length;
      setOffset(newOffset);
      setHasMore(processed.length >= LIMIT);
    } catch (err: any) {
      console.error('[useTracHistory] Error:', err);
      setError(err.message || 'Failed to load Trac transactions');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchHistory(true);
    }
  };

  useEffect(() => {
    fetchHistory(false);
  }, [address, networkType]);

  return {
    transactions,
    loading,
    loadingMore,
    error,
    hasMore,
    refresh: () => fetchHistory(false),
    loadMore,
  };
};
