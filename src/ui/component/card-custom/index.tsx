import {CSSProperties} from 'react';
import {SVG} from '../../svg';
import {colors} from '../../themes/color';
import {spaces} from '../../themes/space';
import Box from '../box-custom';
import Text from '../text-custom';
import './index.css';

interface ICardProps {
  isActive?: boolean;
  text: string;
  onClick?: () => void;
  style?: CSSProperties;
}
const Card = (props: ICardProps) => {
  const {isActive, text, onClick, style} = props;

  return (
    <Box
      onClick={onClick}
      style={{
        backgroundColor: isActive ? colors.black_3 : colors.greyRgba42,
        border: '1px solid #545454',
        borderRadius: '10px',
        padding: spaces.xl,
      }}>
      <Box layout="row_between" style={style}>
        <Text title={text} styleType="body_16_normal" className="widthText" />
        {isActive ? <SVG.CheckIcon /> : null}
      </Box>
    </Box>
  );
};

export default Card;
