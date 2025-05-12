import {UX} from '@/src/ui/component';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {
  usePrepareSendBTCCallback,
  usePrepareSendOrdinalsInscriptionCallback,
} from '@/src/ui/pages/send-receive/hook';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {useAppSelector} from '@/src/ui/utils';
import {InscribeOrder} from '@/src/wallet-instance/types';
import {useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {FeeRateBar} from '../../../send-receive/component/fee-rate-bar';

const HandleCancelAuthority = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const walletProvider = useWalletProvider();
  const prepareSendBTC = usePrepareSendBTCCallback();
  const prepareSendOrdinalsInscription =
    usePrepareSendOrdinalsInscriptionCallback();
  const {showToast} = useCustomToast();

  type LocationState = {
    type: 'confirm' | 'create' | 'cancel' | 'tapping';
    inscriptionId: string;
    order?: InscribeOrder;
  };

  const {state} = location as {state: LocationState};
  // typecast for type
  const {type, inscriptionId, order} = state;
  const [orderPreview, setOrderPreview] = useState<string>('');
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
      const order = await walletProvider.createOrderCancelAuthority(
        activeAccount.address,
        orderPreview,
        feeRate,
        546,
      );
      const rawTxInfo = await prepareSendBTC({
        toAddressInfo: {address: order?.payAddress, domain: ''},
        toAmount: order?.totalFee,
        feeRate: order?.feeRate || feeRate,
        enableRBF: false,
      });
      navigate('/home/inscribe-confirm', {
        state: {
          contextDataParam: {
            orderPreview,
            order,
            rawTxInfo,
          },
        },
      });
    } catch (error) {
      showToast({
        title: error.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // generate order preview
  useEffect(() => {
    const cancelContent = {
      p: 'tap',
      op: 'token-auth',
      cancel: inscriptionId,
    };
    setOrderPreview(JSON.stringify(cancelContent));
  }, [inscriptionId]);

  const handleUpdateFeeRate = (feeRate: number) => {
    setFeeRate(feeRate);
  };

  //! Render
  return (
    <LayoutSendReceive
      header={
        <UX.TextHeader text="Cancel Authority" onBackClick={handleGoBack} />
      }
      body={
        <UX.Box layout="column" spacing="xxl" style={{width: '100%'}}>
          <UX.Box layout="column" spacing="xss">
            <UX.Text styleType="body_16_bold" title={'Preview'} />
            <div
              style={{
                wordBreak: 'break-all',
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid rgb(84, 84, 84)',
                backgroundColor: 'rgba(39, 39, 39, 0.42)',
              }}>
              {orderPreview}
            </div>
          </UX.Box>

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

export default HandleCancelAuthority;
