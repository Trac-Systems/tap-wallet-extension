/**
 * Transaction Item Component
 * Individual transaction row in activity list
 */

import { useNavigate } from 'react-router-dom';
import { UX } from '@/src/ui/component';
import { SVG } from '@/src/ui/svg';
import { colors } from '@/src/ui/themes/color';
import {getActivityStatusText, getActivityTypeTitleKey} from './activity-labels';

interface TransactionItemProps {
  type: 'sent' | 'received' | 'contract';
  address: string;
  amount: string;
  currency: string;
  status: string;
  txid?: string;
  transaction: any; // Full transaction object
  transactionType?: 'bitcoin' | 'trac'; // To know which type of transaction
}

const TransactionItem = ({
  type,
  address,
  amount,
  currency,
  status,
  transaction,
  transactionType = 'trac'
}: TransactionItemProps) => {
  const navigate = useNavigate();
  // Icon based on type and status
  const getIcon = () => {
    if (status === 'failed') {
      return <SVG.TransactionFailedIcon />;
    }
    if (type === 'contract') {
      return <SVG.TransactionContractIcon />;
    }
    if (type === 'sent') {
      return <SVG.TransactionSentIcon />;
    }
    return <SVG.TransactionReceivedIcon />;
  };

  const getAmountColor = () => {
    if (type === 'sent') {
      return colors.red_500;
    }
    if (type === 'contract') {
      return colors.white; // neutral for contract
    }
    return colors.green_500;
  };

  const getStatusColor = () => {
    const normalizedStatus = String(status || '').toLowerCase();
    if (['confirmed', 'completed', 'complete', 'success'].includes(normalizedStatus)) {
      return colors.green_500;
    }
    if (['failed', 'error', 'cancelled', 'canceled', 'rejected', 'expired'].includes(normalizedStatus)) {
      return colors.red_500;
    }
    return colors.yellow;
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 20) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

  const handleClick = () => {
    navigate('/activity/transaction-detail', {
      state: {
        transaction,
        type: transactionType
      }
    });
  };

  const statusText = getActivityStatusText(status);

  return (
    <UX.Box
      layout="row_between"
      spacing="xs"
      style={{
        padding: '12px 0',
        alignItems: 'center',
        cursor: 'pointer',
      }}
      onClick={handleClick}
    >
      {/* Left: Icon + Text */}
      <UX.Box layout="row" spacing="xs" style={{ alignItems: 'center', flex: 1 }}>
        {getIcon()}
        <UX.Box spacing="xss" style={{ marginLeft: '8px' }}>
          <UX.Text
            titleKey={getActivityTypeTitleKey(type)}
            styleType="body_16_bold"
            customStyles={{ color: colors.white }}
          />
          <UX.Text
            title={
              type === 'contract'
                ? truncateAddress(transaction.hash || transaction.txid || address)
                : truncateAddress(address)
            }
            styleType="body_12_normal"
            customStyles={{ color: colors.smoke }}
          />
        </UX.Box>
      </UX.Box>

      {/* Right: Amount + Status */}
      <UX.Box spacing="xss" style={{ alignItems: 'flex-end' }}>
        <UX.Text
          title={
            type === 'contract'
              ? `${amount} ${currency}`
              : `${type === 'sent' ? '-' : '+'}${amount} ${currency}`
          }
          styleType="body_16_bold"
          customStyles={{ color: getAmountColor() }}
        />
        <UX.Text
          titleKey={statusText.titleKey}
          titleParams={statusText.titleParams}
          styleType="body_12_normal"
          customStyles={{ color: getStatusColor() }}
        />
      </UX.Box>
    </UX.Box>
  );
};

export default TransactionItem;
