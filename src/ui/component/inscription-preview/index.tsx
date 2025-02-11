import {UNCONFIRMED_HEIGHT} from '@/src/wallet-instance';
import {CSSProperties} from 'react';
import {colors} from '../../themes/color';
import Box from '../box-custom';
import Iframe from '../iframe-custom';
import Text from '../text-custom';
import Button from '@/src/ui/component/button-custom';

const $viewPresets = {
  large: {},

  medium: {},

  small: {},
  asLogo: {},
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
  asLogo: {
    backgroundColor: colors.black,
    width: 50,
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
    borderWidth: '0px',
  },
  small: {
    width: 100,
    height: 120,
    borderTopLeftRadius: '10px',
    borderTopRightRadius: '10px',
  },
  asLogo: {
    width: 50,
    height: 60,
    borderRadius: '10px',
  },
};

type Presets = keyof typeof $viewPresets;

export interface InscriptionProps {
  // data: Inscription;
  data: any;
  onClick?: () => void;
  preset: Presets;
  asLogo?: boolean;
  styleAslogo?: CSSProperties;
  isSpendable?: boolean;
}

export default function InscriptionPreview({
  data,
  onClick,
  preset,
  asLogo,
  styleAslogo,
  isSpendable,
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
      {isSpendable && (
        <Button
          title="Spendable"
          styleType="primary"
          customStyles={{
            width: 'fit-content',
            height: 'auto',
            lineHeight: 'normal',
            padding: '5px 10px',
            fontSize: '14px',
            position: 'absolute',
            top: 11,
            left: 11,
          }}
        />
      )}
      <Iframe preview={preview} style={$iframePresets[preset]} />
      <Box style={{padding: '12px 10px', background: '#272727'}}>
        <Text
          title={`${numberStr}`}
          styleType="body_16_bold"
          customStyles={{color: 'white'}}
        />
        <Text
          title={`${data.outputValue} SATs`}
          styleType="body_16_bold"
          customStyles={{color: colors.main_500}}
        />
      </Box>
    </Box>
  );
}
