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

const TransactionDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { transaction, type } = location.state || {};
  const [isExpanded, setIsExpanded] = useState(false);

  const networkType = useAppSelector(GlobalSelector.networkType);

  if (!transaction) {
    return (
      <LayoutScreenSettings
        header={<UX.TextHeader text="Transaction Detail" />}
        body={
          <UX.Box layout="column_center" spacing="xl" style={{ padding: '40px 20px' }}>
            <UX.Text
              title="Transaction not found"
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
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const period = date.getHours() >= 12 ? 'pm' : 'am';
    const displayHours = date.getHours() % 12 || 12;
    return `${month} ${day}, ${year} at ${displayHours}:${minutes} ${period}`;
  };

  // Get icon background color
  const getIconBackground = () => {
    if (isContract) return 'rgba(59, 130, 246, 0.2)'; // Blue
    return isSent ? 'rgba(235, 87, 87, 0.2)' : 'rgba(10, 194, 133, 0.2)';
  };

  // Get title
  const getTitle = () => {
    if (isContract) return 'Contract interaction';
    return isSent ? 'Sent' : 'Received';
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
    if (transaction.status === 'confirmed') return colors.green_500;
    if (transaction.status === 'pending') return colors.yellow_500;
    return colors.red_500;
  };

  // View on explorer
  const handleViewExplorer = () => {
    let url: string;

    if (isTrac) {
      const explorerUrl = networkType === Network.TESTNET
        ? 'https://explorer-testnet.trac.network'
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

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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
                text={getTitle()}
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
                title="Date"
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
                title="Status"
                styleType="body_14_normal"
                customStyles={{ color: '#9E9E9E' }}
              />
              <UX.Text
                title={transaction.isConfirmed ? 'Confirmed' : 'Processing'}
                styleType="body_14_normal"
                customStyles={{ color: getStatusColor(), textAlign: 'right' }}
              />
            </UX.Box>

            {/* Network Fee */}
            <UX.Box layout="row_between" spacing="xs" style={{ marginTop: '16px' }}>
              <UX.Text
                title="Network Fee"
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
                  title="Total"
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
                title="Transaction ID"
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
                  onClick={() => copyToClipboard(transaction.hash)}
                  style={{ cursor: 'pointer', flexShrink: 0 }}
                >
                  <SVG.CopyPink />
                </div>
              </div>
            </UX.Box>
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
                  title="Transaction Data"
                  styleType="body_14_bold"
                  customStyles={{ color: colors.white }}
                />
                <UX.Text
                  title={isExpanded ? 'Collapse' : 'Expand'}
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
              title="View on block explorer"
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
