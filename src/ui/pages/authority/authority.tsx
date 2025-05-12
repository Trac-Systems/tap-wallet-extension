import {UX} from '@/src/ui/component';
import InscriptionPreview from '@/src/ui/component/inscription-preview';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {Inscription} from '@/src/wallet-instance';
import {useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Tags} from './component/tags';
type Status = 'Unconfirmed' | 'Confirmed' | 'Pending' | 'Tapped';

const Authority = () => {
  //! State
  const navigate = useNavigate();
  const {showToast} = useCustomToast();
  const wallet = useWalletProvider();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [inscriptions, setInscription] = useState<Inscription[]>();
  const state = {
    inscriptionId:
      'd2e780cb948a64050cdc037e059c5567a9e081640783d92b4a1dfb92dbe44b7di0',
  };
  const dynamicValue: Status = 'Tapped';
  const status = dynamicValue as Status;

  const inscriptionInfo = useMemo(() => {
    if (!inscriptions?.length) {
      return;
    }
    return inscriptions.filter(
      ins => ins.inscriptionId === state?.inscriptionId,
    )[0];
  }, [inscriptions]);

  //! Function
  const getInscriptionInfo = async () => {
    try {
      setLoading(true);
      const inscriptions = await wallet.getInscriptionInfo(
        state?.inscriptionId,
      );
      setInscription(inscriptions);
    } catch (err) {
      showToast({
        title: `${(err as Error).message}`,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  //! Effect
  useEffect(() => {
    getInscriptionInfo();
  }, []);

  if (isLoading || !inscriptionInfo) {
    return <UX.Loading />;
  }

  //! Render
  return (
    <UX.Box className="inscription-detail">
      <UX.Box className="image-box">
        <UX.Box onClick={() => navigate(-1)} className="circle">
          <SVG.ArrowBackIcon width={24} height={24} />
        </UX.Box>
        <InscriptionPreview data={inscriptionInfo} preset="large" asLogo />
      </UX.Box>
      <UX.Box className="image-box-section" style={{marginTop: '16px'}}>
        <UX.Text
          title={`Inscription ${inscriptionInfo?.inscriptionNumber}`}
          styleType="heading_20"
          customStyles={{marginLeft: '16px'}}
        />
        <UX.Text
          title={`${inscriptionInfo?.outputValue} SATs`}
          styleType="body_14_bold"
          customStyles={{
            color: colors.main_500,
            marginTop: '8px',
            marginBottom: '16px',
            marginLeft: '16px',
          }}
        />
        <Tags text={status} />
        <UX.Box layout="box" spacing="xl" style={{margin: '16px'}}>
          <UX.Section title="ID" value={inscriptionInfo?.inscriptionId} />
          <UX.Section title="Address" value={inscriptionInfo?.address} />
          <UX.Section
            title="Output value"
            value={inscriptionInfo?.outputValue.toString()}
          />
        </UX.Box>
      </UX.Box>
      <footer className="footer_sr" style={{background: '#121212'}}>
        <UX.Box
          layout="column"
          spacing="xl"
          className="footer_sr"
          style={{
            padding: '10px 0',
            opacity: status === 'Pending' || status === 'Unconfirmed' ? 0.4 : 1,
            pointerEvents:
              status === 'Pending' || status === 'Unconfirmed'
                ? 'none'
                : 'auto',
          }}>
          <UX.Button
            styleType={status === 'Confirmed' ? 'primary' : 'dark'}
            customStyles={{
              margin: '0 24px',
            }}
            title={status === 'Tapped' ? 'Cancel' : 'Tap'}
            onClick={() => {
              if (status === 'Confirmed') {
                navigate('/handle-confirm-authority', {
                  state: {
                    type: 'confirm',
                  },
                });
              } else {
                navigate('/handle-cancel-authority', {
                  state: {
                    type: 'cancel',
                  },
                });
              }
            }}
          />
        </UX.Box>
      </footer>
    </UX.Box>
  );
};

export default Authority;
