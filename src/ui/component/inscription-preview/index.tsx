import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {UNCONFIRMED_HEIGHT} from '@/src/wallet-instance';
import {CSSProperties, useEffect, useMemo, useState} from 'react';
import {GlobalSelector} from '../../redux/reducer/global/selector';
import {colors} from '../../themes/color';
import {getRenderDmtLink, useAppSelector} from '../../utils';
import Box from '../box-custom';
import Iframe from '../iframe-custom';
import Text from '../text-custom';
import {TickerDMT, TickerSpendable} from '../ticker-dmt';

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
  changeInscription,
  handleChangeInscription,
}: InscriptionProps) {
  //! State
  const network = useAppSelector(GlobalSelector.networkType);
  const dmtCollectibleMap = useAppSelector(AccountSelector.dmtCollectibleMap);
  const [contentInscription, setContentInscription] = useState<string>('');
  const url = '';

  let preview = data?.preview;
  const isUnconfirmed = data?.utxoHeight === UNCONFIRMED_HEIGHT;
  const numberStr = isUnconfirmed
    ? 'unconfirmed'
    : `# ${data?.inscriptionNumber}`;

  if (!preview) {
    preview = url + '/preview/' + data?.inscriptionId;
  }
  const renderDmtLink = useMemo(() => {
    return getRenderDmtLink(network);
  }, [network]);

  useEffect(() => {
    const fetchContent = async () => {
      const contentInsId = dmtCollectibleMap[data?.inscriptionId];
      if (contentInsId) {
        setContentInscription(contentInsId?.contentInscriptionId);
      }
    };
    fetchContent();
  }, [dmtCollectibleMap, data?.inscriptionId]);

  //! Effect function
  if (contentInscription) {
    if (asLogo) {
      if (changeInscription) {
        return (
          <Box onClick={handleChangeInscription} style={{position: 'relative'}}>
            <Iframe
              preview={preview}
              style={{...$iframePresets[preset], ...styleAslogo}}
            />
          </Box>
        );
      }
      return (
        <Box onClick={handleChangeInscription} style={{position: 'relative'}}>
          <TickerDMT top={25} left={75} />
          <iframe
            key={data?.inscriptionId}
            style={{
              ...$iframePresets[preset],
              ...styleAslogo,
              pointerEvents: 'none',
            }}
            sandbox="allow-scripts allow-same-origin allow-top-navigation"
            src={`${renderDmtLink}/${contentInscription}/${data?.inscriptionId}?block=${dmtCollectibleMap[data?.inscriptionId]?.block}`}
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
        {isSpendable && <TickerSpendable />}
        {contentInscription && <TickerDMT top={isSpendable ? 55 : 11} />}
        <iframe
          key={data?.inscriptionId}
          style={{
            ...$iframePresets[preset],
            ...styleAslogo,
            pointerEvents: 'none',
          }}
          sandbox="allow-scripts allow-same-origin allow-top-navigation"
          src={`${renderDmtLink}/${contentInscription}/${data?.inscriptionId}?block=${dmtCollectibleMap[data?.inscriptionId]?.block}`}></iframe>
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
      {isSpendable && <TickerSpendable />}
      {contentInscription && <TickerDMT top={isSpendable ? 55 : 11} />}
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
