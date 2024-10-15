import React, {CSSProperties} from 'react';
import {spaces} from '../../themes/space';
import Box from '../box-custom';
import Text from '../text-custom';
import {SVG} from '../../svg';

interface TextHeaderProps {
  text?: string;
  onBackClick?: () => void;
  disableIconBack?: boolean;
  styleIconBack?: CSSProperties;
  style?: CSSProperties;
}

const TextHeader: React.FC<TextHeaderProps> = ({
  text = '',
  onBackClick,
  disableIconBack,
  styleIconBack,
  style,
}) => {
  return (
    <Box
      layout="column_center"
      style={{position: 'relative', padding: '20px 0', ...style}}>
      {disableIconBack ? null : (
        <div
          onClick={onBackClick}
          style={{
            ...styleIconBack,
            position: 'absolute',
            left: 0,
            top: spaces.xlg,
            cursor: 'pointer',
          }}>
          <SVG.ArrowBackIcon />
        </div>
      )}
      <Text styleType="heading_20" title={text} />
    </Box>
  );
};

export default TextHeader;
