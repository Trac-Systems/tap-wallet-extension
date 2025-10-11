import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {useState, useEffect} from 'react';
import {useActiveTracAddress, useIsTracSingleWallet} from '@/src/ui/pages/home-flow/hook';

interface ModalNetworkFilterProps {
  handleClose: () => void;
  onFilterChange?: (filters: {bitcoin: boolean; trac: boolean}) => void;
  initialFilters?: {bitcoin: boolean; trac: boolean};
}

export default function ModalNetworkFilter(props: ModalNetworkFilterProps) {
  const {handleClose, onFilterChange, initialFilters} = props;
  const [filters, setFilters] = useState({
    bitcoin: initialFilters?.bitcoin ?? true,
    trac: initialFilters?.trac ?? true,
  });
  const tracAddress = useActiveTracAddress();
  const hasTrac = !!tracAddress;
  const isTracSingle = useIsTracSingleWallet();

  // Sync filters with initialFilters when modal opens or initialFilters change
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  const handleFilterChange = (network: 'bitcoin' | 'trac') => {
    const newFilters = {
      ...filters,
      [network]: !filters[network],
    };
    setFilters(newFilters);
  };

  const handleSelectAll = () => {
    const allSelected = filters.bitcoin && (hasTrac ? filters.trac : true);
    const newFilters = {
      bitcoin: !allSelected,
      trac: hasTrac ? !allSelected : false,
    };
    setFilters(newFilters);
  };

  const handleSave = () => {
    // Do not allow saving when no visible network is selected
    const noneSelected = !filters.bitcoin && (!hasTrac || !filters.trac);
    if (noneSelected) return;
    onFilterChange?.(filters);
    handleClose();
  };

  return (
    <UX.Box style={{padding: '16px'}} spacing="xl">
      <UX.Box layout="row_center">
        <div style={{width: 36, height: 4, background: '#3F3F3F', borderRadius: 999}} />
      </UX.Box>
      <UX.Text title="Network Filters" styleType="heading_20" />

      <UX.Box layout="row_between" style={{paddingRight: '16px'}}>
        <UX.Text title="Select all" styleType="body_16_bold" customStyles={{color: colors.gray}} />
        <UX.CheckBox
          checked={filters.bitcoin && (hasTrac ? filters.trac : true)}
          onChange={handleSelectAll}
        />
      </UX.Box>

      <UX.Box spacing="xl">
        {isTracSingle ? null : (
          <UX.Box
            layout="box_border"
            style={{cursor: 'pointer'}}
            onClick={() => handleFilterChange('bitcoin')}
          >
            <UX.Box layout="row_center" spacing="xs">
              <SVG.BitcoinIcon width={28} height={28} />
              <UX.Text title="Bitcoin" styleType="body_16_bold" />
            </UX.Box>
            <UX.Box layout="row_center" spacing="xs">
              <UX.Text title="Bitcoin Network" styleType="body_14_normal" />
              <UX.CheckBox
                checked={filters.bitcoin}
                onChange={() => handleFilterChange('bitcoin')}
              />
            </UX.Box>
          </UX.Box>
        )}

        {hasTrac && (
          <UX.Box
            layout="box_border"
            style={{cursor: 'pointer'}}
            onClick={() => handleFilterChange('trac')}
          >
            <UX.Box layout="row_center" spacing="xs">
              <SVG.TracIcon width={28} height={28} />
              <UX.Text title="Trac Network" styleType="body_16_bold" />
            </UX.Box>
            <UX.Box layout="row_center" spacing="xs">
              <UX.Text title="Trac Network" styleType="body_14_normal" />
              <UX.CheckBox
                checked={filters.trac}
                onChange={() => handleFilterChange('trac')}
              />
            </UX.Box>
          </UX.Box>
        )}
      </UX.Box>

      {(() => {
        const noneSelected = !filters.bitcoin && (!hasTrac || !filters.trac);
        return (
          <UX.Button
            title="Save"
            styleType={noneSelected ? 'dark' : 'primary'}
            customStyles={{marginBottom: '16px', opacity: noneSelected ? 0.6 : 1}}
            onClick={noneSelected ? () => {} : handleSave}
          />
        );
      })()}
    </UX.Box>
  );
}