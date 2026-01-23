import { useEffect, useState } from 'react';
import { useWalletProvider } from '@/src/ui/gateway/wallet-provider';

interface UseBtcUsdPriceOptions {
  amount: number;
  enabled?: boolean;
}

interface UseBtcUsdPriceReturn {
  usdValue: string;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook to fetch and format BTC USD price
 *
 * @param options Configuration object
 * @param options.amount - BTC amount to calculate USD value for
 * @param options.enabled - Whether to fetch the price (default: true)
 *
 * @returns Object containing usdValue, isLoading, and error
 *
 * @example
 * ```tsx
 * const { usdValue, isLoading } = useBtcUsdPrice({
 *   amount: 0.001
 * });
 *
 * if (!isLoading) {
 *   return <div>≈ {usdValue} USD</div>;
 * }
 * ```
 */
export function useBtcUsdPrice({
  amount,
  enabled = true,
}: UseBtcUsdPriceOptions): UseBtcUsdPriceReturn {
  const wallet = useWalletProvider();
  const [usdValue, setUsdValue] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Reset if not enabled or amount is 0
    if (!enabled || isNaN(amount) || amount === 0) {
      setUsdValue('0.00');
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    wallet
      .getUSDPrice(amount)
      .then((price) => {
        if (!cancelled) {
          // getUSDPrice already returns a formatted string with toFixed(2)
          setUsdValue(typeof price === 'string' ? price : String(price));
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setUsdValue('0.00');
          setError(err instanceof Error ? err : new Error('Failed to fetch BTC USD price'));
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
  }, [amount, enabled, wallet]);

  return {
    usdValue,
    isLoading,
    error,
  };
}
