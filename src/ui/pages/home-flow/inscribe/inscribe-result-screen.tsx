import {UX} from '@/src/ui/component';
import InscriptionPreview from '@/src/ui/component/inscription-preview';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import LayoutTap from '@/src/ui/layouts/tap';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {isEmpty} from 'lodash';
import {useEffect, useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useTapInscribeTransferHook} from './hooks';
import {OrderType} from '@/src/wallet-instance/types';

const InscribeResultScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {showToast} = useCustomToast();
  const {onConfirmInscribeTransfer, getInscribeResult} =
    useTapInscribeTransferHook();
  const {state} = location;

  const {tokenBalance, order, error} = state;

  let timeCount = 0;
  const [result, setResult] = useState<any>();
  const [closeLoading, setCloseLoading] = useState<boolean>(false);

  const handleGoBack = () => {
    return navigate('/home');
  };

  const onClickDone = () => {
    // if order type is transfer handle onConfirmInscribeTransfer
    if (order.type === OrderType.TAP_TRANSFER) {
      onConfirmInscribeTransfer(tokenBalance, result);
    } else {
      navigate('/home');
    }
  };

  const checkResult = async () => {
    let _result: any = null;
    try {
      _result = await getInscribeResult(order.orderId);
    } catch (e) {
      const txError = (e as any).message || '';
      setCloseLoading(true);
      showToast({
        title: txError,
        type: 'error',
      });
    }

    if (!_result && timeCount < 6) {
      timeCount++;
      setTimeout(() => {
        return checkResult();
      }, 1000);
    } else {
      setCloseLoading(true);
    }
    setResult(_result);
  };

  useEffect(() => {
    if (!isEmpty(order)) {
      checkResult();
    }
  }, []);

  const visibleLoading = useMemo(() => {
    if (closeLoading) {
      return false;
    }
    return !result && timeCount < 6;
  }, [result, timeCount, closeLoading]);

  if (!isEmpty(error) || isEmpty(order)) {
    return (
      <LayoutTap
        header={
          <UX.TextHeader text={'INSCRIBE FAILED'} onBackClick={handleGoBack} />
        }
        body={
          <UX.Box layout="column" style={{marginTop: '7rem'}} spacing="xl">
            <UX.Box layout="column_center" spacing="xl">
              <SVG.SendFailIcon />
              <UX.Text
                title="Payment Failed"
                styleType="heading_24"
                customStyles={{
                  marginTop: '16px',
                }}
              />
              <UX.Text
                title={error}
                styleType="body_16_normal"
                customStyles={{textAlign: 'center'}}
              />
            </UX.Box>
          </UX.Box>
        }
      />
    );
  }

  if (!result) {
    return (
      <LayoutTap
        header={<UX.TextHeader text={'INSCRIBE SUCCESS'} disableIconBack />}
        body={
          <UX.Box layout="column" style={{marginTop: '7rem'}} spacing="xl">
            <UX.Box layout="column_center" spacing="xl">
              <SVG.SendSuccessIcon />
              <UX.Text
                title="Payment Sent"
                styleType="heading_24"
                customStyles={{
                  marginTop: '16px',
                }}
              />
              <UX.Text
                title={'Your transaction has been successfully sent'}
                styleType="body_16_normal"
                customStyles={{textAlign: 'center'}}
              />
            </UX.Box>
            {visibleLoading && <UX.Loading />}
          </UX.Box>
        }
        footer={
          <UX.Box
            layout="column"
            spacing="xl"
            style={{
              padding: '10px 0',
            }}>
            {!visibleLoading && (
              <UX.Button
                styleType="primary"
                title={'Done'}
                onClick={onClickDone}
              />
            )}
          </UX.Box>
        }
      />
    );
  }

  return (
    <LayoutTap
      header={
        <UX.TextHeader text={'INSCRIBE SUCCESS'} onBackClick={handleGoBack} />
      }
      body={
        <UX.Box spacing="xxl">
          <UX.Box>
            <InscriptionPreview data={result?.inscription} preset="medium" />
          </UX.Box>
          <UX.Text
            title="The transferable and available balance of Tap will be refresh in a few minutes"
            styleType="body_14_normal"
            customStyles={{color: colors.white, textAlign: 'center'}}
          />
        </UX.Box>
      }
      footer={
        <UX.Box
          layout="column"
          spacing="xl"
          style={{
            padding: '10px 0',
          }}>
          <UX.Button styleType="primary" title={'Done'} onClick={onClickDone} />
        </UX.Box>
      }
    />
  );
};

export default InscribeResultScreen;
