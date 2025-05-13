import {UX} from '@/src/ui/component';
import {BadgeProps} from '@/src/ui/component/badge';
import InscriptionPreview from '@/src/ui/component/inscription-preview';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {useAppSelector} from '@/src/ui/utils';
import {InscriptionOrdClient, Network} from '@/src/wallet-instance';
import {useEffect, useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';

const CancelAuthorityStatus = {
  UNCONFIRMED: {
    title: 'Unconfirmed',
    status: 'default',
    btnDisable: true,
  },
  CONFIRMED: {
    title: 'Confirmed',
    status: 'success',
    btnDisable: false,
  },
  TAPPING: {
    title: 'Tapping',
    status: 'warning',
    btnDisable: true,
  },
};

const CancelAuthorityDetail = () => {
  const wallet = useWalletProvider();
  const navigate = useNavigate();
  const location = useLocation();
  const {state} = location;
  const [loading, setLoading] = useState(false);

  const network = useAppSelector(GlobalSelector.networkType);
  const inscriptionId = state?.inscriptionId;
  const order = state?.order;

  const urlPreview = useMemo(() => {
    return network === Network.TESTNET
      ? 'http://trac.intern.ungueltig.com:55002/preview/'
      : 'https://ord-tw.tap-hosting.xyz/preview/';
  }, [network]);

  const [inscriptionInfo, setInscriptionInfo] =
    useState<InscriptionOrdClient | null>(null);

  // get token info
  useEffect(() => {
    const getTokenInfo = async () => {
      const ins = await wallet.getInscriptionInfoOrdClient(inscriptionId);
      setInscriptionInfo(ins);
    };
    if (inscriptionId) {
      try {
        setLoading(true);
        getTokenInfo();
      } catch (error) {
        console.log('error :>> ', error);
      } finally {
        setLoading(false);
      }
    }
  }, [inscriptionId]);

  const handleOnClick = () => {
    //TODO: Handle taping
    navigate('/handle-tapping-authority', {
      state: {
        inscriptionId,
        order,
      },
    });
  };

  const inscriptionStatus = useMemo(() => {
    const satpointTxid = inscriptionInfo?.satpoint?.split(':')[0];
    const inscriptionTxid = inscriptionId?.split('i')[0];

    if (inscriptionInfo?.height === 0) {
      return satpointTxid === inscriptionTxid ? 'UNCONFIRMED' : 'TAPPING';
    } else {
      return satpointTxid === inscriptionTxid ? 'CONFIRMED' : 'TAPPING';
    }
  }, [inscriptionInfo]);

  if (loading) {
    return <UX.Loading />;
  }

  return (
    <UX.Box className="inscription-detail">
      <UX.Box className="image-box">
        <UX.Box onClick={() => navigate('/home')} className="circle">
          <SVG.ArrowBackIcon width={24} height={24} />
        </UX.Box>
        <InscriptionPreview
          data={{
            ...inscriptionInfo,
            inscriptionId: inscriptionInfo?.id,
            outputValue: inscriptionInfo?.value,
            inscriptionNumber: inscriptionInfo?.number,
            preview: `${urlPreview}${inscriptionInfo?.id}`,
          }}
          preset="large"
          asLogo
        />
      </UX.Box>
      <UX.Box className="image-box-section" style={{marginTop: '16px'}}>
        <UX.Box layout="row_between" spacing="xs">
          <UX.Text
            title={`Inscription ${inscriptionInfo?.number}`}
            styleType="heading_20"
            customStyles={{marginLeft: '16px'}}
          />
        </UX.Box>
        <UX.Text
          title={`${inscriptionInfo?.value} SATs`}
          styleType="body_14_bold"
          customStyles={{
            color: colors.main_500,
            marginTop: '8px',
            marginBottom: '16px',
            marginLeft: '16px',
          }}
        />
        <UX.Badge
          text={CancelAuthorityStatus[inscriptionStatus].title}
          status={
            CancelAuthorityStatus[inscriptionStatus]
              .status as BadgeProps['status']
          }
          customStyles={{marginLeft: '16px'}}
        />
        <UX.Box layout="box" spacing="xl" style={{margin: '16px'}}>
          <UX.Section title="ID" value={inscriptionInfo?.id} />
          <UX.Section title="Address" value={inscriptionInfo?.address} />
          <UX.Section
            title="Output value"
            value={inscriptionInfo?.value?.toString()}
          />
        </UX.Box>
      </UX.Box>

      <footer className="footer_sr">
        <UX.Box
          layout="column"
          spacing="xl"
          className="footer_sr"
          style={{
            padding: '10px 0',
          }}>
          {CancelAuthorityStatus[inscriptionStatus].btnDisable ? null : (
            <UX.Button
              styleType="primary"
              customStyles={{
                margin: '0 24px',
              }}
              title={'Tap'}
              isDisable={CancelAuthorityStatus[inscriptionStatus].btnDisable}
              onClick={handleOnClick}
            />
          )}
        </UX.Box>
      </footer>
    </UX.Box>
  );
};

export default CancelAuthorityDetail;
