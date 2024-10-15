import React from 'react';
import {CSSProperties} from 'react';
import {colors} from '../../themes/color';

interface CardProps {
  children: React.ReactNode;
  preset?: string;
  selfItemsCenter?: boolean;
  style?: CSSProperties;
}

const CardApproval: React.FC<CardProps> = ({children, selfItemsCenter}) => {
  const baseStyle: CSSProperties = {
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: selfItemsCenter ? 'center' : 'flex-start',
    alignItems: 'center',
    background: colors.black_3,
  };

  return <div style={baseStyle}>{children}</div>;
};

export default CardApproval;
