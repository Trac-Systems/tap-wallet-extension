import { UX } from '@/src/ui/component';
import { BadgeProps } from '@/src/ui/component/badge';
import InscriptionPreview from '@/src/ui/component/inscription-preview';
import { linkDetail } from '@/src/ui/helper';
import { AccountSelector } from '@/src/ui/redux/reducer/account/selector';
import { GlobalSelector } from '@/src/ui/redux/reducer/global/selector';
import { SVG } from '@/src/ui/svg';
import { colors } from '@/src/ui/themes/color';
import {
  convertTimestampToDeviceTime,
  getInsUrl,
  getTxIdUrl,
  useAppSelector,
} from '@/src/ui/utils';
import { Network } from '@/src/wallet-instance';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthorityStatus = {
  UNCONFIRMED: {
    text: 'Unconfirmed',
    status: 'default',
  },
  CONFIRMED: {
    text: 'Confirmed',
    status: 'success',
  },
  PENDING: {
    text: 'Pending',
    status: 'warning',
  },
  TAPPED: {
    text: 'Tapped',
    status: 'error',
  },
}

const AuthorityDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;

  const network = useAppSelector(GlobalSelector.networkType);
  const inscriptionInfo = state?.inscriptionInfo;
  const isUnconfirmed = inscriptionInfo?.ts === 0;
  const urlPreview =
    network === Network.TESTNET
      ? 'https://static-testnet.unisat.io/preview/'
      : 'https://static.unisat.io/preview/';

  console.log('inscriptionInfo :>> ', inscriptionInfo);
  const inscriptionStatus = 'UNCONFIRMED'

  return (
    <UX.Box className="inscription-detail">
      <UX.Box className="image-box">
        <UX.Box onClick={() => navigate(state?.hash)} className="circle">
          <SVG.ArrowBackIcon width={24} height={24} />
        </UX.Box>
        <InscriptionPreview
          data={{ ...inscriptionInfo, inscriptionId: inscriptionInfo?.ins, outputValue: inscriptionInfo?.val, inscriptionNumber: inscriptionInfo?.num, preview: `${urlPreview}${inscriptionInfo?.ins}` }}
          preset="large"
          asLogo
        />
      </UX.Box>
      <UX.Box className="image-box-section" style={{ marginTop: '16px' }}>
        <UX.Text
          title={`Inscription ${inscriptionInfo?.num}`}
          styleType="heading_20"
          customStyles={{ marginLeft: '16px' }}
        />
        <UX.Text
          title={`${inscriptionInfo?.val} SATs`}
          styleType="body_14_bold"
          customStyles={{
            color: colors.main_500,
            marginTop: '8px',
            marginBottom: '16px',
            marginLeft: '16px',
          }}
        />
        <UX.Badge text={AuthorityStatus[inscriptionStatus].text} status={AuthorityStatus[inscriptionStatus].status as BadgeProps['status']} customStyles={{ marginLeft: '16px' }} />
        <UX.Box layout="box" spacing="xl" style={{ margin: '16px' }}>
          <UX.Section title="ID" value={inscriptionInfo?.ins} />
          <UX.Section title="Address" value={inscriptionInfo?.addr} />
          <UX.Section
            title="Output value"
            value={inscriptionInfo?.val?.toString()}
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
          <UX.Button
            styleType="primary"
            customStyles={{
              margin: '0 24px',
            }}
            title={'Tap'}
          />
        </UX.Box>
      </footer>
    </UX.Box>
  );
};

export default AuthorityDetail;
