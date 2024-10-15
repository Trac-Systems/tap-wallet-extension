import React from 'react';
import './index.css';
import Text from '../text-custom';
import {UX} from '..';

interface TabContentProps {
  children: React.ReactNode;
}

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const Tab: React.FC<TabProps> = ({label, isActive, onClick}) => {
  return (
    <UX.Box className={`${isActive ? 'tab-box-active' : 'tab-box'}`} onClick={onClick}>
      <Text
        styleType="body_16_bold"
        customStyles={{
          color: isActive ? '#F79E6D' : '#FFFFFFB0',
        }}
        title={label}
        className={`tab-label ${isActive ? 'active' : ''}`}
      />
    </UX.Box>
  );
};

export const TabContent: React.FC<TabContentProps> = ({children}) => {
  return <div className="tab-content">{children}</div>;
};
