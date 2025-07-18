import {UX} from '@/src/ui/component';
import InscriptionPreview from '@/src/ui/component/inscription-preview';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import { linkDetail } from '@/src/ui/helper';
import { AccountSelector } from '@/src/ui/redux/reducer/account/selector';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {
  convertTimestampToDeviceTime,
  getInsUrl,
  getTxIdUrl,
  useAppSelector,
} from '@/src/ui/utils';
import {Inscription} from '@/src/wallet-instance';
import {useEffect, useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';

const InscriptionDetail = () => {
  const navigate = useNavigate();
  const {showToast} = useCustomToast();
  const wallet = useWalletProvider();
  const location = useLocation();
  const {state} = location;
  const [isLoading, setLoading] = useState<boolean>(false);
  const [changeInscription, setChangeInscription] = useState<boolean>(false);
  const [inscriptions, setInscription] = useState<Inscription[]>();

  const network = useAppSelector(GlobalSelector.networkType);
  const dmtCollectibleMap = useAppSelector(AccountSelector.dmtCollectibleMap);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);

  const inscriptionInfo = useMemo(() => {
    if (!inscriptions?.length) {
      return;
    }
    return inscriptions.filter(
      ins => ins.inscriptionId === state?.inscriptionId,
    )[0];
  }, [inscriptions]);

  const isUnconfirmed = inscriptionInfo?.timestamp === 0;
  
  const isOwnedByCurrentUser = useMemo(() => {
    return inscriptionInfo?.address === activeAccount?.address;
  }, [inscriptionInfo?.address, activeAccount?.address]);
  
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

  useEffect(() => {
    getInscriptionInfo();
  }, []);

  if (isLoading || !inscriptionInfo) {
    return <UX.Loading />;
  }

  return (
    <UX.Box className="inscription-detail">
      <UX.Box className="image-box">
        <UX.Box onClick={() => navigate(state?.hash)} className="circle">
          <SVG.ArrowBackIcon width={24} height={24} />
        </UX.Box>
        <InscriptionPreview
          data={inscriptionInfo}
          preset="large"
          asLogo
          changeInscription={changeInscription}
          handleChangeInscription={() =>
            setChangeInscription(!changeInscription)
          }
          isCollectibles={state.isCollectibles ?? false}
        />
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
        {inscriptionInfo?.hasMoreInscriptions &&
        inscriptionInfo?.hasMoreInscriptions.length > 1 ? (
          <UX.Box
            layout="row"
            style={{
              marginTop: 20,
              marginBottom: '16px',
              marginLeft: '16px',
              maxWidth: '90%',
            }}>
            <UX.Box style={{minWidth: 25}}>
              <SVG.WaringIcon />
            </UX.Box>
            <UX.Text
              styleType="body_14_bold"
              title="This inscription shares the same utxo with some other inscriptions. If you send this inscription, other inscriptions with same utxo will be sent along with it"
              customStyles={{
                color: colors.yellowRgba60,
                marginTop: 0,
                marginLeft: 5,
                textAlign: 'justify',
              }}
            />
          </UX.Box>
        ) : null}
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
            value={getTxIdUrl(inscriptionInfo?.genesisTransaction, network)}
            link={getTxIdUrl(inscriptionInfo?.genesisTransaction, network)}
          />
          <UX.Section
            title="Preview"
            value={getInsUrl(inscriptionInfo?.inscriptionId, network)}
            link={getInsUrl(inscriptionInfo?.inscriptionId, network)}
          />
          {dmtCollectibleMap[inscriptionInfo?.inscriptionId]? (
            <UX.Section title="Details" value={`${linkDetail}/${inscriptionInfo.inscriptionId}`} link={`${linkDetail}/${inscriptionInfo.inscriptionId}`} />
          ) : null}
        </UX.Box>
      </UX.Box>

      {isOwnedByCurrentUser && (
        <footer className="footer_sr">
          <UX.Box
            layout="column"
            spacing="xl"
            className="footer_sr"
            style={{
              padding: '10px 0',
            }}>
            <UX.Button
              styleType="primary"
              customStyles={{
                margin: '0 24px',
              }}
              title={'Send'}
              onClick={() =>
                navigate('/home/send-inscription', {
                  state: {inscriptions: inscriptions},
                })
              }
            />
          </UX.Box>
        </footer>
      )}
    </UX.Box>
  );
};

export default InscriptionDetail;
