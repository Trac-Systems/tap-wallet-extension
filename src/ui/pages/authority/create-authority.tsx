import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import LayoutSendReceive from '../../layouts/send-receive';
import {FeeRateBar} from '../send-receive/component/fee-rate-bar';
import {useEffect, useState} from 'react';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {
  InscribeOrder,
  TokenBalance,
  RawTxInfo,
  TokenInfo,
} from '@/src/wallet-instance/types';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {useAppSelector} from '@/src/ui/utils';
import {usePrepareSendBTCCallback} from '@/src/ui/pages/send-receive/hook';

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

const CreateAuthority = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const walletProvider = useWalletProvider();
  const prepareSendBTC = usePrepareSendBTCCallback();

  const {state} = location;
  const type = state.type;
  const title =
    type === 'create'
      ? 'Create Authority'
      : type === 'confirm'
        ? 'Confirm Authority'
        : 'Cancel Authority';
  const [tokenAuth, setTokenAuth] = useState<string>('');
  const [order, setOrder] = useState<InscribeOrder | null>(null);
  const [feeRate, setFeeRate] = useState<number>(5);
  const [rawTxInfo, setRawTxInfo] = useState<RawTxInfo | null>(null);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };
  const handleNavigate = () => {
    // TODO: create order authority instead through useEffect
    navigate('/home/inscribe-confirm', {
      state: {
        contextDataParam: {
          rawTxInfo,
          order,
        },
      },
    });
  };

  // generate token auth
  useEffect(() => {
    const generateTokenAuth = async () => {
      if (type === 'create') {
        const _tokenAuth = await walletProvider.generateTokenAuth([], 'auth');
        setTokenAuth(_tokenAuth.proto);
      }
    };
    generateTokenAuth();
  }, [type]);

  // create order authority
  useEffect(() => {
    const createOrderAuthority = async () => {
      const order = await walletProvider.createOrderAuthority(
        activeAccount.address,
        tokenAuth,
        feeRate,
        546,
      );
      setOrder(order);
    };
    createOrderAuthority();
  }, [tokenAuth, feeRate]);

  // prepare raw tx info
  useEffect(() => {
    const prepareRawTxInfo = async () => {
      const rawTxInfo = await prepareSendBTC({
        toAddressInfo: {address: order?.payAddress, domain: ''},
        toAmount: order?.totalFee,
        feeRate: order?.feeRate || feeRate,
        enableRBF: false,
      });
      setRawTxInfo(rawTxInfo);
    };
    prepareRawTxInfo();
  }, [order]);

  const handleUpdateFeeRate = (feeRate: number) => {
    setFeeRate(feeRate);
  };

  //! Render
  return (
    <LayoutSendReceive
      header={<UX.TextHeader text={title} onBackClick={handleGoBack} />}
      body={
        <UX.Box layout="column" spacing="xxl" style={{width: '100%'}}>
          {type === 'confirm' ? null : (
            <UX.Box layout="column" spacing="xss">
              <UX.Text
                styleType="body_16_bold"
                title={type === 'cancel' ? 'Cancel Authority' : 'Preview'}
              />
              {/* disable edit */}
              <UX.TextArea
                height="230px"
                disabled
                placeholder={tokenAuth}
                className="textareaWidth"
              />
            </UX.Box>
          )}

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
            title={type !== 'create' ? 'Confirm' : 'Create'}
            onClick={handleNavigate}
          />
        </UX.Box>
      }
    />
  );
};

export default CreateAuthority;
