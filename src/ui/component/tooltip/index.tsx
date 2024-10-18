import React from 'react';
import './index.css';
import Text from '../text-custom';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  isText?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({text, children, isText}) => {
  return (
    <div className="tooltip-container">
      {children}
      <Text
        className={isText ? 'tooltip-text-normal' : 'tooltip-text'}
        title={text}
        styleType="body_12_bold"
      />
    </div>
  );
};

export default Tooltip;
