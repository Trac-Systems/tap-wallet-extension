import {UX} from '@/src/ui/component';
import TapListChild from './tap-list-child';

const TapList = () => {
  const tabItems = [{content: <TapListChild />}];

  return <UX.Tabs tabs={tabItems} isChildren parentIndex={0} />;
};

export default TapList;
