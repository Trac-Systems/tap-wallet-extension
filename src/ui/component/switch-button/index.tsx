import React from 'react';
import Switch from 'react-switch';
import {colors} from '../../themes/color';

type SwitchCustomProps = {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
};

const SwitchCustom: React.FC<SwitchCustomProps> = ({
  checked = false,
  onChange,
  disabled = false,
}) => {
  return (
    <Switch
      handleDiameter={20}
      width={36}
      height={22}
      onChange={onChange}
      checked={checked}
      disabled={disabled}
      onColor={colors.main_500}
      offColor={colors.gray}
      checkedIcon={false}
      uncheckedIcon={false}
    />
  );
};

export default SwitchCustom;
