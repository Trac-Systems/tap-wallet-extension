import {UX} from '@/src/ui/component';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {usePrepareSendBTCCallback} from '@/src/ui/pages/send-receive/hook';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {useAppSelector} from '@/src/ui/utils';
import {useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {FeeRateBar} from '../../../send-receive/component/fee-rate-bar';

enum LoadStatus {
  NOT_LOADED,
  LOADING,
  LOADED,
}

const HandleCreateAuthority = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const walletProvider = useWalletProvider();
  const prepareSendBTC = usePrepareSendBTCCallback();
  const {showToast} = useCustomToast();
  const [isWarning, setIsWarning] = useState(false);

  type LocationState = {
    type: 'force_create' | 'create';
  };

  const {state} = location as {state: LocationState};
  // typecast for type
  const {type} = state;
  const [orderPreview, setOrderPreview] = useState<string>('');
  const [feeRate, setFeeRate] = useState<number>(5);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>(LoadStatus.NOT_LOADED);
  // const [getAuthorityStatus, setGetAuthorityStatus] = useState(false);
  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };
  const handleNavigate = async () => {
    try {
      setLoadStatus(LoadStatus.LOADING);
      const _tokenAuth = await walletProvider.generateTokenAuth([], 'auth');
      const order = await walletProvider.createOrderAuthority(
        activeAccount.address,
        _tokenAuth.proto,
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
      setLoadStatus(LoadStatus.LOADED);
    }
  };

  // generate token auth
  const generateTokenAuth = async () => {
    const _tokenAuth = await walletProvider.generateTokenAuth([], 'auth');
    setOrderPreview(_tokenAuth.proto);
  };

  // get authority orders
  useEffect(() => {
    const getAuthorityOrders = async () => {
      setLoadStatus(LoadStatus.LOADING);
      const orders = await walletProvider.getAuthorityOrders(
        activeAccount.address,
      );
      // if there is no authority orders, generate token auth
      if (orders?.length) {
        // setAuthorityOrder(orders[0]);
        const authorityOrder = orders[0];

        // inscription has been created
        if (
          authorityOrder?.files?.length &&
          authorityOrder?.files[0]?.inscriptionId
        ) {
          // check if inscription appeared in the blockchain
          try {
            // check if inscription has been canceled
            const isCanceled = await walletProvider.getAuthorityCanceled(
              authorityOrder?.files[0]?.inscriptionId,
            );
            if (isCanceled) {
              // do nothing
              // continue to create authority
              return;
            }
            const inscriptionInfo =
              await walletProvider.getInscriptionInfoOrdClient(
                authorityOrder?.files[0]?.inscriptionId,
              );
            if (inscriptionInfo) {
              // go to authority detail
              navigate('/authority-detail', {
                state: {
                  inscriptionId: authorityOrder?.files[0]?.inscriptionId,
                  order: authorityOrder,
                },
              });
            } else {
              setIsWarning(true);
            }
          } catch {
            setIsWarning(true);
          }
        }
      }
      setLoadStatus(LoadStatus.LOADED);
    };
    if (type === 'force_create') {
      // do nothing
      // continue to create authority
      return;
    } else {
      getAuthorityOrders();
    }
  }, [type]);

  // generate order preview
  useEffect(() => {
    if (loadStatus === LoadStatus.LOADED) {
      generateTokenAuth();
    }
  }, [type, loadStatus]);

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
          {isWarning ? (
            <UX.Box spacing="xs">
              <UX.Box
                layout="box_border"
                spacing="sm"
                style={{background: colors.red_700}}>
                <SVG.WaringIcon />
                <UX.Text
                  styleType="body_14_bold"
                  customStyles={{color: colors.white, maxWidth: '90%'}}
                  title={
                    'You just created an authority which is being processed. Please take precautions while making continuous transactions.'
                  }
                />
              </UX.Box>
            </UX.Box>
          ) : (
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
          )}

          {!isWarning && (
            <UX.Box layout="column" spacing="xss">
              <UX.Text
                styleType="heading_16"
                customStyles={{color: 'white'}}
                title="Fee rate"
              />
              <FeeRateBar onChange={handleUpdateFeeRate} />
            </UX.Box>
          )}
        </UX.Box>
      }
      footer={
        <UX.Box
          layout="column"
          spacing="xl"
          style={{
            padding: '10px 0',
          }}>
          {!isWarning && (
            <UX.Button
              styleType="primary"
              title={'Next'}
              onClick={handleNavigate}
              isDisable={loadStatus === LoadStatus.LOADING}
            />
          )}
        </UX.Box>
      }
    />
  );
};

export default HandleCreateAuthority;
