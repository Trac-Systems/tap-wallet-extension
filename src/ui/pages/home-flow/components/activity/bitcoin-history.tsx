/**
 * Bitcoin History Component
 * Shows Bitcoin transaction history from real API
 */

import { UX } from '@/src/ui/component';
import { useAppSelector } from '@/src/ui/utils';
import { AccountSelector } from '@/src/ui/redux/reducer/account/selector';
import TransactionGroup from './transaction-group';
import { useBitcoinHistory } from '../../hooks/use-bitcoin-history';
import { colors } from '@/src/ui/themes/color';
import {useI18n, useLocaleFormat} from '@/src/ui/i18n';

const BitcoinHistory = () => {
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const address = activeAccount?.address || '';
  const {t} = useI18n();
  const {formatDate} = useLocaleFormat();

  const { transactions, loading, loadingMore, error, hasMore, loadMore } = useBitcoinHistory(address);

  // Group transactions by date
  const groupByDate = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { [key: string]: typeof transactions } = {};

    transactions.forEach((tx) => {
      const txDate = new Date(tx.timestamp * 1000);
      const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());

      let label: string;
      if (txDay.getTime() === today.getTime()) {
        label = t('activity.today');
      } else if (txDay.getTime() === yesterday.getTime()) {
        label = t('activity.yesterday');
      } else {
        label = formatDate(txDate, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(tx);
    });

    return groups;
  };

  const groupedTransactions = groupByDate();

  // Loading state
  if (loading && transactions.length === 0) {
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
  if (error && transactions.length === 0) {
    return (
      <UX.Box layout="column_center" spacing="xl" style={{ padding: '40px 20px' }}>
        <UX.Text
          title={error}
          styleType="body_14_normal"
          customStyles={{ color: colors.red_500 }}
        />
      </UX.Box>
    );
  }

  // Empty state
  if (!loading && transactions.length === 0) {
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

  return (
    <UX.Box spacing="xl" style={{ paddingTop: '16px' }}>
      {Object.entries(groupedTransactions).map(([dateLabel, txs]) => (
        <TransactionGroup
          key={dateLabel}
          dateLabel={dateLabel}
          transactions={txs}
          transactionType="bitcoin"
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
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          />
        </UX.Box>
      )}
    </UX.Box>
  );
};

export default BitcoinHistory;
