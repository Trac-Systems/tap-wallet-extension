import React, {useMemo, useState} from 'react';

interface CustomCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  width?: string;
  height?: string;
  uncheckedColor?: string;
  checkedColor?: string;
  checkmarkColor?: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked = false,
  onChange,
  width = '16px',
  height = '16px',
  checkedColor = '#D16B7C',
  checkmarkColor = 'white',
}) => {
  const [isChecked, setIsChecked] = useState<boolean>(checked);

  const handleCheckboxChange = () => {
    if (onChange) {
      const newCheckedStatus = !isChecked;
      setIsChecked(!isChecked);
      onChange(newCheckedStatus);
    }
  };

  const checkedValue = useMemo(() => {
    if (onChange) {
      return isChecked;
    } else {
      return checked;
    }
  }, [onChange, checked, isChecked]);

  return (
    <div
      onClick={handleCheckboxChange}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width,
        height,
        borderRadius: '4px',
        cursor: 'pointer',
        border: `1px solid ${checkedValue ? checkedColor : '#fff'}`,
        transition: 'background-color 0.3s, border-color 0.3s',
      }}>
      {checkedValue && (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M20 6L9 17L4 12"
            stroke={checkmarkColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
};

export default CustomCheckbox;
