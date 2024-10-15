import React, {
  CSSProperties,
  ForwardedRef,
  forwardRef,
  useEffect,
  useState,
} from 'react';
import {colors} from '../../themes/color';
import Box from '../box-custom';
import {SVG} from '../../svg';
import Text from '../text-custom';
import {Inscription} from '../../interfaces';
import {useAppSelector, validateBtcAddress} from '../../utils';
import {GlobalSelector} from '../../redux/reducer/global/selector';

interface InputProps {
  placeholder?: string;
  style?: CSSProperties;
  disabled?: boolean;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface TextAreaProps {
  placeholder?: string;
  style?: CSSProperties;
  disabled?: boolean;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

interface MaxLengthInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  maxLength?: number;
}

export interface InputProp {
  placeholder?: string;
  children?: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onKeyUp?: React.KeyboardEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onPaste?: React.ClipboardEventHandler<HTMLInputElement>;
  autoFocus?: boolean;
  defaultValue?: string;
  value?: string;
  style?: CSSProperties;
  baseStyle?: CSSProperties;
  containerStyle?: CSSProperties;
  addressInputData?: {address: string; domain?: string};
  onAddressInputChange?: (params: {
    address: string;
    domain: string;
    inscription?: Inscription;
  }) => void;
  onAmountInputChange?: (amount: string) => void;
  disabled?: boolean;
  disableDecimal?: boolean;
  enableBrc20Decimal?: boolean;
  runesDecimal?: number;
  enableMax?: boolean;
  onMaxClick?: () => void;
  typeCoin?: string;
  coinSVG?: string;
  disableCoinSvg?: boolean;
}

const baseStyleInput: CSSProperties = {
  fontFamily: 'Exo',
  fontStyle: 'normal',
  fontSize: '16px',
  fontWeight: 400,
  lineHeight: '24px',
  color: 'rgba(255, 255, 255, 0.69)',
  outline: 'none',
  // backgroundColor: colors.black_2,
  borderRadius: '10px',
};
const NonBorderInput = forwardRef<HTMLInputElement, InputProps>(
  (props, ref: ForwardedRef<HTMLInputElement>) => {
    const {
      placeholder,
      style,
      disabled,
      onChange,
      autoFocus,
      onFocus,
      onBlur,
      ...rest
    } = props;

    return (
      <input
        placeholder={placeholder}
        ref={ref}
        type={'text'}
        disabled={disabled}
        autoFocus={autoFocus}
        onFocus={onFocus}
        onChange={onChange}
        onBlur={onBlur}
        style={{...baseStyleInput, ...style}}
        {...rest}
      />
    );
  },
);

const Input = forwardRef<HTMLInputElement, InputProps>(
  (props, ref: ForwardedRef<HTMLInputElement>) => {
    const {
      placeholder,
      style,
      disabled,
      onChange,
      autoFocus,
      onFocus,
      onBlur,
      value,
      ...rest
    } = props;

    return (
      <input
        placeholder={placeholder}
        ref={ref}
        type={'text'}
        disabled={disabled}
        autoFocus={autoFocus}
        onFocus={onFocus}
        onChange={onChange}
        value={value}
        onBlur={onBlur}
        style={{
          ...baseStyleInput,
          ...style,
          color: colors.white,
          padding: '16px 14px',
          border: '1px solid #545454',
        }}
        {...rest}
      />
    );
  },
);

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (props, ref) => {
    const {
      placeholder,
      style,
      disabled,
      autoFocus,
      onFocus,
      onBlur,
      onChange,
      className,
      ...rest
    } = props;

    return (
      <div style={style}>
        <textarea
          ref={ref}
          className={className}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={onChange}
          style={{
            height: '150px',
            resize: 'none',
            minWidth: '310px',
            borderRadius: '10px',
            padding: '16px',
            border: '1px solid #545454',
            backgroundColor: colors.greyRgba42,
            outline: 'none',
          }}
          {...rest}
        />
      </div>
    );
  },
);

const MaxLengthInput: React.FC<MaxLengthInputProps> = ({
  maxLength = 24,
  value,
  ...props
}) => {
  const [valueInput, setValueInput] = useState<string>(String(value ?? ''));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueInput(e.target.value);
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <Box
      style={{
        borderRadius: '10px',
        border: '1px solid #545454',
        width: '100%',
      }}
      layout="row_between">
      <input
        {...props}
        value={value ?? valueInput}
        maxLength={maxLength}
        onChange={handleChange}
        style={{
          ...baseStyleInput,
          flex: 1,
          border: 'none',
          background: 'transparent',
          padding: '16px',
          color: colors.white,
          ...props.style,
        }}
      />
      <Text
        title={`${valueInput.length}/${maxLength}`}
        styleType="body_16_bold"
        customStyles={{
          marginRight: '16px',
        }}
      />
    </Box>
  );
};

