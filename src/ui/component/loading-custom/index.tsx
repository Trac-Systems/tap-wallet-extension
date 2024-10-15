import {CSSProperties} from 'react';
import './index.css';
import {spaces} from '../../themes/space';
import Text from '../text-custom';
import {colors} from '../../themes/color';
import {SVG} from '../../svg';

export interface LoadingProps {
  text?: string;
  onClose?: () => void;
}

const styleBase: CSSProperties = {
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: spaces.xss,
};

export function Loading(props: LoadingProps) {
  const {text} = props;
  return (
    <div className="loading-container">
      <div style={styleBase}>
        <SVG.LoadingIcon />
        {text && (
          <Text
            title={text}
            styleType="body_16_bold"
            customStyles={{color: colors.main_500}}
          />
        )}
      </div>
    </div>
  );
}
