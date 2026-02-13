/**
 * Transaction Group Component
 * Groups transactions by date (Today, Yesterday, DD/MM/YYYY)
 */

import { UX } from '@/src/ui/component';
import { colors } from '@/src/ui/themes/color';
import TransactionItem from './transaction-item';

interface Transaction {
  type: 'sent' | 'received' | 'contract';
  address: string;
  amount: string;
  currency: string;
  status: 'confirmed' | 'pending' | 'failed';
  txid: string;
  timestamp: number;
}

interface TransactionGroupProps {
  dateLabel: string;
  transactions: Transaction[];
  transactionType?: 'bitcoin' | 'trac';
}

const TransactionGroup = ({ dateLabel, transactions, transactionType = 'trac' }: TransactionGroupProps) => {
  if (transactions.length === 0) return null;

  return (
    <UX.Box spacing="xs" style={{ marginBottom: '16px' }}>
      {/* Date Header */}
      <UX.Text
        title={dateLabel}
        styleType="heading_18"
        customStyles={{ color: colors.smoke, marginBottom: '8px' }}
      />

      {/* Transactions List */}
      <UX.Box spacing="xs">
        {transactions.map((tx) => (
          <TransactionItem
            key={tx.txid}
            type={tx.type}
            address={tx.address}
            amount={tx.amount}
            currency={tx.currency}
            status={tx.status}
            txid={tx.txid}
            transaction={tx}
            transactionType={transactionType}
          />
        ))}
      </UX.Box>
    </UX.Box>
  );
};

export default TransactionGroup;
