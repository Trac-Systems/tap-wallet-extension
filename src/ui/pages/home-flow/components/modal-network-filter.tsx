import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {useState} from 'react';
import {useAppSelector} from '@/src/ui/utils';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';

interface ModalNetworkFilterProps {
  handleClose: () => void;
  onFilterChange?: (filters: {bitcoin: boolean; trac: boolean}) => void;
}

export default function ModalNetworkFilter(props: ModalNetworkFilterProps) {
  const {handleClose, onFilterChange} = props;
  const [filters, setFilters] = useState({
    bitcoin: true,
    trac: true,
  });
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const hasTrac = !!activeAccount?.tracAddress;

  const handleFilterChange = (network: 'bitcoin' | 'trac') => {
    const newFilters = {
      ...filters,
      [network]: !filters[network],
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSelectAll = () => {
    const allSelected = filters.bitcoin && (hasTrac ? filters.trac : true);
    const newFilters = {
      bitcoin: !allSelected,
      trac: hasTrac ? !allSelected : false,
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
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