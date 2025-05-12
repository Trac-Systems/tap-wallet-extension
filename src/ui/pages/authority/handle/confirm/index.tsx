import {useLocation, useNavigate} from 'react-router-dom';
import {useEffect, useMemo, useState} from 'react';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {
  InscribeOrder,
  TokenBalance,
  RawTxInfo,
  TokenInfo,
} from '@/src/wallet-instance/types';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {useAppSelector} from '@/src/ui/utils';
import {
  usePrepareSendBTCCallback,
  usePrepareSendOrdinalsInscriptionCallback,
} from '@/src/ui/pages/send-receive/hook';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {UX} from '@/src/ui/component';
import {colors} from '@/src/ui/themes/color';
import {SVG} from '@/src/ui/svg';
import {FeeRateBar} from '../../../send-receive/component/fee-rate-bar';

const HandleConfirmAuthority = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const walletProvider = useWalletProvider();

  type LocationState = {
    type: 'confirm' | 'create' | 'cancel' | 'tapping';
    inscriptionId: string;
    order?: InscribeOrder;
  };

  const {state} = location as {state: LocationState};
  // typecast for type
  const {type, inscriptionId, order} = state;
  const [feeRate, setFeeRate] = useState<number>(5);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const [loading, setLoading] = useState(false);
  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };
  const handleNavigate = async () => {
    // todo
  };

  const handleUpdateFeeRate = (feeRate: number) => {
    setFeeRate(feeRate);
  };

  //! Render
  return (
    <LayoutSendReceive
      header={
        <UX.TextHeader text={'Confirm Authority'} onBackClick={handleGoBack} />
      }
      body={
        <UX.Box layout="column" spacing="xxl" style={{width: '100%'}}>
          <UX.Box layout="column" spacing="xss">
            <UX.Text
              styleType="heading_16"
              customStyles={{color: 'white'}}
              title="Fee rate"
            />
            <FeeRateBar onChange={handleUpdateFeeRate} />
          </UX.Box>
        </UX.Box>
      }
      footer={
        <UX.Box
          layout="column"
          spacing="xl"
          style={{
            padding: '10px 0',
          }}>
          <UX.Button
            styleType="primary"
            title={'Confirm'}
            onClick={handleNavigate}
            isDisable={loading}
          />
        </UX.Box>
      }
    />
  );
};

export default HandleConfirmAuthority;
