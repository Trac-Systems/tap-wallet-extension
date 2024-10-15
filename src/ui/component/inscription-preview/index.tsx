import {CSSProperties} from 'react';
import {Inscription} from '../../interfaces';
import {colors} from '../../themes/color';
import Box from '../box-custom';
import Iframe from '../iframe-custom';
import Text from '../text-custom';
import {UNCONFIRMED_HEIGHT} from '@/src/wallet-instance';

const $viewPresets = {
  large: {},

  medium: {},

  small: {},
};

const $containerPresets: Record<Presets, CSSProperties> = {
  large: {
    backgroundColor: colors.black,
    width: '100%',
  },
  medium: {
    backgroundColor: colors.black,
    width: '100%',
  },
  small: {
    backgroundColor: colors.black,
    width: 120,
  },
};

const $iframePresets: Record<Presets, CSSProperties> = {
  large: {
    width: '100%',
    height: 390,
    borderTopLeftRadius: '10px',
    borderTopRightRadius: '10px',
  },
  medium: {
    width: '100%',
    height: 144,
    borderTopLeftRadius: '10px',
    borderTopRightRadius: '10px',
    borderWidth: '0px'
  },
  small: {
    width: 100,
    height: 120,
    borderTopLeftRadius: '10px',
    borderTopRightRadius: '10px',
  },
};

type Presets = keyof typeof $viewPresets;

export interface InscriptionProps {
  data: Inscription;
  onClick?: () => void;
  preset: Presets;
  asLogo?: boolean;
  styleAslogo?: CSSProperties;
}

export default function InscriptionPreview({
  data,
  onClick,
  preset,
  asLogo,
  styleAslogo,
}: InscriptionProps) {
  const url = '';
  let preview = data?.preview;
  const isUnconfirmed = data?.utxoHeight === UNCONFIRMED_HEIGHT;
  const numberStr = isUnconfirmed
    ? 'unconfirmed'
    : `# ${data?.inscriptionNumber}`;
  if (!preview) {
    preview = url + '/preview/' + data?.inscriptionId;
  }
  if (asLogo) {
    return (
      <Iframe
        preview={preview}
        style={{...$iframePresets[preset], ...styleAslogo}}
      />
    );
  }
  return (
    <Box
      onClick={onClick}
      style={{
        ...$containerPresets[preset],
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
      }}>
      <Iframe preview={preview} style={$iframePresets[preset]} />
      <Box style={{padding: '12px 10px', background: '#272727'}}>
        <Text
          title={`${numberStr}`}
          styleType="body_16_bold"
          customStyles={{color: 'white'}}
        />
      </Box>
    </Box>
  );
}
