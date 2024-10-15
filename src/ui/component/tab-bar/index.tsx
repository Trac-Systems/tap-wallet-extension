import React, {useState} from 'react';
import './index.css';
import {Tab, TabContent} from './TabContent';

interface TabItem {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
}

const Tabs: React.FC<TabsProps> = ({tabs}) => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

  const handleTabClick = (index: number) => {
    setActiveTabIndex(index);
  };

  return (
    <div className="tabs-container">
      <div className="tabs">
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            isActive={index === activeTabIndex}
            onClick={() => handleTabClick(index)}
          />
        ))}
      </div>
      <TabContent>{tabs[activeTabIndex].content}</TabContent>
    </div>
  );
};

export default Tabs;
