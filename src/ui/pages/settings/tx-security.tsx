import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import type {AuthInputRef} from '../../component/auth-input';
import LayoutSendReceive from '../../layouts/send-receive';
import {SVG} from '../../svg';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {useCustomToast} from '../../component/toast-custom';
import {isValidAuthInput} from '../../utils';
import {
  usePushBitcoinTxCallback,
  usePushOrdinalsTxCallback,
} from '../send-receive/hook';
import {
  InscribeOrder,
  TokenBalance,
  TxInput,
  TxType,
} from '../../../wallet-instance';
interface LocationState {
  rawtx: 'string';
  type: TxType;
  tokenBalance?: TokenBalance;
  order: InscribeOrder;
  spendInputs: TxInput[];
}

const TxSecurity = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const {rawtx, type, tokenBalance, order, spendInputs}: LocationState =
    location.state;
  const wallet = useWalletProvider();
  const pushBitcoinTx = usePushBitcoinTxCallback();
  const pushOrdinalsTx = usePushOrdinalsTxCallback();
  const pinInputRef = useRef<AuthInputRef>(null);
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

  const spendUtxos = useMemo(() => {
    return spendInputs.map(input => input.utxo);
  }, [spendInputs]);

  const handleSubmit = async () => {
    setLoading(true);
    // unlock app
    try {
      await wallet.unlockApp(valueInput);
    } catch (e: any) {
      showToast({
        title: e?.message || 'Wrong Password',
        type: 'error',
      });
      setLoading(false);
      return;
    }
    // push tx
    try {
      switch (type) {
        case TxType.SEND_ORDINALS_INSCRIPTION: {
          const {success, txid, error} = await pushOrdinalsTx(
            rawtx,
            spendUtxos,
          );
          if (success) {
            navigate('/home/send-success', {state: {txid}});
          } else {
            navigate('/home/send-fail', {state: {error}});
          }
          break;
        }

        case TxType.INSCRIBE_TAP: {
          try {
            const {success, error, txid} = await pushBitcoinTx(rawtx, spendUtxos);
            if (success && order?.id) {
              await wallet.paidOrder(order.id);
              navigate('/home/inscribe-result', {
                state: {
                  order,
                  tokenBalance,
                  txid,
                },
              });
            } else {
              if (order?.id) {
                await wallet.cancelOrder(order.id);
              }
              navigate('/home/inscribe-result', {
                state: {error},
              });
            }
          } catch (e: any) {
            if (order?.id) {
              await wallet.cancelOrder(order.id);
            }
            showToast({
              title: e?.message || 'Unknown error',
              type: 'error',
            });
          }
          break;
        }

        case TxType.TAPPING: {
          const {success, txid, error} = await pushOrdinalsTx(
            rawtx,
            spendUtxos,
          );
          if (success && order?.id) {
            await wallet.tappingOrder(order.id);
            navigate('/home/send-success', {state: {txid}});
          } else {
            navigate('/home/send-fail', {state: {error}});
          }
          break;
        }

        default: {
          const {success, txid, error} = await pushBitcoinTx(rawtx, spendUtxos);
          if (success) {
            navigate('/home/send-success', {state: {txid}});
          } else {
            navigate('/home/send-fail', {state: {error}});
          }
          break;
        }
      }
    } catch (error) {
      showToast({
        title: error?.message || 'Unknown error',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!disabled && 'Enter' == e.key) {
      handleSubmit();
    }
  };

  //! Effect
  useEffect(() => {
    setDisabled(!isValidAuthInput(valueInput));
  }, [valueInput]);

  //! Render
  if (loading) {
    return <UX.Loading />;
  }

  return (
    <LayoutSendReceive
      header={<UX.TextHeader onBackClick={handleGoBack} />}
      body={
        <UX.Box layout="column_center" style={{marginTop: '5rem', width: '100%', maxWidth: '500px'}} spacing="xl">
          <SVG.UnlockIcon />
          <UX.Text
            title="Password"
            styleType="heading_24"
            customStyles={{
              marginTop: '16px',
            }}
          />
          <UX.Text
            title="Enter your password to confirm the transaction"
            styleType="body_16_normal"
            customStyles={{textAlign: 'center'}}
          />
          <UX.AuthInput
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
