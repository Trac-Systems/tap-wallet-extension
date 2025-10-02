import React, {forwardRef, useImperativeHandle, useMemo, useRef, useState} from 'react';

interface AuthInputProps {
  onChange: (value: string) => void;
  onKeyUp?: React.KeyboardEventHandler<HTMLInputElement>;
  placeholder?: string;
  type?: 'password' | 'text';
  autoComplete?: string;
  rightSlot?: React.ReactNode;
  toggleVisibility?: boolean;
  showChecklist?: boolean;
  showStrength?: boolean;
  validators?: Array<{label: string; valid: (v: string) => boolean}>;
  strengthCalc?: (v: string) => number; // return 0..5
  autoFocus?: boolean;
}

export interface AuthInputRef {
  clear: () => void;
}

const containerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  borderRadius: '10px',
  border: '1px solid #545454',
  background: '#272727',
  padding: '0 16px',
  boxSizing: 'border-box',
  minHeight: 56,
  display: 'flex',
  alignItems: 'center',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  padding: '12px 0',
  color: '#FFFFFF',
  boxSizing: 'border-box',
};

const AuthInput = forwardRef<AuthInputRef, AuthInputProps>(
  (
    {
      onChange,
      onKeyUp,
      placeholder,
      type = 'password',
      autoComplete = 'off',
      rightSlot,
      toggleVisibility = true,
      showChecklist,
      showStrength,
      validators,
      strengthCalc,
      autoFocus = false,
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [value, setValue] = useState('');
    const [show, setShow] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setValue(v);
      onChange(v);
    };

    useImperativeHandle(ref, () => ({
      clear: () => {
        if (inputRef.current) {
          inputRef.current.value = '';
        }
        onChange('');
        inputRef.current?.focus();
      },
    }));

    const effectiveType = toggleVisibility ? (show ? 'text' : 'password') : type;

    const effectiveRightSlot = toggleVisibility ? (
      <div
        style={{cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center'}}
        onClick={() => setShow(v => !v)}>
        {show ? (
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.0622299 8.346C1.77323 13 5.67523 16 10.0002 16C14.3252 16 18.2272 13 19.9382 8.346C20.0212 8.1228 20.0212 7.87721 19.9382 7.654C18.2272 3 14.3252 0 10.0002 0C5.67523 0 1.77323 3 0.0622299 7.654C-0.0207433 7.87721 -0.0207433 8.1228 0.0622299 8.346ZM10.0002 2C13.3732 2 16.4512 4.343 17.9292 8C16.4512 11.657 13.3732 14 10.0002 14C6.62723 14 3.54923 11.657 2.07123 8C3.54923 4.343 6.62723 2 10.0002 2ZM10.0002 12C10.7914 12 11.5647 11.7654 12.2225 11.3259C12.8803 10.8864 13.393 10.2616 13.6957 9.53073C13.9985 8.79983 14.0777 7.99556 13.9234 7.21964C13.769 6.44371 13.3881 5.73098 12.8287 5.17157C12.2692 4.61216 11.5565 4.2312 10.7806 4.07686C10.0047 3.92252 9.2004 4.00173 8.4695 4.30448C7.73859 4.60723 7.11388 5.11992 6.67435 5.77772C6.23483 6.43552 6.00023 7.20887 6.00023 8C6.00023 9.06087 6.42166 10.0783 7.1718 10.8284C7.92195 11.5786 8.93936 12 10.0002 12ZM10.0002 6C10.3958 6 10.7825 6.1173 11.1114 6.33706C11.4403 6.55682 11.6966 6.86918 11.848 7.23463C11.9994 7.60009 12.039 8.00222 11.9618 8.39018C11.8846 8.77814 11.6941 9.13451 11.4144 9.41421C11.1347 9.69392 10.7784 9.8844 10.3904 9.96157C10.0024 10.0387 9.60032 9.99913 9.23486 9.84776C8.86941 9.69638 8.55705 9.44004 8.33729 9.11114C8.11753 8.78224 8.00023 8.39556 8.00023 8C8.00023 7.46957 8.21094 6.96086 8.58602 6.58579C8.96109 6.21071 9.4698 6 10.0002 6Z" fill="white" fillOpacity="0.69"/>
          </svg>
        ) : (
          <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.29323 20.7071C0.480758 20.8946 0.735066 20.9999 1.00023 20.9999C1.26539 20.9999 1.5197 20.8946 1.70723 20.7071L4.90723 17.5071C6.43044 18.4744 8.19584 18.9919 10.0002 19.0001C14.3252 19.0001 18.2272 16.0001 19.9382 11.3461C20.0212 11.1229 20.0212 10.8773 19.9382 10.6541C19.2649 8.77591 18.1551 7.08451 16.7002 5.71908L19.7122 2.70708C19.8077 2.61483 19.8839 2.50449 19.9363 2.38249C19.9887 2.26048 20.0163 2.12926 20.0175 1.99648C20.0186 1.8637 19.9933 1.73202 19.9431 1.60913C19.8928 1.48623 19.8185 1.37458 19.7246 1.28069C19.6307 1.18679 19.5191 1.11254 19.3962 1.06226C19.2733 1.01198 19.1416 0.986677 19.0088 0.987831C18.876 0.988985 18.7448 1.01657 18.6228 1.06898C18.5008 1.12139 18.3905 1.19757 18.2982 1.29308L15.0982 4.49308C13.5736 3.52485 11.8063 3.00729 10.0002 3.00008C5.67523 3.00008 1.77323 6.00008 0.0622299 10.6541C-0.0207433 10.8773 -0.0207433 11.1229 0.0622299 11.3461C0.737048 13.2247 1.84857 14.9162 3.30523 16.2811L0.29323 19.2931C0.105759 19.4806 0.000443473 19.7349 0.000443473 20.0001C0.000443473 20.2652 0.105759 20.5196 0.29323 20.7071ZM15.2662 7.14808C16.4338 8.21419 17.3443 9.53123 17.9292 11.0001C16.4512 14.6571 13.3732 17.0001 10.0002 17.0001C8.72837 16.9943 7.47874 16.6661 6.36823 16.0461L7.98123 14.4331C8.59079 14.8007 9.28841 14.9966 10.0002 15.0001C11.0611 15.0001 12.0785 14.5787 12.8287 13.8285C13.5788 13.0784 14.0002 12.0609 14.0002 11.0001C13.9967 10.2883 13.8008 9.59064 13.4332 8.98108L15.2662 7.14808ZM8.07523 11.5111C8.0278 11.3448 8.00258 11.173 8.00023 11.0001C8.00023 10.4696 8.21094 9.96094 8.58602 9.58587C8.96109 9.2108 9.4698 9.00008 10.0002 9.00008C10.1731 9.00243 10.3449 9.02765 10.5112 9.07508L8.07523 11.5111ZM11.9252 10.4891C11.9727 10.6554 11.9979 10.8272 12.0002 11.0001C12.0002 11.5305 11.7895 12.0392 11.4144 12.4143C11.0394 12.7894 10.5307 13.0001 10.0002 13.0001C9.82733 12.9977 9.65551 12.9725 9.48923 12.9251L11.9252 10.4891ZM2.07123 11.0001C3.54923 7.34308 6.62723 5.00008 10.0002 5.00008C11.2721 5.00582 12.5217 5.33405 13.6322 5.95408L12.0192 7.56708C11.4097 7.19948 10.712 7.00356 10.0002 7.00008C8.93936 7.00008 7.92195 7.42151 7.1718 8.17165C6.42166 8.9218 6.00023 9.93921 6.00023 11.0001C6.00371 11.7119 6.19963 12.4095 6.56723 13.0191L4.73423 14.8521C3.5667 13.786 2.65619 12.4689 2.07123 11.0001Z" fill="white" fillOpacity="0.69"/>
          </svg>
        )}
      </div>
    ) : rightSlot;

    const defaultValidators = useMemo(
      () => [
        {label: 'Length ≥12', valid: (s: string) => s.length >= 12},
        {label: 'Contains uppercase', valid: (s: string) => /[A-Z]/.test(s)},
        {label: 'Contains lowercase', valid: (s: string) => /[a-z]/.test(s)},
        {label: 'Contains special character', valid: (s: string) => /[^a-zA-Z0-9]/.test(s)},
      ],
      [],
    );

    const rules = validators && validators.length > 0 ? validators : defaultValidators;

    const strength = useMemo(() => {
      const calc = strengthCalc
        ? strengthCalc
        : (s: string) => {
            let score = 0;
            if (s.length >= 12) score += 1;
            if (/[A-Z]/.test(s)) score += 1;
            if (/[a-z]/.test(s)) score += 1;
            if (/[^a-zA-Z0-9]/.test(s)) score += 1;
            if (s.length >= 16) score += 1;
            return Math.min(score, 5);
          };
      return calc(value);
    }, [value, strengthCalc]);

    const hasRight = Boolean(effectiveRightSlot);

    return (
      <div style={containerStyle}>
        <input
          ref={inputRef}
          type={effectiveType}
          maxLength={64}
          onChange={handleChange}
          onKeyUp={onKeyUp}
          placeholder={placeholder}
          style={{
            ...inputStyle,
            paddingRight: hasRight ? 68 : inputStyle.padding,
          }}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
        />
        {effectiveRightSlot && (
          <div style={{position: 'absolute', right: 12, top: 0, bottom: 0, display: 'flex', alignItems: 'center'}}>
            {effectiveRightSlot}
          </div>
        )}
        {showChecklist && (
          <div style={{display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap'}}>
            {rules.map((r, i) => {
              const ok = r.valid(value);
              return (
                <span key={i} style={{color: ok ? '#7AD27A' : '#D16B7C', fontSize: 12, fontWeight: 600}}>
                  {`• ${r.label}: ${ok ? '✓' : '✗'}`}
                </span>
              );
            })}
          </div>
        )}
        {showStrength && (
          <div style={{height: 6, borderRadius: 4, background: 'rgba(84,84,84,0.5)', marginTop: 6}}>
            <div
              style={{
                height: 6,
                borderRadius: 4,
                width: `${(strength / 5) * 100}%`,
                background: strength <= 2 ? '#D16B7C' : strength <= 3 ? '#E0C060' : '#7AD27A',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        )}
      </div>
    );
  },
);

export default AuthInput;


