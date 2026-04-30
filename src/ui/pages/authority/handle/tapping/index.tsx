import {UX} from '@/src/ui/component';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {usePrepareSendOrdinalsInscriptionCallback} from '@/src/ui/pages/send-receive/hook';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {useAppSelector} from '@/src/ui/utils';
import {InscribeOrder} from '@/src/wallet-instance/types';
import {useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {FeeRateBar} from '../../../send-receive/component/fee-rate-bar';
import { useCustomToast } from '@/src/ui/component/toast-custom';
import {useI18n} from '@/src/ui/i18n';

const HandleTappingAuthority = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const prepareSendOrdinalsInscription =
    usePrepareSendOrdinalsInscriptionCallback();
  const {showToast} = useCustomToast();
  const {t} = useI18n();
  type LocationState = {
    inscriptionId: string;
    order?: InscribeOrder;
  };

  const {state} = location as {state: LocationState};
  // typecast for type
  const {inscriptionId, order} = state;
  // switch title based on type
  const [feeRate, setFeeRate] = useState<number>(5);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const [loading, setLoading] = useState(false);
  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleNavigate = async () => {
    try {
      setLoading(true);
      const rawTxInfo = await prepareSendOrdinalsInscription({
        toAddressInfo: {address: activeAccount.address, domain: ''},
        inscriptionId,
        feeRate,
        enableRBF: false,
      });

      navigate('/handle-taping-confirm', {
        state: {rawTxInfo, order},
      });
    } catch (error) {
      showToast({
        title: error.message || t('authority.tapFailed'),
        type: 'error',
      });
      console.log('error :>> ', error);
    }
    setLoading(false);
  };

  const handleUpdateFeeRate = (feeRate: number) => {
    setFeeRate(feeRate);
  };

  //! Render
  return (
    <LayoutSendReceive
      header={
        <UX.TextHeader textKey="authority.tapping" onBackClick={handleGoBack} />
      }
      body={
        <UX.Box layout="column" spacing="xxl" style={{width: '100%'}}>
          <UX.Box layout="column" spacing="xss">
            <UX.Text
              styleType="heading_16"
              customStyles={{color: 'white'}}
              titleKey="transaction.feeRate"
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
            titleKey="common.confirm"
            onClick={handleNavigate}
            isDisable={loading}
          />
        </UX.Box>
      }
    />
  );
};

export default HandleTappingAuthority;
