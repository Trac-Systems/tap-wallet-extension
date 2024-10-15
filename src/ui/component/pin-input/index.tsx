import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import './index.css';

interface PinInputProps {
  onChange: (pin: string) => void;
  onKeyUp?: React.KeyboardEventHandler<HTMLInputElement>;
  onBlur?: () => void;
}

export interface PinInputRef {
  clearPin: () => void;
}

const PinInput = forwardRef<PinInputRef, PinInputProps>(
  ({onChange, onBlur, onKeyUp}, ref) => {
    const [pin, setPin] = useState<string[]>(new Array(4).fill(''));
    const [currentFocus, setCurrentFocus] = useState(0); // Track the current focus position
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Focus the input element when the component mounts
    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement>,
      index: number,
    ) => {
      const value = e.target.value;
      if (/^[0-9]$/.test(value) || value === '') {
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        // Notify parent component of PIN change
        onChange(newPin.join(''));

        // Move focus to the next input if the current input is not empty and it's not the last input
        if (value !== '' && index < 3) {
          setCurrentFocus(index + 1); // Move focus to the next input
          inputRefs.current[index + 1]?.focus();
        }
      }
    };

    const handleKeyDown = (
      e: React.KeyboardEvent<HTMLInputElement>,
      index: number,
    ) => {
      if (e.key === 'Backspace') {
        if (pin[index] === '' && index > 0) {
          setCurrentFocus(index - 1); // Move focus to the previous input
          inputRefs.current[index - 1]?.focus();
        } else {
          const newPin = [...pin];
          newPin[index] = '';
          setPin(newPin);
          onChange(newPin.join(''));
        }
      }
    };

    const clearPin = () => {
      const newPin = new Array(4).fill('');
      setPin(newPin);
      onChange(newPin.join(''));
      setCurrentFocus(0);
      inputRefs.current[0]?.focus(); // Set focus to the first input
    };

    useImperativeHandle(ref, () => ({
      clearPin,
    }));

    useEffect(() => {
      inputRefs.current[0]?.focus();
    }, []);

    return (
      <div className="pin-container">
        {pin.map((num, index) => (
          <div key={index} className="pin-wrap" style={{
            backgroundColor: 'rgba(0, 0, 0, 0)'
          }}>
            <input
              type="password"
              maxLength={1}
              style={{pointerEvents: currentFocus === index ? 'auto' : 'none'}} // Only allow pointer events on the current input
              className={`hidden-caret pin-input ${num ? 'filled' : ''}`}
              value={num}
              onChange={e => handleChange(e, index)}
              onKeyDown={e => handleKeyDown(e, index)}
              onKeyUp={onKeyUp}
              onBlur={onBlur}
              ref={el => (inputRefs.current[index] = el)}
            />
          </div>
        ))}
      </div>
    );
  },
);

export default PinInput;
