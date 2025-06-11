import {UX} from '@/src/ui/component';
import { SVG } from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {shortAddress} from '@/src/ui/utils';
import React, {useState} from 'react';

interface TransferItem {
  tick?: string;
  amt?: string;
  address?: string;
  filename?: string;
  [key: string]: any;
}

interface TransferPreviewTableProps {
  items: TransferItem[];
  showHeaders?: boolean;
  maxVisibleItems?: number;
  customHeaders?: {
    token?: string;
    amount?: string;
    receiver?: string;
  };
  compact?: boolean;
  enableToggle?: boolean;
}

const TransferPreviewTable: React.FC<TransferPreviewTableProps> = ({
  items = [],
  showHeaders = true,
  maxVisibleItems = 3,
  customHeaders = {
    token: 'Token',
    amount: 'Amount',
    receiver: 'Receiver',
  },
  compact = false,
  enableToggle = true,
}) => {
  const [showAllItems, setShowAllItems] = useState(false);

  const handleToggleShowAll = () => {
    setShowAllItems(!showAllItems);
  };
  const truncateText = (text: string, maxLength = 10) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const renderTokenRow = (item: TransferItem, index: number) => {
    const tokenName = item.tick || item.filename || '';
    const amount = item.amt || '';
    const address = item.address || '';

    return (
      <UX.Box key={index} style={{width: '100%'}}>
        <UX.Box
          layout="row"
          spacing="sm"
          style={{alignItems: 'center', gap: '6px'}}>
          {/* Token Name Column */}
          <UX.Box style={{flex: 1.2, minWidth: '80px'}}>
            <UX.Box
              style={{
                padding: compact ? '6px' : '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                minHeight: compact ? '32px' : '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <UX.Tooltip text={tokenName || 'No token name'} isText>
                <UX.Text
                  title={truncateText(tokenName, 8)}
                  styleType={compact ? 'body_12_bold' : 'body_14_bold'}
                  customStyles={{color: 'white'}}
                />
              </UX.Tooltip>
            </UX.Box>
          </UX.Box>

          {/* Amount Column - only show if amount exists */}
          {amount && (
            <UX.Box style={{flex: 1.3, minWidth: '90px'}}>
              <UX.Box
                style={{
                  padding: compact ? '6px' : '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  minHeight: compact ? '32px' : '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <UX.Tooltip text={amount?.toString() || 'No amount'} isText>
                  <UX.Text
                    title={truncateText(amount?.toString(), 12)}
                    styleType={compact ? 'body_12_bold' : 'body_14_bold'}
                    customStyles={{color: 'white'}}
                  />
                </UX.Tooltip>
              </UX.Box>
            </UX.Box>
          )}

          {/* Receiver Column - only show if address exists */}
          {address && (
            <UX.Box style={{flex: 1.5, minWidth: '100px'}}>
              <UX.Box
                style={{
                  padding: compact ? '6px' : '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  minHeight: compact ? '32px' : '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <UX.Tooltip text={address || 'No address'} isText>
                  <UX.Text
                    title={shortAddress(address, 6)}
                    styleType={compact ? 'body_12_bold' : 'body_14_bold'}
                    customStyles={{color: 'white'}}
                  />
                </UX.Tooltip>
              </UX.Box>
            </UX.Box>
          )}
        </UX.Box>
      </UX.Box>
    );
  };

  const visibleItems = showAllItems ? items : items.slice(0, maxVisibleItems);
  const hasMoreItems = items.length > maxVisibleItems;

  return (
    <UX.Box layout="column" spacing="sm" style={{width: '100%'}}>
      {/* Table Header */}
      {showHeaders && (
        <UX.Box
          layout="row"
          spacing="sm"
          style={{
            alignItems: 'center',
            gap: '6px',
            paddingBottom: '8px',
            borderBottom: `1px solid ${colors.gray}`,
          }}>
          <UX.Box style={{flex: 1.2, minWidth: '80px'}}>
            <UX.Box
              style={{
                padding: compact ? '6px' : '8px',
                minHeight: compact ? '32px' : '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <UX.Text
                title={customHeaders.token}
                styleType={compact ? 'body_12_bold' : 'body_14_bold'}
                customStyles={{color: 'white'}}
              />
            </UX.Box>
          </UX.Box>

          {/* Only show Amount header if any item has amount */}
          {items.some(item => item.amt) && (
            <UX.Box style={{flex: 1.3, minWidth: '90px'}}>
              <UX.Box
                style={{
                  padding: compact ? '6px' : '8px',
                  minHeight: compact ? '32px' : '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <UX.Text
                  title={customHeaders.amount}
                  styleType={compact ? 'body_12_bold' : 'body_14_bold'}
                  customStyles={{color: 'white'}}
                />
              </UX.Box>
            </UX.Box>
          )}

          {/* Only show Receiver header if any item has address */}
          {items.some(item => item.address) && (
            <UX.Box style={{flex: 1.5, minWidth: '100px'}}>
              <UX.Box
                style={{
                  padding: compact ? '6px' : '8px',
                  minHeight: compact ? '32px' : '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <UX.Text
                  title={customHeaders.receiver}
                  styleType={compact ? 'body_12_bold' : 'body_14_bold'}
                  customStyles={{color: 'white'}}
                />
              </UX.Box>
            </UX.Box>
          )}
        </UX.Box>
      )}

      {/* Table Rows */}
      {visibleItems.map((item, index) => renderTokenRow(item, index))}

      {/* Show All Toggle */}
      {hasMoreItems && enableToggle && (
        <UX.Box
          layout="row"
          spacing="xss"
          style={{cursor: 'pointer'}}
          onClick={handleToggleShowAll}>
          <UX.Box layout="row" spacing="xss">
            {showAllItems ? (
              <SVG.ArrowUpIcon
                width={16}
                height={16}
              />
            ) : (
              <SVG.ArrowRightIcon
                width={16}
                height={16}
              />
            )}
          </UX.Box>
          <UX.Text
            styleType={'body_14_bold'}
            title={
              showAllItems ? 'Show less' : `Show all ${items.length} items`
            }
            customStyles={{color: colors.main_500}}
          />
        </UX.Box>
      )}
    </UX.Box>
  );
};

export default TransferPreviewTable;
