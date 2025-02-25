import {UX} from '@/src/ui/component';
import TapListChild from './tap-list-child';
import DmtCollection from './dmt-collection';

const TapList = () => {
  const tabItems = [
    {label: 'All', content: <TapListChild />},
    {
      label: 'DMT collections',
      content: <DmtCollection />,
    },
  ];

  return <UX.Tabs tabs={tabItems} isChildren parentIndex={0} />;
};

export default TapList;
