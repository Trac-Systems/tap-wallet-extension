import { UX } from '@/src/ui/component'
import { SVG } from '@/src/ui/svg'
import { colors } from '@/src/ui/themes/color'
import React, {ReactNode} from 'react';

interface CollapsibleListProps<T, U> {
  isExpanded: boolean;
  setIsExpanded: (boolean) => void;
  headerComponent: React.ReactNode;
  renderListItem: ({item, index}: {item: U; index: number}) => ReactNode;
  expandedData: U[];
  onExpandToggle?: () => void;
  isLoading?: boolean;
  containerStyle?: React.CSSProperties;
  expandedContentStyle?: React.CSSProperties;
}

const CollapsibleList = <T, U>({
  isExpanded,
  setIsExpanded,
  headerComponent,
  renderListItem,
  expandedData,
  onExpandToggle,
  isLoading,
  containerStyle,
  expandedContentStyle,
}: CollapsibleListProps<T, U>) => {
  const handleExpandToggle = () => {
    if (isLoading) {
      return;
    }

    setIsExpanded(!isExpanded);
    if (onExpandToggle) {
      onExpandToggle();
    }
  };

  return (
    <UX.Box
      style={{
        width: '100%',
        borderRadius: '10px',
        backgroundColor: colors.gray,
        marginTop: '12px',
        ...containerStyle,
      }}>
      <UX.Box
        layout="row_between"
        onClick={handleExpandToggle}
        style={{
          padding: '12px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          alignItems: 'center',
        }}>
        <UX.Box style={{flex: 1, display: 'flex', flexDirection: 'row'}}>
          {headerComponent}
        </UX.Box>
        <SVG.ArrowDownIcon
          color={colors.white}
          // style={{transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}}
        />
      </UX.Box>
      {isExpanded && (
        <UX.Box
          style={{
            borderTopColor: colors.white,
            borderTopWidth: '1px',
            paddingTop: '4px',
            paddingLeft: '12px',
            paddingRight: '12px',
            ...expandedContentStyle,
          }}>
          <UX.Box
            layout="row"
            style={{
              paddingTop: '12px',
              gap: '8px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}>
            {expandedData.map((item, index) => (
              <React.Fragment key={index}>
                {renderListItem({item, index})}
              </React.Fragment>
            ))}
          </UX.Box>
        </UX.Box>
      )}
    </UX.Box>
  );
};

export default CollapsibleList;