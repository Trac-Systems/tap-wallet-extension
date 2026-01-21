import { useEffect, useState } from 'react';
import { useWalletProvider } from '@/src/ui/gateway/wallet-provider';
import { isSupportedToken, getApiTicker } from '@/src/shared/constants/token-price';

interface UseTokenUSDPriceOptions {
  ticker: string;
  amount: number;
  enabled?: boolean;
}

interface UseTokenUSDPriceReturn {
  usdValue: string;
  isLoading: boolean;
  error: Error | null;
  isSupported: boolean;
}

/**
 * Custom hook to fetch and format USD price for supported tokens
 *
 * @param options Configuration object
 * @param options.ticker - Token ticker (can be display name like 'TNK' or API ticker like 'TRAC')
 * @param options.amount - Token amount to calculate USD value for
 * @param options.enabled - Whether to fetch the price (default: true)
 *
 * @returns Object containing usdValue, isLoading, error, and isSupported flags
 *
 * @example
 * ```tsx
 * const { usdValue, isLoading, isSupported } = useTokenUSDPrice({
 *   ticker: 'TAP',
 *   amount: 100.5
 * });
 *
 * if (isSupported && !isLoading && usdValue) {
 *   return <div>≈ {usdValue} USD</div>;
 * }
 * ```
 */
export function useTokenUSDPrice({
  ticker,
  amount,
  enabled = true,
}: UseTokenUSDPriceOptions): UseTokenUSDPriceReturn {
  const wallet = useWalletProvider();
  const [usdValue, setUsdValue] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Check if token is supported (handles both display names like TNK and API tickers like TRAC)
  const isSupported = isSupportedToken(ticker);
  // Convert display name (TNK) to API ticker (TRAC) for API calls
  const apiTicker = getApiTicker(ticker);

  useEffect(() => {
    let cancelled = false;

    // Reset state if not supported or not enabled
    if (!isSupported || !enabled) {
      setUsdValue('0.00');
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    wallet
      .getTokenUSDPrice(apiTicker as 'TAP' | 'DMT-NAT' | 'TRAC', amount)
      .then((val) => {
        if (!cancelled) {
          setUsdValue(val);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setUsdValue('0.00');
          setError(err instanceof Error ? err : new Error('Failed to fetch USD price'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ticker, apiTicker, amount, isSupported, enabled, wallet]);

  return {
    usdValue,
    isLoading,
    error,
    isSupported,
  };
}
