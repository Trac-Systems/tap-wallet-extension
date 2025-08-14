import {UX} from '@/src/ui/component';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {usePrepareSendBTCCallback} from '@/src/ui/pages/send-receive/hook';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {useAppSelector} from '@/src/ui/utils';
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {FeeRateBar} from '../../../send-receive/component/fee-rate-bar';

enum LoadStatus {
  NOT_LOADED,
  LOADING,
  LOADED,
}

const HandleCreateAuthority = () => {
  //! State
  const navigate = useNavigate();
  const walletProvider = useWalletProvider();
  const prepareSendBTC = usePrepareSendBTCCallback();
  const {showToast} = useCustomToast();

  // typecast for type
  const [orderPreview, setOrderPreview] = useState<string>('');
  const [feeRate, setFeeRate] = useState<number>(5);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>(
    LoadStatus.NOT_LOADED,
  );
  // const [getAuthorityStatus, setGetAuthorityStatus] = useState(false);
  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };
  const handleNavigate = async () => {
    try {
      setLoadStatus(LoadStatus.LOADING);
      const order = await walletProvider.createOrderAuthority(
        activeAccount.address,
        orderPreview,
        feeRate,
        546,
      );
      const rawTxInfo = await prepareSendBTC({
        toAddressInfo: {address: order?.payAddress, domain: ''},
        toAmount: Math.round(order?.totalFee || 0),
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
      setLoadStatus(LoadStatus.LOADED);
    }
  };

  // generate token auth
  const generateTokenAuth = async () => {
    const _tokenAuth = await walletProvider.generateTokenAuth([], 'auth');
    setOrderPreview(_tokenAuth.proto);
  };

  // generate order preview
  useEffect(() => {
    generateTokenAuth();
  }, []);

  const handleUpdateFeeRate = (feeRate: number) => {
    setFeeRate(feeRate);
  };

  //! Render
  return (
    <LayoutSendReceive
      header={
        <UX.TextHeader text="Create Authority" onBackClick={handleGoBack} />
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
            title={'Next'}
            onClick={handleNavigate}
            isDisable={loadStatus === LoadStatus.LOADING && orderPreview === ''}
          />
        </UX.Box>
      }
    />
  );
};

export default HandleCreateAuthority;
