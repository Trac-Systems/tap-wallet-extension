/**
 * Trac History Component
 * Shows Trac transaction history from API
 */

import { UX } from '@/src/ui/component';
import { colors } from '@/src/ui/themes/color';
import TransactionGroup from './transaction-group';
import { useTracHistory } from '../../hooks/use-trac-history';
import { useActiveTracAddress } from '../../hook';
import {useI18n, useLocaleFormat} from '@/src/ui/i18n';

const TracHistory = () => {
  // Get active Trac address
  const tracAddress = useActiveTracAddress();
  const {t} = useI18n();
  const {formatDate} = useLocaleFormat();

  // Fetch history using custom hook
  const { transactions, loading, loadingMore, error, hasMore, loadMore } = useTracHistory(tracAddress);

  // Group transactions by date
  const groupByDate = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Map to store date -> transactions
    const dateMap = new Map<string, { label: string; timestamp: number; txs: any[] }>();

    transactions.forEach((tx) => {
      const txDate = new Date(tx.timestamp * 1000);
      const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());

      let label: string;
      let sortKey: number;

      if (txDay.getTime() === today.getTime()) {
        label = t('activity.today');
        sortKey = today.getTime();
      } else if (txDay.getTime() === yesterday.getTime()) {
        label = t('activity.yesterday');
        sortKey = yesterday.getTime();
      } else {
        label = formatDate(txDate, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        sortKey = txDay.getTime();
      }

      if (!dateMap.has(label)) {
        dateMap.set(label, { label, timestamp: sortKey, txs: [] });
      }
      dateMap.get(label)!.txs.push(tx);
    });

    // Convert to array and sort by timestamp descending (newest first)
    return Array.from(dateMap.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .reduce((acc, item) => {
        acc[item.label] = item.txs;
        return acc;
      }, {} as { [key: string]: any[] });
  };

  const groupedTransactions = groupByDate();

  // Loading state
  if (loading) {
    return (
      <UX.Box layout="column_center" spacing="xl" style={{ padding: '40px 20px' }}>
        <UX.Text
          titleKey="activity.loadingTransactions"
          styleType="body_14_normal"
          customStyles={{ color: colors.white, opacity: 0.6 }}
        />
      </UX.Box>
    );
  }

  // Error state
  if (error) {
    return (
      <UX.Box layout="column_center" spacing="xl" style={{ padding: '40px 20px' }}>
        <UX.Text
          titleKey="activity.failedLoadTransactions"
          styleType="body_14_normal"
          customStyles={{ color: colors.red_500 }}
        />
      </UX.Box>
    );
  }

  // Empty state
  if (transactions.length === 0) {
    return (
      <UX.Box layout="column_center" spacing="xl" style={{ padding: '40px 20px' }}>
        <UX.Text
          titleKey="activity.noTransactions"
          styleType="body_14_normal"
          customStyles={{ color: colors.white, opacity: 0.6 }}
        />
      </UX.Box>
    );
  }

  // Render transaction groups
  return (
    <UX.Box spacing="xl" style={{ paddingTop: '16px' }}>
      {Object.entries(groupedTransactions).map(([dateLabel, txs]) => (
        <TransactionGroup
          key={dateLabel}
          dateLabel={dateLabel}
          transactions={txs}
          transactionType="trac"
        />
      ))}

      {/* Load More Button */}
      {hasMore && !loading && transactions.length > 0 && (
        <UX.Box layout="column_center" spacing="sm" style={{ padding: '16px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <UX.Button
            titleKey={loadingMore ? 'common.loading' : 'activity.loadMore'}
            onClick={loadMore}
            isDisable={loadingMore}
            styleType="white"
            customStyles={{
              opacity: loadingMore ? 0.6 : 1,
              cursor: loadingMore ? 'not-allowed' : 'pointer',
              padding: '8px 24px',
            }}
          />
        </UX.Box>
      )}
    </UX.Box>
  );
};

export default TracHistory;
