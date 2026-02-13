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

const BitcoinHistory = () => {
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const address = activeAccount?.address || '';

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
        label = 'Today';
      } else if (txDay.getTime() === yesterday.getTime()) {
        label = 'Yesterday';
      } else {
        const day = String(txDate.getDate()).padStart(2, '0');
        const month = String(txDate.getMonth() + 1).padStart(2, '0');
        const year = txDate.getFullYear();
        label = `${day}/${month}/${year}`;
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
          title="Loading transactions..."
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
          title="No transactions yet"
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
            title={loadingMore ? 'Loading...' : 'Load More'}
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
