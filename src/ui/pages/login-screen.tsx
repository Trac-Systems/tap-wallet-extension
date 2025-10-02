import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {UX} from '../component';
import type {AuthInputRef} from '../component/auth-input';
import {useCustomToast} from '../component/toast-custom';
import {useWalletProvider} from '../gateway/wallet-provider';
import LayoutLogin from '../layouts/login';
import {GlobalActions} from '../redux/reducer/global/slice';
import {SVG} from '../svg';
import {useAppDispatch, isValidAuthInput} from '../utils';
import {useApproval} from './approval/hook';

const LoginPage = () => {
  //! State
  const navigate = useNavigate();
  const wallet = useWalletProvider();
  const dispatch = useAppDispatch();
  const [, resolveApproval] = useApproval();
  const {showToast} = useCustomToast();

  const pinInputRef = useRef<AuthInputRef>(null);
  const [valueInput, setValueInput] = useState('');
  const [disabled, setDisabled] = useState(true);
  const [showPwd, setShowPwd] = useState(false);

  //! Function
  const handleOnChange = (pwd: string) => {
    setValueInput(pwd);
  };

  const handleNavigate = async () => {
    // const uiType = getUiType();
    try {
      await wallet.unlockApp(valueInput);
      dispatch(GlobalActions.update({isUnlocked: true}));
      // pass prop to home if user used a 4-digit PIN
      if (/^\d{4}$/.test(valueInput)) {
        await resolveApproval();
        // Set modal state in store
        dispatch(GlobalActions.update({showPasswordUpdateModal: true, currentPassword: valueInput}));
        return navigate('/home');
      }
      await resolveApproval();
      return navigate('/');
    } catch (error) {
      setValueInput('');
      pinInputRef.current?.clear?.();
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
    setDisabled(!isValidAuthInput(valueInput));
  }, [valueInput]);

  //! Render
  return (
    <LayoutLogin
      body={
        <UX.Box layout="column_center" spacing="xl" style={{width: '100%', maxWidth: '500px'}}>
          <SVG.UnlockIcon />
          <UX.Text
            title="Password"
            styleType="heading_24"
            customStyles={{
              marginTop: '16px',
            }}
          />
          <UX.Text
            title="Enter your password to login"
            styleType="body_16_normal"
            customStyles={{textAlign: 'center'}}
          />
          <UX.AuthInput
            placeholder='Enter your password'
            onChange={handleOnChange}
            onKeyUp={e => handleOnKeyUp(e)}
            ref={pinInputRef}
            autoFocus={true}
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
