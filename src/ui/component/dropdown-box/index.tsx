import React, {useEffect, useRef, useState} from 'react';
import {SVG} from '../../svg';
import Text from '../text-custom';

type Option = {
  label: string;
  value: string;
};

interface DropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

const CustomDropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
}) => {
  //! State
  const [open, setOpen] = useState(false);
  const selectedLabel =
    options.find(opt => opt.value === value)?.label || 'Select';
  const dropdownRef = useRef<HTMLDivElement>(null);

  //! Effect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  //! Render
  return (
    <div ref={dropdownRef} style={{position: 'relative'}}>
      <div
        onClick={() => setOpen(prev => !prev)}
        style={{
          display: 'flex',
          padding: '14px 16px',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: '10px',
          border: '1px solid #545454',
          background: 'rgba(39, 39, 39, 0.42)',
          cursor: 'pointer',
          color: '#fff',
        }}>
        <Text
          title={selectedLabel}
          styleType="body_14_normal"
          customStyles={{color: 'white'}}
        />
        <SVG.ArrowDownIcon width={20} height={20} />
      </div>

      {open && (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: '8px 0',
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            borderRadius: '10px',
            background: 'rgba(39, 39, 39, 0.9)',
            border: '1px solid #545454',
            zIndex: 10,
            maxHeight: '200px',
            overflowY: 'auto',
          }}>
          {options.map(opt => (
            <li
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                color: '#fff',
                background:
                  opt.value === value ? 'rgba(255,255,255,0.1)' : 'transparent',
              }}
              onMouseEnter={e =>
                (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')
              }
              onMouseLeave={e =>
                (e.currentTarget.style.background =
                  opt.value === value ? 'rgba(255,255,255,0.1)' : 'transparent')
              }>
              <Text title={opt.label} styleType="body_14_normal" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown;
