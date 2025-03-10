import React from 'react';
import './index.css';
import Text from '../text-custom';
import {UX} from '..';
import {colors} from '../../themes/color';

interface TabContentProps {
  children: React.ReactNode;
  className?: string;
}

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  isChildren?: boolean;
}

export const Tab: React.FC<TabProps> = ({
  label,
  isActive,
  onClick,
  isChildren,
}) => {
  if (!label) {
    return <></>;
  }
  return (
    <UX.Box
      className={`${isActive ? (isChildren ? 'sub-tab-active' : 'tab-box-active') : isChildren ? 'sub-tab' : 'tab-box'}`}
      onClick={onClick}>
      <Text
        styleType={isChildren ? 'body_14_normal' : 'body_16_bold'}
        customStyles={{
          color: isActive
            ? isChildren
              ? colors.main_500
              : '#F79E6D'
            : '#FFFFFFB0',
        }}
        title={label}
        className={`tab-label ${isActive ? (isChildren ? 'sub-active' : 'active') : isChildren ? 'sub' : ''}`}
      />
    </UX.Box>
  );
};

export const TabContent: React.FC<TabContentProps> = ({
  children,
  className,
}) => {
  return <div className={className}>{children}</div>;
};
