import React from 'react';
import './index.css';
import Text from '../text-custom';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  isText?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({text, children, isText}) => {
  // Determine if content is long and needs wrapping
  // Lowered threshold to handle Bitcoin addresses (typically 34-62 chars)
  const isLongContent = text.length > 35;
  
  const tooltipClassName = isText 
    ? `tooltip-text-normal${isLongContent ? ' long-content' : ''}`
    : `tooltip-text${isLongContent ? ' long-content' : ''}`;

  return (
    <div className="tooltip-container">
      {children}
      <Text
        className={tooltipClassName}
        title={text}
        styleType="body_12_bold"
      />
    </div>
  );
};

export default Tooltip;
