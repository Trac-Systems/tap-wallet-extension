import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {UX} from '../component';
import type {AuthInputRef} from '../component/auth-input';
import type {PinInputRef} from '../component/pin-input';
import {useCustomToast} from '../component/toast-custom';
import {useWalletProvider} from '../gateway/wallet-provider';
import LayoutLogin from '../layouts/login';
import {GlobalActions} from '../redux/reducer/global/slice';
import {GlobalSelector} from '../redux/reducer/global/selector';
import {SVG} from '../svg';
import {useAppDispatch, isValidAuthInput, isLegacyPin, useAppSelector, hasWalletsWithAccounts} from '../utils';
import {useApproval} from './approval/hook';

const LoginPage = () => {
  //! State
  const navigate = useNavigate();
  const wallet = useWalletProvider();
  const dispatch = useAppDispatch();
  const [, resolveApproval] = useApproval();
  const {showToast} = useCustomToast();

  const pinInputRef = useRef<AuthInputRef>(null);
  const legacyPinInputRef = useRef<PinInputRef>(null);
  const [valueInput, setValueInput] = useState('');
  const [disabled, setDisabled] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [isLegacyUser, setIsLegacyUser] = useState(false);

  //! Function
  const handleOnChange = (pwd: string) => {
    setValueInput(pwd);
  };

  const checkUserType = async () => {
    try {
      const passwordUpgraded = await wallet.isPasswordUpgraded();
      if (!passwordUpgraded) {
        setIsLegacyUser(true);
        dispatch(GlobalActions.update({isLegacyUser: true}));
      } else {
        setIsLegacyUser(false);
        dispatch(GlobalActions.update({isLegacyUser: false}));
      }
    } catch (error) {
      // Default to legacy user if we can't determine status
      setIsLegacyUser(true);
      dispatch(GlobalActions.update({isLegacyUser: true}));
    }
  };

  const handleNavigate = async () => {
    // const uiType = getUiType();
    try {
      await wallet.unlockApp(valueInput);
      dispatch(GlobalActions.update({isUnlocked: true}));
      
      const hasWallets = await hasWalletsWithAccounts(wallet);
      
      if (/^\d{4}$/.test(valueInput)) {
        await resolveApproval();
        dispatch(GlobalActions.update({showPasswordUpdateModal: true, currentPassword: valueInput}));
        
        if (hasWallets) {
          return navigate('/home');
        } else {
          return navigate('/');
        }
      }
      
      await resolveApproval();
      return navigate('/');
    } catch (error) {
      setValueInput('');
      if (isLegacyUser) {
        legacyPinInputRef.current?.clearPin?.();
      } else {
        pinInputRef.current?.clear?.();
      }
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

  useEffect(() => {
    checkUserType();
  }, []);

  //! Render
  return (
    <LayoutLogin
      body={
        <UX.Box layout="column_center" spacing="xl" style={{width: '100%', maxWidth: '500px'}}>
          <SVG.UnlockIcon />
          <UX.Text
            title={isLegacyUser ? "PIN" : "Password"}
            styleType="heading_24"
            customStyles={{
              marginTop: '16px',
            }}
          />
          <UX.Text
            title={isLegacyUser ? "Enter your PIN to login" : "Enter your password to login"}
            styleType="body_16_normal"
            customStyles={{textAlign: 'center'}}
          />
          {isLegacyUser ? (
            <UX.PinInput
              onChange={handleOnChange}
              onKeyUp={e => handleOnKeyUp(e)}
              ref={legacyPinInputRef}
            />
          ) : (
            <UX.AuthInput
              placeholder={isLegacyUser ? 'Enter your PIN' : 'Enter your password'}
              onChange={handleOnChange}
              onKeyUp={e => handleOnKeyUp(e)}
              ref={pinInputRef}
              autoFocus={true}
            />
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
