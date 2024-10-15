import React, {CSSProperties} from 'react';
import Text from '../text-custom';
import {colors} from '../../themes/color';
import {SVG} from '../../svg';

const type: Record<string, CSSProperties> = {
  primary: {
    borderRadius: '10px',
    border: '1px solid var(--orange-500, #EA5B64)',
    background:
      'linear-gradient(180deg, #F79E6D 0%, #EA5B64 50%, #C54359 100%)',
    height: '40px',
    lineHeight: '40px',
    padding: '12px 24px',
    textAlign: 'center',
    cursor: 'pointer',
  },
  dark: {
    borderRadius: '10px',
    border: '1px solid #545454',
    background: '#272727',
    height: '40px',
    padding: '12px 24px',
    lineHeight: '40px',
    textAlign: 'center',
    cursor: 'pointer',
  },
  text: {
    borderRadius: '10px',
    border: '1px solid #545454',
    background: '#191919',
    height: '40px',
    padding: '12px 24px',
    lineHeight: '40px',
    textAlign: 'center',
    cursor: 'pointer',
  },
  copy: {
    borderRadius: '10px',
    border: 'none',
    background: 'transparent',
    height: '40px',
    padding: '12px 24px',
    lineHeight: '40px',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer',
  } as CSSProperties,
  disabled: {
    // border: '1px solid #191919',
    borderRadius: '10px',
    background: colors.black_3,
    height: '40px',
    padding: '12px 24px',
    lineHeight: '40px',
    textAlign: 'center',
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  isIcon: {
    padding: '12px',
    borderRadius: '100%',
    width: 'fit-content',
    background:
      'linear-gradient(180deg, #F79E6D 0%, #EA5B64 50%, #C54359 100%)',
  },
  withIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
};

type ButtonProps = {
  title?: string;
  styleType: keyof typeof type;
  customStyles?: React.CSSProperties;
  onClick?: () => void;
  isDisable?: boolean;
  copy?: boolean;
  isIcon?: boolean;
  svgIcon?: React.ReactNode;
  withIcon?: boolean;
};

const Button: React.FC<ButtonProps> = ({
  title,
  onClick,
  styleType,
  customStyles,
  isDisable,
  isIcon,
  svgIcon,
  copy,
  withIcon,
}) => {
  const currentStyle = isDisable ? type.disabled : type[styleType];
  const withIconStyle = withIcon ? {...type[styleType], ...type.withIcon} : {};
  // Combine the styles
  const combinedStyles: CSSProperties = {
    ...currentStyle,
    ...customStyles,
    ...withIconStyle,
  };
  if (isIcon) {
    return (
      <div style={combinedStyles} onClick={onClick}>
        {svgIcon}
      </div>
    );
  }
  if (withIcon) {
    return (
      <div style={combinedStyles} onClick={onClick}>
        <Text
          styleType="body_16_bold"
          title={title ?? ''}
          customStyles={{color: copy ? colors.main_500 : colors.white}}
        />
        {svgIcon}
      </div>
    );
  }
  return (
    <div style={combinedStyles} onClick={onClick}>
      <Text
        styleType="body_16_bold"
        title={title ?? ''}
        customStyles={{
          color: copy || styleType === 'text' ? colors.main_500 : colors.white,
        }}
      />
      {copy ? <SVG.CopyPink /> : null}
    </div>
  );
};

export default Button;
