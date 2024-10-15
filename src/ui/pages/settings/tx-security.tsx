import React, {useEffect, useRef, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import {PinInputRef} from '../../component/pin-input';
import LayoutSendReceive from '../../layouts/send-receive';
import {SVG} from '../../svg';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {useCustomToast} from '../../component/toast-custom';
import {
  usePushBitcoinTxCallback,
  usePushOrdinalsTxCallback,
} from '../send-receive/hook';
import {InscribeOrder, TokenBalance, TxType} from '../../../wallet-instance';
interface LocationState {
  rawtx: 'string';
  type: TxType;
  tokenBalance?: TokenBalance;
  order: InscribeOrder;
}

const TxSecurity = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const {rawtx, type, tokenBalance, order}: LocationState = location.state;
  const wallet = useWalletProvider();
  const pushBitcoinTx = usePushBitcoinTxCallback();
  const pushOrdinalsTx = usePushOrdinalsTxCallback();
  const pinInputRef = useRef<PinInputRef>(null);
  const [valueInput, setValueInput] = useState('');
  const [disabled, setDisabled] = useState(true);
  const {showToast} = useCustomToast();
  const [loading, setLoading] = useState(false);
  //! Function
  const handleGoBack = () => {
    return navigate(-1);
  };

  const handleOnChange = (pwd: string) => {
    setValueInput(pwd);
  };

  const handleSubmit = async () => {
    setLoading(true);
    await wallet
      .unlockApp(valueInput)
      .then(() => {
        switch (type) {
          case TxType.SEND_ORDINALS_INSCRIPTION:
            pushOrdinalsTx(rawtx).then(({success, txid, error}) => {
              if (success) {
                navigate('/home/send-success', {state: {txid}});
              } else {
                navigate('/home/send-fail', {state: {error}});
              }
            });
            break;
          case TxType.INSCRIBE_TAP:
            try {
              pushBitcoinTx(rawtx).then(({success, error}) => {
                if (success) {
                  navigate('/home/inscribe-result', {
                    state: {
                      order,
                      tokenBalance,
                    },
                  });
                } else {
                  navigate('/home/inscribe-result', {
                    state: {
                      error,
                    },
                  });
                }
              });
            } catch (e: any) {
              showToast({
                title: (e as Error).message || '',
                type: 'error',
              });
            }
            break;
          default:
            pushBitcoinTx(rawtx).then(({success, txid, error}) => {
              if (success) {
                navigate('/home/send-success', {state: {txid}});
              } else {
                navigate('/home/send-fail', {state: {error}});
              }
            });
            break;
        }
      })
      .catch(() => {
        setLoading(false);
        showToast({
          title: 'Wrong PIN',
          type: 'error',
        });
        setValueInput('');
        pinInputRef.current?.clearPin();
      });
  };

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!disabled && 'Enter' == e.key) {
      handleSubmit();
    }
  };

  //! Effect
  useEffect(() => {
    setDisabled(true);
    if (valueInput?.length === 4) {
      setDisabled(false);
    }
  }, [valueInput]);

  //! Render
  if (loading) {
    return <UX.Loading />;
  }

  return (
    <LayoutSendReceive
      header={<UX.TextHeader onBackClick={handleGoBack} />}
      body={
        <UX.Box layout="column_center" style={{marginTop: '5rem'}} spacing="xl">
          <SVG.UnlockIcon />
          <UX.Text
            title="PIN"
            styleType="heading_24"
            customStyles={{
              marginTop: '16px',
            }}
          />
          <UX.Text
            title="Enter your PIN code to confirm the transaction"
            styleType="body_16_normal"
            customStyles={{textAlign: 'center'}}
          />
          <UX.PinInput
            onChange={handleOnChange}
            onKeyUp={e => handleOnKeyUp(e)}
            ref={pinInputRef}
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
          <UX.Button
            styleType="primary"
            title="Confirm"
            onClick={handleSubmit}
            isDisable={disabled}
          />
        </UX.Box>
      }
    />
  );
};

export default TxSecurity;
