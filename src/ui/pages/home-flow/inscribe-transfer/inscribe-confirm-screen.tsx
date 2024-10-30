import {formatTicker, satoshisToAmount} from '@/src/shared/utils/btc-helper';
import {UX} from '@/src/ui/component';
import LayoutTap from '@/src/ui/layouts/tap';
import {colors} from '@/src/ui/themes/color';
import {useMemo} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';

const InscribeConfirmScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {state} = location;

  const contextDataParam = state?.contextDataParam || {};

  const fee = contextDataParam?.rawTxInfo?.fee || 0;
  const networkFee = useMemo(() => satoshisToAmount(fee), [fee]);
  const outputValue = useMemo(
    () => satoshisToAmount(contextDataParam?.order.outputValue),
    [contextDataParam?.order.outputValue],
  );
  const minerFee = useMemo(
    () => satoshisToAmount(contextDataParam?.order.minerFee + fee),
    [contextDataParam?.order.minerFee],
  );
  const originServiceFee = useMemo(
    () => satoshisToAmount(contextDataParam?.order.originServiceFee),
    [contextDataParam?.order.originServiceFee],
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
    navigate('/home/inscribe-sign-tap', {
      state: {
        tokenBalance: contextDataParam.tokenBalance,
        rawTxInfo: contextDataParam?.rawTxInfo,
        order: contextDataParam?.order,
      },
    });
  };

  return (
    <LayoutTap
      header={
        <UX.TextHeader text={'Inscribe Transfer'} onBackClick={handleGoBack} />
      }
      body={
        <UX.Box style={{width: '100%'}}>
          <UX.Box spacing="xxl">
            <UX.Box layout="row_center" spacing="xs">
              <UX.Text
                title={contextDataParam?.amount}
                styleType="heading_16"
              />
              <UX.Text
                title={formatTicker(contextDataParam?.tokenBalance.ticker)}
                styleType="heading_16"
                customStyles={{color: colors.main_500}}
              />
            </UX.Box>
            <UX.Box spacing="xs" style={{margin: '16px 0'}}>
              <UX.Text
                title="Preview"
                styleType="body_16_normal"
                customStyles={{color: colors.smoke}}
              />
              <UX.Box layout="box">
                <UX.Text
                  title={`{${'"p":"tap","op":"token-transfer"'},"tick":"${contextDataParam?.tokenBalance.ticker}","amt":"${
                    contextDataParam?.amount
                  }"}`}
                  styleType="body_10_normal"
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
                {originServiceFee && originServiceFee !== serviceFee ? (
                  <UX.Text
                    title={`${originServiceFee} BTC`}
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
                    customStyles={{
                      color: colors.smoke,
                      textDecorationLine: 'line-through',
                    }}
                  />
                )}
              </UX.Box>
              {originServiceFee && originServiceFee !== serviceFee && (
                <UX.Box layout="row_between">
                  <UX.Text title="" styleType="body_16_normal" />
                  <UX.Text
                    title={`${serviceFee} BTC`}
                    styleType="body_16_normal"
                    customStyles={{color: colors.white}}
                  />
                </UX.Box>
              )}

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
