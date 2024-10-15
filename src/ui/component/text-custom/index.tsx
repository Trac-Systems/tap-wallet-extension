import {colors} from '../../themes/color';
import React from 'react';

const type = {
  heading_24: Object.assign({
    color: colors.white,
    fontFamily: 'Exo',
    fontSize: '24px',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '32px',
  }),
  heading_20: Object.assign({
    color: colors.white,
    fontFamily: 'Exo',
    fontSize: '20px',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '28px',
  }),
  heading_18: Object.assign({
    color: colors.white,
    fontFamily: 'Exo',
    fontSize: '18px',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '26px',
  }),
  heading_16: Object.assign({
    color: colors.white,
    fontFamily: 'Exo',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '24px',
  }),
  heading_14: Object.assign({
    color: colors.white,
    fontFamily: 'Exo',
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '22px',
  }),
  heading_12: Object.assign({
    color: colors.white,
    fontFamily: 'Exo',
    fontSize: '12px',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '18px',
  }),
  body_20_extra_bold: Object.assign({
    color: colors.white,
    fontFamily: 'Exo',
    fontSize: '20px',
    fontStyle: 'normal',
    fontWeight: 600,
    lineHeight: '28px',
  }),
  body_16_bold: Object.assign({
    color: colors.smoke,
    fontFamily: 'Exo',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: '24px',
  }),
  body_14_bold: Object.assign({
    color: colors.smoke,
    fontFamily: 'Exo',
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: '22px',
  }),
  body_12_bold: Object.assign({
    color: colors.smoke,
    fontFamily: 'Exo',
    fontSize: '12px',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: '18px',
  }),
  body_16_normal: Object.assign({
    color: colors.smoke,
    fontFamily: 'Exo',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '24px',
  }),
  body_14_normal: Object.assign({
    color: colors.smoke,
    fontFamily: 'Exo',
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '22px',
  }),
  body_12_normal: Object.assign({
    color: colors.smoke,
    fontFamily: 'Exo',
    fontSize: '12px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '18px',
  }),
  body_10_normal: Object.assign({
    color: colors.smoke,
    fontFamily: 'Exo',
    fontSize: '10px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '16px',
  }),
  link: Object.assign({
    color: colors.main_500,
    textDecorationLine: 'underline',
    fontFamily: 'Exo',
  }),
};

type TextProps = {
  title: string;
  styleType: keyof typeof type;
  customStyles?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
};

const Text: React.FC<TextProps> = ({
  title,
  className,
  styleType,
  onClick,
  customStyles,
}) => {
  const combinedStyles = {
    ...type[styleType],
    ...customStyles,
  };

  return (
    <span onClick={onClick} className={className} style={combinedStyles}>
      {title}
    </span>
  );
};

export default Text;
