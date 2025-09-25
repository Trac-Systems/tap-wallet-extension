import {UX} from '@/src/ui/component';
import {useState} from 'react';
import TapListChild from './tap-list-child';
import ModalNetworkFilter from './modal-network-filter';

interface TapListProps {
  onOpenFilter?: () => void;
  networkFilters?: {bitcoin: boolean; trac: boolean};
}

const TapList = (props: TapListProps) => {
  const { onOpenFilter, networkFilters } = props;
  const [openFilter, setOpenFilter] = useState(false);
  const [filters, setFilters] = useState<{bitcoin: boolean; trac: boolean}>(
    networkFilters || {bitcoin: true, trac: true},
  );

  const handleOpenFilter = () => {
    if (onOpenFilter) onOpenFilter();
    setOpenFilter(true);
  };

  const tabItems = [
    {content: <TapListChild onOpenFilter={handleOpenFilter} networkFilters={filters} />},
  ];

  return (
    <>
      <UX.Tabs tabs={tabItems} isChildren parentIndex={0} />
      <UX.DrawerCustom
        className="drawer-network-filter"
        direction="bottom"
        open={openFilter}
        onClose={() => setOpenFilter(false)}
      >
        <ModalNetworkFilter
          handleClose={() => setOpenFilter(false)}
          onFilterChange={setFilters}
          initialFilters={filters}
        />
      </UX.DrawerCustom>
    </>
  );
};

export default TapList;
