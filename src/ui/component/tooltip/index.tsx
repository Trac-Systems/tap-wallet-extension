import React from 'react';
import './index.css';
import Text from '../text-custom';
import {useOptionalI18n} from '../../i18n/context';
import type {TranslationParams} from '../../i18n/types';

interface TooltipProps {
  text?: string;
  textKey?: string;
  textParams?: TranslationParams;
  children: React.ReactNode;
  isText?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  text = '',
  textKey,
  textParams,
  children,
  isText,
}) => {
  const i18n = useOptionalI18n();
  const displayText = textKey && i18n ? i18n.t(textKey, textParams) : text;
  // Determine if content is long and needs wrapping
  // Lowered threshold to handle Bitcoin addresses (typically 34-62 chars)
  const isLongContent = displayText.length > 35;
  
  const tooltipClassName = isText 
    ? `tooltip-text-normal${isLongContent ? ' long-content' : ''}`
    : `tooltip-text${isLongContent ? ' long-content' : ''}`;

  return (
    <div className="tooltip-container">
      {children}
      <Text
        className={tooltipClassName}
        title={displayText}
        styleType="body_12_bold"
      />
    </div>
  );
};

export default Tooltip;
