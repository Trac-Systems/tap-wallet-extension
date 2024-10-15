import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {UX} from '../component';
import {PinInputRef} from '../component/pin-input';
import {useCustomToast} from '../component/toast-custom';
import {useWalletProvider} from '../gateway/wallet-provider';
import LayoutLogin from '../layouts/login';
import {GlobalActions} from '../redux/reducer/global/slice';
import {SVG} from '../svg';
import {useAppDispatch} from '../utils';
import {useApproval} from './approval/hook';

const LoginPage = () => {
  //! State
  const navigate = useNavigate();
  const wallet = useWalletProvider();
  const dispatch = useAppDispatch();
  const [, resolveApproval] = useApproval();
  const {showToast} = useCustomToast();

  const pinInputRef = useRef<PinInputRef>(null);
  const [valueInput, setValueInput] = useState('');
  const [disabled, setDisabled] = useState(true);

  //! Function
  const handleOnChange = (pwd: string) => {
    setValueInput(pwd);
  };

  const handleNavigate = async () => {
    // const uiType = getUiType();
    try {
      await wallet.unlockApp(valueInput);
      await resolveApproval();
      dispatch(GlobalActions.update({isUnlocked: true}));
      return navigate('/');
    } catch (error) {
      setValueInput('');
      pinInputRef.current?.clearPin();
      showToast({
        title: error.message,
        type: 'error',
      });
    }
  };

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!disabled && 'Enter' == e.key) {
      handleNavigate();
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
  return (
    <LayoutLogin
      body={
        <UX.Box layout="column_center" spacing="xl">
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
            onClick={handleNavigate}
            isDisable={disabled}
          />
        </UX.Box>
      }
    />
  );
};

export default LoginPage;
