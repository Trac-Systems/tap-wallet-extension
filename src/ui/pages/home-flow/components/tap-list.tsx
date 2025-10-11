import {UX} from '@/src/ui/component';
import {useState, useEffect} from 'react';
import TapListChild from './tap-list-child';
import ModalNetworkFilter from './modal-network-filter';

interface TapListProps {
  onOpenFilter?: () => void;
  onFilterChange?: (filters: {bitcoin: boolean; trac: boolean}) => void;
  networkFilters?: {bitcoin: boolean; trac: boolean};
}

const TapList = (props: TapListProps) => {
  const { onOpenFilter, onFilterChange, networkFilters } = props;
  const [openFilter, setOpenFilter] = useState(false);
  const [filters, setFilters] = useState<{bitcoin: boolean; trac: boolean}>(
    networkFilters || {bitcoin: true, trac: true},
  );

  // Sync local filters with networkFilters from props (background service)
  useEffect(() => {
    if (networkFilters) {
      setFilters(networkFilters);
    }
  }, [networkFilters]);

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
          onFilterChange={(newFilters) => {
            setFilters(newFilters);
            onFilterChange?.(newFilters);
          }}
          initialFilters={filters}
        />
      </UX.DrawerCustom>
    </>
  );
};

export default TapList;
