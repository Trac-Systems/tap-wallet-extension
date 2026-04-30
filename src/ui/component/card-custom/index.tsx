import {CSSProperties} from 'react';
import {SVG} from '../../svg';
import {colors} from '../../themes/color';
import {spaces} from '../../themes/space';
import Box from '../box-custom';
import Text from '../text-custom';
import './index.css';
import type {TranslationParams} from '../../i18n/types';

interface ICardProps {
  isActive?: boolean;
  text?: string;
  textKey?: string;
  textParams?: TranslationParams;
  onClick?: () => void;
  style?: CSSProperties;
}
const Card = (props: ICardProps) => {
  const {isActive, text, textKey, textParams, onClick, style} = props;

  return (
    <Box
      onClick={onClick}
      style={{
        backgroundColor: isActive ? colors.black_3 : colors.greyRgba42,
        border: '1px solid #545454',
        borderRadius: '10px',
        padding: spaces.xl,
        cursor: 'pointer',
      }}>
      <Box layout="row_between" style={style}>
        <Text
          title={text}
          titleKey={textKey}
          titleParams={textParams}
          styleType="body_16_normal"
          className="widthText"
        />
        {isActive ? <SVG.CheckIcon /> : null}
      </Box>
    </Box>
  );
};

export default Card;
