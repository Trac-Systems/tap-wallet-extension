import {formatTicker, satoshisToAmount} from '@/src/shared/utils/btc-helper';
import {UX} from '@/src/ui/component';
import TransferPreviewTable from '@/src/ui/component/redeem-table/transfer-preview-table';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import LayoutTap from '@/src/ui/layouts/tap';
import {colors} from '@/src/ui/themes/color';
import {
  InscribeOrder,
  OrderType,
  RawTxInfo,
  TokenBalance,
} from '@/src/wallet-instance/types';
import {useMemo} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';

interface RedeemItem {
  tick: string;
  amt: string;
  address: string;
  dta?: string;
  appName?: string;
}

// set style for contextDataParam.order interface
interface ContextDataParam {
  order: InscribeOrder;
  tokenBalance?: TokenBalance;
  transferAmount?: string;
  rawTxInfo: RawTxInfo;
  singleTxTransfer?: RedeemItem[];
}

const InscribeConfirmScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {state} = location;
  const walletProvider = useWalletProvider();

  const contextDataParam: ContextDataParam = state?.contextDataParam || {};

  // set contextDataParam.order fit with InscribeOrder
  const order = useMemo(() => {
    return contextDataParam?.order;
  }, [contextDataParam?.order]);

  const title = useMemo(() => {
    if (contextDataParam?.order) {
      switch (contextDataParam?.order.type) {
        case OrderType.TAP_MINT:
          return 'Inscribe Mint';
        case OrderType.TAP_DEPLOY:
          return 'Inscribe Deploy';
        case OrderType.TAP_TRANSFER:
          return 'Inscribe Transfer';
        case OrderType.AUTHORITY:
          return 'Inscribe Authority';
        case OrderType.CANCEL_AUTHORITY:
          return 'Cancel Authority';
        case OrderType.REDEEM:
          return 'Inscribe Redeem';
        default:
          return 'Inscribe';
      }
    }
    return '';
  }, [contextDataParam?.order.type]);

  const fee = contextDataParam?.rawTxInfo?.fee || 0;
  const networkFee = useMemo(() => satoshisToAmount(fee), [fee]);
  const outputValue = useMemo(
    () => satoshisToAmount(order.postage),
    [order.postage],
  );
  const minerFee = useMemo(
    () => satoshisToAmount(order.networkFee + order.sizeToFee),
    [order.networkFee, order.sizeToFee],
  );
  const serviceFee = useMemo(
    () => satoshisToAmount(contextDataParam?.order?.serviceFee || 0),
    [contextDataParam?.order?.serviceFee],
  );
  const discountServiceFee = useMemo(
    () => satoshisToAmount(contextDataParam?.order?.discountServiceFee || 0),
    [contextDataParam?.order?.discountServiceFee],
  );
  const totalFee = useMemo(
    () => satoshisToAmount(Math.round(contextDataParam?.order?.totalFee || 0) + fee),
    [contextDataParam?.order?.totalFee],
  );

  const handleGoBack = () => {
    // cancel order then go back
    walletProvider.cancelOrder(contextDataParam?.order.id).then(() => {
      navigate(-1);
    });
  };

  const handleInscribeSign = () => {
    navigate('/home/inscribe-sign', {
      state: {
        tokenBalance: contextDataParam?.tokenBalance,
        rawTxInfo: contextDataParam?.rawTxInfo,
        order: contextDataParam?.order,
      },
    });
  };

  const isFormDirty = true;
  // this function only work for expand view, but not for popup view
  // please do that for popup extension
  window.addEventListener('beforeunload', function (e) {
    if (isFormDirty) {
      e.preventDefault();
      e.returnValue = ''; // Trigger the popup
    }
  });

  const previewJsonData = useMemo(() => {
    return (
      <UX.Box spacing="xs" style={{margin: '16px 0'}}>
        <UX.Text
          title="Preview"
          styleType="body_16_normal"
          customStyles={{color: colors.smoke}}
        />
        <UX.Box layout="box">
          <UX.Text
            title={`${order?.files[0]?.filename}`}
            styleType="body_10_normal"
            customStyles={{wordBreak: 'break-all'}}
          />
        </UX.Box>
      </UX.Box>
    );
  }, [order?.files]);

  const previewTransferData = useMemo(() => {
    // Transform order files data to match TransferPreviewTable format
    const transferItems = contextDataParam?.singleTxTransfer || [];

    return (
      // <UX.Box spacing="xs" style={{margin: '16px 0'}}>
      //   <UX.Text
      //     title="Preview"
      //     styleType="body_16_normal"
      //     customStyles={{color: colors.smoke}}
      //   />
      <TransferPreviewTable
        items={transferItems}
        showHeaders={true}
        compact={true}
        customHeaders={{
          token: 'Token',
          amount: 'Amount',
          receiver: 'Receiver',
          appName: 'App'
        }}
        enableToggle={true}
      />
      // </UX.Box>
    );
  }, [
    order?.files,
    contextDataParam?.tokenBalance?.ticker,
    contextDataParam?.transferAmount,
  ]);

  return (
    <LayoutTap
      header={<UX.TextHeader text={title} onBackClick={handleGoBack} />}
      body={
        <UX.Box style={{width: '100%'}}>
          <UX.Box spacing="xxl">
            {/* show if order type is tap */}
            {contextDataParam?.order.type === OrderType.TAP_TRANSFER && (
              <UX.Box layout="row_center" spacing="xs">
                <UX.Text
                  title={contextDataParam?.transferAmount}
                  styleType="heading_16"
                />
                <UX.Text
                  title={formatTicker(contextDataParam?.tokenBalance.ticker)}
                  styleType="heading_16"
                  customStyles={{color: colors.main_500, whiteSpace: 'pre'}}
                />
              </UX.Box>
            )}
            {/* show if order type is redeem, show transfer data */}
            {contextDataParam?.order.type === OrderType.REDEEM
              ? previewTransferData
              : previewJsonData}

            <UX.Box spacing="xs">
              <UX.Box layout="row_between">
                <UX.Text
                  title="Payment Network Fee"
                  styleType="body_16_normal"
                />
                <UX.Text
                  title={`${networkFee} BTC`}
                  styleType="body_16_normal"
                  customStyles={{color: colors.white}}
                />
              </UX.Box>

              <UX.Box layout="row_between">
                <UX.Text
                  title="Inscription Output Value"
                  styleType="body_16_normal"
                />
                <UX.Text
                  title={`${outputValue} BTC`}
                  styleType="body_16_normal"
                  customStyles={{color: colors.white}}
                />
              </UX.Box>
              <UX.Box layout="row_between">
                <UX.Text
                  title="Inscription Network Fee"
                  styleType="body_16_normal"
                />
                <UX.Text
                  title={`${minerFee} BTC`}
                  styleType="body_16_normal"
                  customStyles={{color: colors.white}}
                />
              </UX.Box>
              <UX.Box layout="row_between">
                <UX.Text title="Service Fee" styleType="body_16_normal" />
                {Number(discountServiceFee) > 0 ? (
                  <UX.Text
                    title={`${discountServiceFee} BTC`}
                    styleType="body_16_normal"
                    customStyles={{
                      color: colors.smoke,
                      textDecorationLine: 'line-through',
                    }}
                  />
                ) : (
                  <UX.Text
                    title={`${serviceFee} BTC`}
                    styleType="body_16_normal"
                    customStyles={{color: colors.white}}
                  />
                )}
              </UX.Box>

              <UX.Box layout="row_between">
                <UX.Text title="Total" styleType="body_16_normal" />
                <UX.Text
                  title={`${totalFee} BTC`}
                  styleType="body_16_normal"
                  customStyles={{color: colors.main_500}}
                />
              </UX.Box>
            </UX.Box>
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
            onClick={handleInscribeSign}
          />
        </UX.Box>
      }
    />
  );
};

export default InscribeConfirmScreen;
