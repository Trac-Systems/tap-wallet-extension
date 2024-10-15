import React from 'react';
import './index.css';
import Text from '../text-custom';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({text, children}) => {
  return (
    <div className="tooltip-container">
      {children}
      <Text className="tooltip-text" title={text} styleType="body_12_bold" />
    </div>
  );
};

export default Tooltip;
