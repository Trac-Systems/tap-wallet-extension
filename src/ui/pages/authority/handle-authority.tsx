import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import LayoutSendReceive from '../../layouts/send-receive';
import {FeeRateBar} from '../send-receive/component/fee-rate-bar';
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
import {useCustomToast} from '../../component/toast-custom';
import {colors} from '../../themes/color';
import {SVG} from '../../svg';

// interface ContextData {
//   ticker: string;
//   session?: any;
//   tokenBalance?: TokenBalance;
//   order?: InscribeOrder;
//   rawTxInfo?: RawTxInfo;
//   amount?: string;
//   isApproval: boolean;
//   tokenInfo?: TokenInfo;
// }

// interface UpdateContextDataParams {
//   ticket?: string;
//   session?: any;
//   tokenBalance?: TokenBalance;
//   order?: InscribeOrder;
//   rawTxInfo?: RawTxInfo;
//   amount?: string;
// }

const HandleAuthority = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const walletProvider = useWalletProvider();
  const prepareSendBTC = usePrepareSendBTCCallback();
  const prepareSendOrdinalsInscription =
    usePrepareSendOrdinalsInscriptionCallback();
  const {showToast} = useCustomToast();
  const [isWarning, setIsWarning] = useState(false);

  const {state} = location;
  // typecast for type
  const type = state.type as 'create' | 'confirm' | 'cancel' | 'tapping';
  const inscriptionId = state.inscriptionId;
  // switch title based on type
  const title = useMemo(() => {
    switch (type) {
      case 'create':
        return 'Create Authority';
      case 'confirm':
        return 'Confirm Authority';
      case 'cancel':
        return 'Cancel Authority';
      case 'tapping':
        return 'Tapping Authority';
      default:
        return '';
    }
  }, [type]);
  const showPreview = type !== 'tapping' && type !== 'confirm';
  const [tokenAuth, setTokenAuth] = useState<string>('');
  const [feeRate, setFeeRate] = useState<number>(5);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const [loading, setLoading] = useState(false);
  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };
  const handleNavigate = async () => {
    if (type === 'create') {
      try {
        setLoading(true);
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
              tokenAuth,
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

      return;
    }
    if (type === 'tapping') {
      const rawTxInfo = await prepareSendOrdinalsInscription({
        toAddressInfo: {address: activeAccount.address, domain: ''},
        inscriptionId,
        feeRate,
        enableRBF: false,
      });

      navigate('/home/send-inscription-confirm', {
        state: {rawTxInfo},
      });
      // TODO: create order authority instead through useEffect
      // navigate('/home/inscribe-confirm', {
      //   state: {
      //     contextDataParam: {
      //       rawTxInfo,
      //     },
      //   },
      // });
    }
    // navigate('/home/inscribe-confirm', {
    //   state: {
    //     contextDataParam: {
    //       rawTxInfo,
    //       order,
    //     },
    //   },
    // });
  };

  // generate token auth
  const generateTokenAuth = async () => {
    if (type === 'create') {
      const _tokenAuth = await walletProvider.generateTokenAuth([], 'auth');
      setTokenAuth(_tokenAuth.proto);
    }
  };

  // get authority orders
  useEffect(() => {
    const getAuthorityOrders = async () => {
      const orders = await walletProvider.getAuthorityOrders(
        activeAccount.address,
      );
      // if there is no authority orders, generate token auth
      if (!orders?.length) {
        generateTokenAuth();
      } else {
        // setAuthorityOrder(orders[0]);
        const authorityOrder = orders[0];

        // inscription has been created
        if (
          authorityOrder?.files?.length &&
          authorityOrder?.files[0]?.inscriptionId
        ) {
          // check if inscription appeared in the blockchain
          try {
            const inscriptionInfo =
              await walletProvider.getInscriptionInfoOrdClient(
                authorityOrder?.files[0]?.inscriptionId,
              );
            if (inscriptionInfo) {
              // go to authority detail
              navigate('/manage-authority/authority-detail', {
                state: {
                  inscriptionId: authorityOrder?.files[0]?.inscriptionId,
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
    };
    if (type === 'create') {
      getAuthorityOrders();
    }
  }, []);

  const handleUpdateFeeRate = (feeRate: number) => {
    setFeeRate(feeRate);
  };

  //! Render
  return (
    <LayoutSendReceive
      header={<UX.TextHeader text={title} onBackClick={handleGoBack} />}
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
          ) : showPreview ? (
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
                {tokenAuth}
              </div>
            </UX.Box>
          ) : null}

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
          <UX.Button
            styleType="primary"
            title={type !== 'create' ? 'Confirm' : 'Next'}
            onClick={handleNavigate}
            isDisable={loading}
          />
        </UX.Box>
      }
    />
  );
};

export default HandleAuthority;
