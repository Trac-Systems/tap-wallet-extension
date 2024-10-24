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
}

const Tabs: React.FC<TabsProps> = ({tabs}) => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const navigate = useNavigate();
  const location = useLocation();
  const tabFromUrl = new URLSearchParams(location.search).get('tab');

  const handleTabClick = (index: number) => {
    navigate(`?tab=${index}`);
    setActiveTabIndex(index);
  };

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTabIndex(Number(tabFromUrl));
    }
  }, [tabFromUrl]);

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
