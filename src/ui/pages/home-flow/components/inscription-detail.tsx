import {UX} from '@/src/ui/component';
import InscriptionPreview from '@/src/ui/component/inscription-preview';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {useLocation, useNavigate} from 'react-router-dom';
import {useEffect, useState} from 'react';
import {Inscription} from '@/src/wallet-instance';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {convertTimestampToDeviceTime, getTxIdUrl} from '@/src/ui/utils';

const InscriptionDetail = () => {
  const navigate = useNavigate();
  const {showToast} = useCustomToast();
  const wallet = useWalletProvider();
  const location = useLocation();
  const {state} = location;
  const [isLoading, setLoading] = useState<boolean>(false);
  const [inscriptionInfo, setInscriptionInfo] = useState<Inscription>();

  const isUnconfirmed = inscriptionInfo?.timestamp === 0;
  const getInscriptionInfo = async () => {
    try {
      setLoading(true);
      const inscription = await wallet.getInscriptionInfo(state?.inscriptionId);
      setInscriptionInfo(inscription);
    } catch (err) {
      showToast({
        title: `${(err as Error).message}`,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getInscriptionInfo();
  }, []);

  if (isLoading) {
    return <UX.Loading />;
  }

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
        <UX.Box layout="box" spacing="xl" style={{margin: '16px'}}>
          <UX.Section title="ID" value={inscriptionInfo?.inscriptionId} />
          <UX.Section title="Address" value={inscriptionInfo?.address} />
          <UX.Section
            title="Output value"
            value={inscriptionInfo?.outputValue.toString()}
          />
          <UX.Section
            title="Content length"
            value={inscriptionInfo?.contentLength.toString()}
          />
          <UX.Section
            title="Content type"
            value={inscriptionInfo?.contentType}
          />
          <UX.Section
            title="Timestamp"
            value={
              isUnconfirmed
                ? 'unconfirmed'
                : convertTimestampToDeviceTime(inscriptionInfo?.timestamp)
            }
          />
          <UX.Section
            title="Genesis transaction"
            value={getTxIdUrl(inscriptionInfo?.genesisTransaction)}
            link={getTxIdUrl(inscriptionInfo?.genesisTransaction)}
          />
        </UX.Box>
      </UX.Box>
    </UX.Box>
  );
};

export default InscriptionDetail;
