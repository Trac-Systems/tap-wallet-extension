/**
 * Transaction Detail Page
 * Shows detailed information for a selected transaction
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UX } from '@/src/ui/component';
import { colors } from '@/src/ui/themes/color';
import LayoutScreenSettings from '../../layouts/settings';
import { SVG } from '@/src/ui/svg';
import { useAppSelector } from '@/src/ui/utils';
import { GlobalSelector } from '@/src/ui/redux/reducer/global/selector';
import { Network } from '@/src/wallet-instance';
import { useCustomToast } from '../../component/toast-custom';
import { copyToClipboard } from '../../helper';
import {useLocaleFormat} from '../../i18n';
import {getActivityStatusText} from '../home-flow/components/activity/activity-labels';

const TransactionDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { transaction, type } = location.state || {};
  const [isExpanded, setIsExpanded] = useState(false);
  const { showToast } = useCustomToast();
  const {formatDate} = useLocaleFormat();

  const networkType = useAppSelector(GlobalSelector.networkType);

  if (!transaction) {
    return (
      <LayoutScreenSettings
        header={<UX.TextHeader textKey="activity.transactionDetail" />}
        body={
          <UX.Box layout="column_center" spacing="xl" style={{ padding: '40px 20px' }}>
            <UX.Text
              titleKey="activity.transactionNotFound"
              styleType="body_14_normal"
              customStyles={{ color: colors.white }}
            />
          </UX.Box>
        }
      />
    );
  }

  const isTrac = type === 'trac';
  const isContract = isTrac && transaction.type === 'contract';
  const isSent = transaction.type === 'sent';

  // Format date
  const getFormattedDate = () => {
    const date = new Date(transaction.timestamp * 1000);
    return formatDate(date, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Get icon background color
  const getIconBackground = () => {
    if (isContract) return 'rgba(59, 130, 246, 0.2)'; // Blue
    return isSent ? 'rgba(235, 87, 87, 0.2)' : 'rgba(10, 194, 133, 0.2)';
  };

  // Get title
  const getTitleKey = () => {
    if (isContract) return 'activity.contractInteraction';
    return isSent ? 'activity.sent' : 'activity.received';
  };

  // Get amount display
  const getAmountDisplay = () => {
    if (isContract) {
      return `0 ${transaction.currency}`;
    }
    const sign = isSent ? '-' : '+';
    return `${sign}${transaction.amount} ${transaction.currency}`;
  };

  // Get status text and color
  const getStatusColor = () => {
    const normalizedStatus = String(
      transaction.status || (transaction.isConfirmed ? 'confirmed' : 'pending'),
    ).toLowerCase();

    if (['confirmed', 'completed', 'complete', 'success'].includes(normalizedStatus)) {
      return colors.green_500;
    }
    if (['failed', 'error', 'cancelled', 'canceled', 'rejected', 'expired'].includes(normalizedStatus)) {
      return colors.red_500;
    }
    return colors.yellow_500;
  };

  // View on explorer
  const handleViewExplorer = () => {
    let url: string;

    if (isTrac) {
      const explorerUrl = networkType === Network.TESTNET
        ? 'https://testnet.trac.network'
        : 'https://explorer.trac.network';
      url = `${explorerUrl}/tx/${transaction.hash}`;
    } else {
      // Bitcoin - link to Mempool.space
      const mempoolUrl = networkType === Network.TESTNET
        ? 'https://mempool.space/testnet'
        : 'https://mempool.space';
      url = `${mempoolUrl}/tx/${transaction.txid || transaction.hash}`;
    }

    window.open(url, '_blank');
  };

  const handleCopy = (text: string) => {
    copyToClipboard(text).then(() => {
      showToast({
        type: 'copied',
        titleKey: 'common.copied',
      });
    });
  };

  const statusText = getActivityStatusText(
    transaction.status || (transaction.isConfirmed ? 'confirmed' : 'pending'),
  );

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .transaction-detail-page .footer_setting {
          display: none !important;
        }
      `}</style>
      <div className="transaction-detail-page">
        <LayoutScreenSettings
          header={
            <UX.Box style={{ padding: '0 24px' }}>
              <UX.TextHeader
                textKey={getTitleKey()}
                onBackClick={() => navigate(-1)}
              />
            </UX.Box>
          }
          body={
            <UX.Box layout="column" spacing="xl" style={{ padding: '32px 24px' }}>
              {/* Icon */}
          <UX.Box layout="column_center" spacing="xs">
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50px',
                backgroundColor: getIconBackground(),
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {isContract ? (
                <SVG.TransactionContractIcon />
              ) : isSent ? (
                <SVG.TransactionSentIcon />
              ) : (
                <SVG.TransactionReceivedIcon />
              )}
            </div>
          </UX.Box>

          {/* Amount */}
          <UX.Box layout="column_center" spacing="xs" style={{ marginTop: '16px' }}>
            <UX.Text
              title={getAmountDisplay()}
              styleType="heading_24"
              customStyles={{ color: colors.white, fontWeight: 'bold' }}
            />
          </UX.Box>

          {/* Transaction Info Block */}
          <UX.Box
            layout="column"
            spacing="xs"
            style={{
              backgroundColor: '#1E1E1E',
              borderRadius: '16px',
              padding: '16px',
              marginTop: '24px',
            }}
          >
            {/* Date */}
            <UX.Box layout="row_between" spacing="xs" style={{ marginTop: '16px' }}>
              <UX.Text
                titleKey="activity.date"
                styleType="body_14_normal"
                customStyles={{ color: '#9E9E9E' }}
              />
              <UX.Text
                title={getFormattedDate()}
                styleType="body_14_normal"
                customStyles={{ color: colors.white, textAlign: 'right' }}
              />
            </UX.Box>

            {/* Status */}
            <UX.Box layout="row_between" spacing="xs" style={{ marginTop: '16px' }}>
              <UX.Text
                titleKey="activity.status"
                styleType="body_14_normal"
                customStyles={{ color: '#9E9E9E' }}
              />
              <UX.Text
                titleKey={statusText.titleKey}
                titleParams={statusText.titleParams}
                styleType="body_14_normal"
                customStyles={{ color: getStatusColor(), textAlign: 'right' }}
              />
            </UX.Box>

            {/* Network Fee */}
            <UX.Box layout="row_between" spacing="xs" style={{ marginTop: '16px' }}>
              <UX.Text
                titleKey="transaction.networkFee"
                styleType="body_14_normal"
                customStyles={{ color: '#9E9E9E' }}
              />
              <UX.Text
                title={
                  isTrac
                    ? `${transaction.fee && transaction.fee !== '0' ? transaction.fee : '0.03'} TNK`
                    : `${transaction.fee || '0'} BTC`
                }
                styleType="body_14_normal"
                customStyles={{ color: colors.white, textAlign: 'right' }}
              />
            </UX.Box>

            {/* Total */}
            {isTrac && (
              <UX.Box layout="row_between" spacing="xs" style={{ marginTop: '16px' }}>
                <UX.Text
                  titleKey="transaction.total"
                  styleType="body_14_normal"
                  customStyles={{ color: '#9E9E9E' }}
                />
                <UX.Text
                  title={
                    (() => {
                      const fee = transaction.fee && transaction.fee !== '0' ? parseFloat(transaction.fee) : 0.03;
                      const amount = transaction.amount ? parseFloat(transaction.amount) : 0;
                      const total = amount + fee;
                      return `${total.toFixed(8)} ${isContract ? 'TNK' : transaction.currency}`;
                    })()
                  }
                  styleType="body_14_normal"
                  customStyles={{ color: colors.white, textAlign: 'right' }}
                />
              </UX.Box>
            )}

            {/* Transaction ID */}
            <UX.Box layout="row_between" spacing="xs" style={{ marginTop: '16px' }}>
              <UX.Text
                titleKey="transaction.id"
                styleType="body_14_normal"
                customStyles={{ color: '#9E9E9E', flex: '0 0 auto' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                <UX.Text
                  title={transaction.hash}
                  styleType="body_14_normal"
                  customStyles={{
                    color: colors.white,
                    textAlign: 'right',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '150px',
                  }}
                />
                <div
                  onClick={() => handleCopy(transaction.hash)}
                  style={{ cursor: 'pointer', flexShrink: 0 }}
                >
                  <SVG.CopyPink />
                </div>
              </div>
            </UX.Box>

            {/* Subnet - only show for contract interactions */}
            {isTrac && isContract && (transaction.rawData?.bs || transaction.bs) && (
              <UX.Box layout="row_between" spacing="xs" style={{ marginTop: '16px' }}>
                <UX.Text
                  titleKey="activity.subnet"
                  styleType="body_14_normal"
                  customStyles={{ color: '#9E9E9E', flex: '0 0 auto' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                  <UX.Text
                    title={transaction.rawData?.bs || transaction.bs}
                    styleType="body_14_normal"
                    customStyles={{
                      color: colors.white,
                      textAlign: 'right',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '150px',
                    }}
                  />
                  <div
                    onClick={() => handleCopy(transaction.rawData?.bs || transaction.bs)}
                    style={{ cursor: 'pointer', flexShrink: 0 }}
                  >
                    <SVG.CopyPink />
                  </div>
                </div>
              </UX.Box>
            )}
          </UX.Box>

          {/* Transaction Data for Contract */}
          {isTrac && isContract && (
            <UX.Box
              layout="column"
              spacing="xs"
              style={{
                backgroundColor: '#1E1E1E',
                borderRadius: '16px',
                padding: '16px',
                marginTop: '12px',
              }}
            >
              {/* Header with Expand button */}
              <UX.Box layout="row_between" spacing="xs" style={{ alignItems: 'center' }}>
                <UX.Text
                  titleKey="transaction.data"
                  styleType="body_14_bold"
                  customStyles={{ color: colors.white }}
                />
                <UX.Text
                  titleKey={isExpanded ? 'common.collapse' : 'common.expand'}
                  styleType="body_12_normal"
                  customStyles={{
                    color: colors.green_500,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                  onClick={() => setIsExpanded(!isExpanded)}
                />
              </UX.Box>

              {/* JSON Content */}
              <UX.Box
                style={{
                  marginTop: '12px',
                  backgroundColor: '#0A0A0A',
                  borderRadius: '8px',
                  padding: '12px',
                  maxHeight: isExpanded ? '600px' : '200px',
                  overflow: 'auto',
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    lineHeight: '1.5',
                    color: '#E0E0E0',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {JSON.stringify(transaction.rawData || transaction, null, 2)}
                </pre>
              </UX.Box>
            </UX.Box>
          )}

          {/* View on Explorer Button */}
          <UX.Box layout="column_center" spacing="xs" style={{ marginTop: '24px', width: '100%' }}>
            <UX.Button
              titleKey="transaction.viewOnBlockExplorer"
              onClick={handleViewExplorer}
              styleType="white"
              customStyles={{
                width: '100%',
                borderColor: '#333333',
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            />
              </UX.Box>
            </UX.Box>
          }
        />
      </div>
    </div>
  );
};

export default TransactionDetail;
