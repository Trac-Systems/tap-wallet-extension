import {UX} from '@/src/ui/component';
import TapListChild from './tap-list-child';

interface TapListProps {
  onOpenFilter?: () => void;
  networkFilters?: {bitcoin: boolean; trac: boolean};
}

const TapList = (props: TapListProps) => {
  const { onOpenFilter, networkFilters } = props;
  const tabItems = [{content: <TapListChild onOpenFilter={onOpenFilter} networkFilters={networkFilters} />}];

  return <UX.Tabs tabs={tabItems} isChildren parentIndex={0} />;
};

export default TapList;
