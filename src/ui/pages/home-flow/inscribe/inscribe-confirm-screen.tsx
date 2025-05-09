import {formatTicker, satoshisToAmount} from '@/src/shared/utils/btc-helper';
import {UX} from '@/src/ui/component';
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

// set style for contextDataParam.order interface
interface ContextDataParam {
  order: InscribeOrder;
  tokenBalance?: TokenBalance;
  transferAmount?: string;
  rawTxInfo: RawTxInfo;
}

const InscribeConfirmScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {state} = location;

  const contextDataParam: ContextDataParam = state?.contextDataParam || {};

  // debug log order

  // set contextDataParam.order fit with InscribeOrder
  const order = useMemo(() => {
    return contextDataParam?.order;
  }, [contextDataParam?.order]);

  const title = useMemo(() => {
    switch (contextDataParam?.order.type) {
      case OrderType.TAP_MINT:
        return 'Inscribe Mint';
      case OrderType.TAP_DEPLOY:
        return 'Inscribe Deploy';
      case OrderType.TAP_TRANSFER:
        return 'Inscribe Transfer';
      case OrderType.FILE:
        return 'Inscribe File';
      case OrderType.TEXT:
        return 'Inscribe Text';
      case OrderType.AUTHORITY:
        return 'Inscribe Authority';
      case OrderType.REDEEM:
        return 'Inscribe Redeem';
      default:
        return 'Inscribe';
    }
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
    () => satoshisToAmount(contextDataParam?.order.serviceFee),
    [contextDataParam?.order.serviceFee],
  );
  const totalFee = useMemo(
    () => satoshisToAmount(contextDataParam?.order.totalFee + fee),
    [contextDataParam?.order.totalFee],
  );

  const handleGoBack = () => {
    navigate(-1);
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
                <UX.Text
                  title={`${serviceFee} BTC`}
                  styleType="body_16_normal"
                  customStyles={{
                    color: colors.smoke,
                    textDecorationLine: 'line-through',
                  }}
                />
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
