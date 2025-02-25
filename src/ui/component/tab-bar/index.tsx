import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import './index.css';
import {Tab, TabContent} from './TabContent';

interface TabItem {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  isChildren?: boolean;
  parentIndex?: number;
}

const Tabs: React.FC<TabsProps> = ({tabs, isChildren, parentIndex}) => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

  const navigate = useNavigate();
  const location = useLocation();

  const handleTabClick = (index: number) => {
    setActiveTabIndex(index);
    if (isChildren) {
      navigate(`?tab=${parentIndex}&childTab=${index}`);
    } else {
      navigate(`?tab=${index}`);
    }
  };

  useEffect(() => {
    const tabIndex = isChildren
      ? new URLSearchParams(location.search).get('childTab')
      : new URLSearchParams(location.search).get('tab');

    if (tabIndex !== null) {
      setActiveTabIndex(Number(tabIndex));
    }
  }, [location.search, parentIndex]);

  return (
    <div className={isChildren ? 'sub-tabs-container' : 'tabs-container'}>
      <div className="tabs">
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            isActive={index === activeTabIndex}
            onClick={() => handleTabClick(index)}
            isChildren={isChildren}
          />
        ))}
      </div>
      <TabContent>{tabs[activeTabIndex].content}</TabContent>
    </div>
  );
};

export default Tabs;
