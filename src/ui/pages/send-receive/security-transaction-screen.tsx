import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import {PinInputRef} from '../../component/pin-input';
import type {AuthInputRef} from '../../component/auth-input';
import LayoutSendReceive from '../../layouts/send-receive';
import {SVG} from '../../svg';
import {useAppDispatch, isValidAuthInput, useAppSelector} from '../../utils';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {GlobalSelector} from '../../redux/reducer/global/selector';
import {GlobalActions} from '../../redux/reducer/global/slice';

const Security = () => {
  //! State
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const pinInputRef = useRef<PinInputRef>(null);
  const authInputRef = useRef<AuthInputRef>(null);
  const [valueInput, setValueInput] = useState('');
  const [disabled, setDisabled] = useState(true);
  const isLegacyUser = useAppSelector(GlobalSelector.isLegacyUser);
  const wallet = useWalletProvider();

  //! Function
  const checkUserType = async () => {
    try {
      const passwordUpgraded = await wallet.isPasswordUpgraded();
      if (!passwordUpgraded) {
        dispatch(GlobalActions.update({isLegacyUser: true}));
      } else {
        dispatch(GlobalActions.update({isLegacyUser: false}));
      }
    } catch (error) {
      // Default to legacy user if we can't determine status
      dispatch(GlobalActions.update({isLegacyUser: true}));
    }
  };

  //! Function
  const handleGoBack = () => {
    return navigate(-1);
  };

  const handleOnChange = (pwd: string) => {
    setValueInput(pwd);
  };

  const handleNavigate = () => {
    return navigate('/home/send-fail');
  };

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!disabled && 'Enter' == e.key) {
      handleNavigate();
    }
  };

  //! Effect
  useEffect(() => {
    checkUserType();
  }, []);

  useEffect(() => {
    if (isLegacyUser) {
      setDisabled(!(valueInput?.length === 4));
    } else {
      setDisabled(!isValidAuthInput(valueInput));
    }
  }, [valueInput, isLegacyUser]);

  //! Render
  return (
    <LayoutSendReceive
      header={<UX.TextHeader onBackClick={handleGoBack} />}
      body={
        <UX.Box layout="column_center" style={{marginTop: '5rem', width: '100%'}} spacing="xl">
          <SVG.UnlockIcon />
          <UX.Text
            title={isLegacyUser ? "PIN" : "Password"}
            styleType="heading_24"
            customStyles={{
              marginTop: '16px',
            }}
          />
          <UX.Text
            title={isLegacyUser ? "Enter your PIN to confirm the transaction" : "Enter your password to confirm the transaction"}
            styleType="body_16_normal"
            customStyles={{textAlign: 'center'}}
          />
          {isLegacyUser ? (
            <UX.PinInput
              onChange={handleOnChange}
              onKeyUp={e => handleOnKeyUp(e)}
              ref={pinInputRef}
            />
          ) : (
            <UX.AuthInput
              placeholder={isLegacyUser ? 'Enter your PIN' : 'Enter your password'}
              onChange={handleOnChange}
              onKeyUp={e => handleOnKeyUp(e)}
              ref={authInputRef}
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

export default Security;
