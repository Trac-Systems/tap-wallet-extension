import {colors} from '../../themes/color';
import {spaces} from '../../themes/space';
import React, {CSSProperties, ReactNode} from 'react';
const row_center: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
const row_end: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
};
const column_center: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};
const column: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};
const box: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '16px',
  padding: '16px',
  background: colors.black_2,
};
const box_border: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: '10px',
  padding: '16px',
  background: colors.black_2,
  border: '1px solid #545454',
};
const row: CSSProperties = {
  display: 'flex',
};
const row_between: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};
const grid_column_2: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
};
interface BoxProps {
  children?: ReactNode;
  layout?:
    | 'row_center'
    | 'row_end'
    | 'column_center'
    | 'row_between'
    | 'column'
    | 'column'
    | 'row'
    | 'grid_column_2'
    | 'box'
    | 'box_border';
  spacing?: keyof typeof spaces;
  style?: CSSProperties;
  onClick?: (e?: any) => void;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}
const Box: React.FC<BoxProps> = ({
  children,
  onClick,
  layout,
  spacing,
  className,
  style,
  ref,
}) => {
  let layoutStyles: CSSProperties;
  switch (layout) {
    case 'row_center':
      layoutStyles = row_center;
      break;
    case 'row_between':
      layoutStyles = row_between;
      break;
    case 'row_end':
      layoutStyles = row_end;
      break;
    case 'row':
      layoutStyles = row;
      break;
    case 'column_center':
      layoutStyles = column_center;
      break;
    case 'grid_column_2':
      layoutStyles = grid_column_2;
      break;
    case 'box':
      layoutStyles = box;
      break;
    case 'box_border':
      layoutStyles = box_border;
      break;
    default:
      layoutStyles = column;
      break;
  }
  return (
    <div
      ref={ref}
      className={className}
      onClick={onClick}
      style={{
        ...layoutStyles,
        gap: spacing ? spaces[spacing] : undefined,
        ...style,
        position: 'relative'
      }}>
      {children}
    </div>
  );
};
export default Box;
