import React from 'react';

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
  checked,
  onChange,
  width = '16px',
  height = '16px',
  checkedColor = '#D16B7C',
  checkmarkColor = 'white',
}) => {
  // Derived value for controlled vs uncontrolled behavior
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = React.useState<boolean>(false);

  const isChecked = isControlled ? checked : internalChecked;

  const handleCheckboxChange = () => {
    const newChecked = !isChecked;

    if (!isControlled) {
      setInternalChecked(newChecked);
    }

    if (onChange) {
      onChange(newChecked);
    }
  };

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
        background: `${isChecked ? checkedColor : 'black'}`,
        border: `1px solid ${isChecked ? checkedColor : '#fff'}`,
        transition: 'background-color 0.3s, border-color 0.3s',
      }}>
      {isChecked && (
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
