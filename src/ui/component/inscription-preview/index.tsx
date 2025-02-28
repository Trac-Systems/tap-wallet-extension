import Button from '@/src/ui/component/button-custom';
import {Network, UNCONFIRMED_HEIGHT} from '@/src/wallet-instance';
import {CSSProperties, useMemo} from 'react';
import {GlobalSelector} from '../../redux/reducer/global/selector';
import {colors} from '../../themes/color';
import {useAppSelector} from '../../utils';
import Box from '../box-custom';
import Iframe from '../iframe-custom';
import Text from '../text-custom';

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
  isCollectibles?: boolean;
  changeInscription?: boolean;
  handleChangeInscription?: () => void;
}

export default function InscriptionPreview({
  data,
  onClick,
  preset,
  asLogo,
  styleAslogo,
  isSpendable,
  isCollectibles,
  changeInscription,
  handleChangeInscription,
}: InscriptionProps) {
  //! State
  // const wallet = useWalletProvider();
  const network = useAppSelector(GlobalSelector.networkType);
  // const [contentInscription, setContentInscription] = useState<string>('');
  const url = '';
  const contentInscription =
    '8ef9ec0dd726f9b4db89370fd9f1d9b17fc490ad39c39c74cb61d549efe90382i0';
  let preview = data?.preview;
  const isUnconfirmed = data?.utxoHeight === UNCONFIRMED_HEIGHT;
  const numberStr = isUnconfirmed
    ? 'unconfirmed'
    : `# ${data?.inscriptionNumber}`;

  if (!preview) {
    preview = url + '/preview/' + data?.inscriptionId;
  }
  const renderDmtLink = useMemo(() => {
    let link = 'http://157.230.45.91:8080/v1/render-dmt';
    if (network === Network.MAINNET) {
      link = 'https://inscriber.trac.network/v1/render-dmt';
    }
    return link;
  }, [network]);

  //! Effect function
  if (isCollectibles) {
    if (asLogo) {
      if (changeInscription) {
        return (
          <Box onClick={handleChangeInscription}>
            <Iframe
              preview={preview}
              style={{...$iframePresets[preset], ...styleAslogo}}
            />
          </Box>
        );
      }
      return (
        <Box onClick={handleChangeInscription}>
          <iframe
            key={data?.inscriptionId}
            style={{
              ...$iframePresets[preset],
              ...styleAslogo,
              pointerEvents: 'none',
            }}
            sandbox="allow-scripts allow-same-origin allow-top-navigation"
            src={`${renderDmtLink}?contentInscriptionId=${contentInscription}&dmtInscriptionId=${data?.inscriptionId}`}
          />
        </Box>
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
        <iframe
          key={data?.inscriptionId}
          style={{
            ...$iframePresets[preset],
            ...styleAslogo,
            pointerEvents: 'none',
          }}
          sandbox="allow-scripts allow-same-origin allow-top-navigation"
          src={`${renderDmtLink}?contentInscriptionId=${contentInscription}&dmtInscriptionId=${data?.inscriptionId}`}></iframe>
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