const AmountInput = (props: InputProp) => {
  const {
    defaultValue,
    placeholder,
    onAmountInputChange,
    disabled,
    style: $inputStyleOverride,
    disableDecimal,
    enableBrc20Decimal,
    runesDecimal,
    typeCoin,
    autoFocus,
    disableCoinSvg,
    ...rest
  } = props;
  const $style = Object.assign(
    {},
    $inputStyleOverride,
    disabled ? {color: colors.smoke} : {},
  );

  if (!onAmountInputChange) {
    return <div />;
  }
  const [inputValue, setInputValue] = useState(defaultValue || '');
  const [validAmount, setValidAmount] = useState(defaultValue || '');

  useEffect(() => {
    onAmountInputChange(validAmount);
  }, [validAmount]);

  const handleInputAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValidAmount(value);
    setInputValue(value);
    // if (disableDecimal) {
    //   if (/^[1-9]\d*$/.test(value) || value === '') {
    //     setValidAmount(value);
    //     setInputValue(value);
    //   }
    // } else {
    //   if (enableBrc20Decimal) {
    //     if (/^\d+\.?\d{0,18}$/.test(value) || value === '') {
    //       setValidAmount(value);
    //       setInputValue(value);
    //     }
    //   } else if (runesDecimal !== undefined) {
    //     const regex = new RegExp(`^\\d+\\.?\\d{0,${runesDecimal}}$`);
    //     if (regex.test(value) || value === '') {
    //       setValidAmount(value);
    //       setInputValue(value);
    //     }
    //   } else {
    //     if (/^\d*\.?\d{0,8}$/.test(value) || value === '') {
    //       setValidAmount(value);
    //       setInputValue(value);
    //     }
    //   }
    // }
  };

  return (
    <div
      style={{
        borderRadius: 10,
        padding: '9px 16px',
        border: '1px solid #545454',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#2727276b',
      }}>
      <input
        placeholder={placeholder || '0'}
        type={'text'}
        value={inputValue}
        onChange={handleInputAmount}
        style={{
          ...$style,
          ...baseStyleInput,
          width: '100%',
          border: 'none',
        }}
        disabled={disabled}
        autoFocus={autoFocus}
        {...rest}
      />
      {disableCoinSvg ? null : (
        <Box
          layout="row"
          style={{
            gap: 8,
            padding: '9px 12px',
            border: '1px solid #545454',
            borderRadius: '6px',
          }}>
          <SVG.BitcoinIcon />
          <Text title={typeCoin ?? 'BTC'} styleType="body_14_normal" />
        </Box>
      )}
    </div>
  );
};

const AddressInput = (props: InputProp) => {
  const {onAddressInputChange, addressInputData, placeholder, style, ...rest} =
    props;

  if (!addressInputData || !onAddressInputChange) {
    return <div />;
  }
  const [validAddress, setValidAddress] = useState(addressInputData.address);
  const [parseAddress, setParseAddress] = useState(
    addressInputData.domain ? addressInputData.address : '',
  );
  const [parseError, setParseError] = useState('');
  const [formatError, setFormatError] = useState('');
  const [inputVal, setInputVal] = useState(
    addressInputData.domain || addressInputData.address,
  );
  const [inscription, setInscription] = useState<Inscription>();

  const resetState = () => {
    if (parseError) {
      setParseError('');
    }
    if (parseAddress) {
      setParseAddress('');
    }
    if (formatError) {
      setFormatError('');
    }

    if (validAddress) {
      setValidAddress('');
    }

    if (inscription) {
      setInscription(undefined);
    }
  };

  useEffect(() => {
    onAddressInputChange({
      address: validAddress,
      domain: parseAddress ? inputVal : '',
      inscription,
    });
  }, [validAddress]);
  const networkType = useAppSelector(GlobalSelector.networkType);

  const handleInputAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputAddress = e.target.value.trim();
    setInputVal(inputAddress);

    resetState();
    const isValid = validateBtcAddress(inputAddress, networkType);
    // console.log('🚀 ~ handleInputAddress ~ isValid:', isValid);

    if (!isValid) {
      setFormatError('Recipient address is invalid');
      return;
    }
    setValidAddress(inputAddress);
  };

  return (
    <Box>
      <Box
        layout="row"
        style={{
          borderRadius: 10,
          padding: '9px 16px',
          border: '1px solid #545454',
          backgroundColor: '#2727276b',
        }}>
        <input
          placeholder={placeholder ?? 'Wallet address'}
          type={'text'}
          onChange={async e => {
            handleInputAddress(e);
          }}
          style={{...baseStyleInput, ...style, background: 'transparent'}}
          defaultValue={inputVal}
          {...rest}
        />
      </Box>
      <Text
        title={formatError}
        styleType="body_14_bold"
        customStyles={{color: colors.red_500, marginTop: '4px'}}
      />
    </Box>
  );
};

export {
  NonBorderInput,
  Input,
  TextArea,
  MaxLengthInput,
  AmountInput,
  AddressInput,
};
