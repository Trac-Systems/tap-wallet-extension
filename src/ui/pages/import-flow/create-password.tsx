import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import type {AuthInputRef} from '../../component/auth-input';
import {useCustomToast} from '../../component/toast-custom';
import {useWalletProvider} from '../../gateway/wallet-provider';
import LayoutScreenImport from '../../layouts/import-export';
import {SVG} from '../../svg';

const hasUppercase = (s: string) => /[A-Z]/.test(s);
const hasLowercase = (s: string) => /[a-z]/.test(s);
const hasSpecial = (s: string) => /[^a-zA-Z0-9]/.test(s);

interface IContextData {
  isStepSetPin?: boolean;
  password?: string;
  password2?: string;
}

const CreatePassWord = () => {
  //! State
  const walletProvider = useWalletProvider();
  const navigate = useNavigate();
  const pinInputRef = useRef<AuthInputRef>(null);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const check = queryParams.get('check');
  const [valueInput, setValueInput] = useState('');
  const [contextData, setContextData] = useState({
    isStepSetPin: true,
    password: '',
    password2: '',
  });
  const {showToast} = useCustomToast();
  const [disabled, setDisabled] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  // Check if app already has password and is unlocked, redirect if needed
  useEffect(() => {
    const checkPasswordStatus = async () => {
      try {
        const hasWallet = await walletProvider.hasWallet();
        const isUnlocked = await walletProvider.isUnlocked();
        
        if (hasWallet && isUnlocked) {
          if (check === 'isImport') {
            navigate('/restore-wallet-option', {replace: true});
            return;
          }
          if (check === 'isLedger') {
            navigate('/connect-ledger', {replace: true});
            return;
          }
          navigate('/', {replace: true});
          return;
        }
        setIsChecking(false);
      } catch (error) {
        setIsChecking(false);
      }
    };
    checkPasswordStatus();
  }, [walletProvider, navigate, check]);

  //! Function
  const handleGoBack = () => {
    return navigate(-1);
  };

  const updateContextData = useCallback(
    (params: IContextData) => {
      setContextData(Object.assign({}, contextData, params));
    },
    [contextData, setContextData],
  );

  const handleOnChange = (pwd: string) => {
    setValueInput(pwd);
    if (contextData.isStepSetPin) {
      updateContextData({password: pwd});
    } else {
      updateContextData({password2: pwd});
    }
  };

  const handleNavigate = async () => {
    if (contextData.isStepSetPin) {
      pinInputRef.current?.clear?.();
      updateContextData({isStepSetPin: false});
    } else {
      if (contextData.password2 && contextData.password !== contextData.password2) {
        showToast({
          title: 'Please enter correct password',
          type: 'error',
        });
        pinInputRef.current?.clear?.();
        return;
      }

      await walletProvider.register(contextData.password);
      // Mark password as upgraded for new users
      await walletProvider.markPasswordUpgraded();
      if (check === 'isImport') {
        navigate('/restore-wallet-option');
        return;
      }
      if (check === 'isLedger') {
        // Navigate to connect ledger screen after password is set
        navigate('/connect-ledger');
        return;
      }
      navigate('/note-step');
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
    if (contextData.isStepSetPin) {
      if (valueInput && valueInput.length >= 12 && hasUppercase(valueInput) && hasLowercase(valueInput) && hasSpecial(valueInput)) {
        setDisabled(false);
      }
    } else {
      if (contextData.password2 && contextData.password2.length >= 12 && hasUppercase(contextData.password2) && hasLowercase(contextData.password2) && hasSpecial(contextData.password2)) {
        setDisabled(false);
      }
    }
  }, [valueInput, contextData.password2, contextData.isStepSetPin]);

  const strength = useMemo(() => {
    const currentPwd = contextData.isStepSetPin ? valueInput : contextData.password2 || '';
    if (!currentPwd) return 0;
    let score = 0;
    if (currentPwd.length >= 12) score += 1;
    if (/[A-Z]/.test(currentPwd)) score += 1;
    if (/[a-z]/.test(currentPwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(currentPwd)) score += 1;
    if (currentPwd.length >= 16) score += 1;
    return Math.min(score, 5);
  }, [valueInput, contextData.password2, contextData.isStepSetPin]);

  //! Render
  // Show loading while checking password status
  if (isChecking) {
    return <UX.Loading />;
  }

  return (
    <LayoutScreenImport
      header={<UX.TextHeader onBackClick={handleGoBack} />}
      body={
        <UX.Box layout="column_center" spacing="xl" style={{width: '100%', maxWidth: '500px'}}>
          <SVG.UnlockIcon />
          <UX.Text
            title={contextData.isStepSetPin ? 'Create Password' : 'Confirm Password'}
            styleType="heading_24"
            customStyles={{
              marginTop: '16px',
            }}
          />
          <UX.Text
            title="Create a password for your wallet."
            styleType="body_16_normal"
            customStyles={{textAlign: 'center'}}
          />
          <UX.AuthInput
            onChange={handleOnChange}
            onKeyUp={e => handleOnKeyUp(e)}
            ref={pinInputRef}
          />
          {/* Checklist outside input */}
          <UX.Box layout="column" spacing="sm" style={{marginTop: 16, width: '100%'}}>
            <UX.Box layout="row" spacing="xs" style={{gap: 8, alignItems: 'center'}}>
              {(contextData.isStepSetPin ? valueInput : contextData.password2 || '').length >= 12 ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <mask id="mask0_4337_9185" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
                    <rect width="16" height="16" fill="#D9D9D9"/>
                  </mask>
                  <g mask="url(#mask0_4337_9185)">
                    <path d="M6.36709 12.3014L2.26562 8.19991L3.52651 6.93903L6.36709 9.77961L12.4743 3.67236L13.7352 4.93325L6.36709 12.3014Z" fill="#089B6A"/>
                  </g>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <mask id="mask0_4335_10791" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
                    <rect width="16" height="16" fill="#D9D9D9"/>
                  </mask>
                  <g mask="url(#mask0_4335_10791)">
                    <path d="M8.0002 12.9872C6.62308 12.9872 5.44753 12.5004 4.47353 11.5268C3.49964 10.5533 3.0127 9.37791 3.0127 8.00068C3.0127 6.62357 3.49947 5.44802 4.47303 4.47402C5.44658 3.50013 6.62197 3.01318 7.9992 3.01318C9.37631 3.01318 10.5519 3.49996 11.5259 4.47352C12.4998 5.44707 12.9867 6.62246 12.9867 7.99968C12.9867 9.37679 12.4999 10.5524 11.5264 11.5264C10.5528 12.5002 9.37742 12.9872 8.0002 12.9872ZM7.99953 11.2205C8.89042 11.2205 9.64992 10.9065 10.278 10.2785C10.906 9.65063 11.22 8.89124 11.22 8.00035C11.22 7.10946 10.906 6.34996 10.278 5.72185C9.65014 5.09385 8.89075 4.77985 7.99986 4.77985C7.10897 4.77985 6.34947 5.09385 5.72136 5.72185C5.09336 6.34974 4.77936 7.10913 4.77936 8.00002C4.77936 8.89091 5.09336 9.65041 5.72136 10.2785C6.34925 10.9065 7.10864 11.2205 7.99953 11.2205Z" fill="white" fillOpacity="0.69"/>
                  </g>
                </svg>
              )}
              <UX.Text title="Must have at least 12 characters" styleType="body_12_bold" customStyles={{color: '#FFFFFF'}} />
            </UX.Box>
            <UX.Box layout="row" spacing="xs" style={{gap: 8, alignItems: 'center'}}>
              {hasUppercase(contextData.isStepSetPin ? valueInput : contextData.password2 || '') ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <mask id="mask0_4337_9186" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
                    <rect width="16" height="16" fill="#D9D9D9"/>
                  </mask>
                  <g mask="url(#mask0_4337_9186)">
                    <path d="M6.36709 12.3014L2.26562 8.19991L3.52651 6.93903L6.36709 9.77961L12.4743 3.67236L13.7352 4.93325L6.36709 12.3014Z" fill="#089B6A"/>
                  </g>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <mask id="mask0_4335_10792" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
                    <rect width="16" height="16" fill="#D9D9D9"/>
                  </mask>
                  <g mask="url(#mask0_4335_10792)">
                    <path d="M8.0002 12.9872C6.62308 12.9872 5.44753 12.5004 4.47353 11.5268C3.49964 10.5533 3.0127 9.37791 3.0127 8.00068C3.0127 6.62357 3.49947 5.44802 4.47303 4.47402C5.44658 3.50013 6.62197 3.01318 7.9992 3.01318C9.37631 3.01318 10.5519 3.49996 11.5259 4.47352C12.4998 5.44707 12.9867 6.62246 12.9867 7.99968C12.9867 9.37679 12.4999 10.5524 11.5264 11.5264C10.5528 12.5002 9.37742 12.9872 8.0002 12.9872ZM7.99953 11.2205C8.89042 11.2205 9.64992 10.9065 10.278 10.2785C10.906 9.65063 11.22 8.89124 11.22 8.00035C11.22 7.10946 10.906 6.34996 10.278 5.72185C9.65014 5.09385 8.89075 4.77985 7.99986 4.77985C7.10897 4.77985 6.34947 5.09385 5.72136 5.72185C5.09336 6.34974 4.77936 7.10913 4.77936 8.00002C4.77936 8.89091 5.09336 9.65041 5.72136 10.2785C6.34925 10.9065 7.10864 11.2205 7.99953 11.2205Z" fill="white" fillOpacity="0.69"/>
                  </g>
                </svg>
              )}
              <UX.Text title="Must have at least 1 uppercase letter" styleType="body_12_bold" customStyles={{color: '#FFFFFF'}} />
            </UX.Box>
            <UX.Box layout="row" spacing="xs" style={{gap: 8, alignItems: 'center'}}>
              {hasLowercase(contextData.isStepSetPin ? valueInput : contextData.password2 || '') ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <mask id="mask0_4337_9187" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
                    <rect width="16" height="16" fill="#D9D9D9"/>
                  </mask>
                  <g mask="url(#mask0_4337_9187)">
                    <path d="M6.36709 12.3014L2.26562 8.19991L3.52651 6.93903L6.36709 9.77961L12.4743 3.67236L13.7352 4.93325L6.36709 12.3014Z" fill="#089B6A"/>
                  </g>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <mask id="mask0_4335_10793" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
                    <rect width="16" height="16" fill="#D9D9D9"/>
                  </mask>
                  <g mask="url(#mask0_4335_10793)">
                    <path d="M8.0002 12.9872C6.62308 12.9872 5.44753 12.5004 4.47353 11.5268C3.49964 10.5533 3.0127 9.37791 3.0127 8.00068C3.0127 6.62357 3.49947 5.44802 4.47303 4.47402C5.44658 3.50013 6.62197 3.01318 7.9992 3.01318C9.37631 3.01318 10.5519 3.49996 11.5259 4.47352C12.4998 5.44707 12.9867 6.62246 12.9867 7.99968C12.9867 9.37679 12.4999 10.5524 11.5264 11.5264C10.5528 12.5002 9.37742 12.9872 8.0002 12.9872ZM7.99953 11.2205C8.89042 11.2205 9.64992 10.9065 10.278 10.2785C10.906 9.65063 11.22 8.89124 11.22 8.00035C11.22 7.10946 10.906 6.34996 10.278 5.72185C9.65014 5.09385 8.89075 4.77985 7.99986 4.77985C7.10897 4.77985 6.34947 5.09385 5.72136 5.72185C5.09336 6.34974 4.77936 7.10913 4.77936 8.00002C4.77936 8.89091 5.09336 9.65041 5.72136 10.2785C6.34925 10.9065 7.10864 11.2205 7.99953 11.2205Z" fill="white" fillOpacity="0.69"/>
                  </g>
                </svg>
              )}
              <UX.Text title="Must have at least 1 lowercase letter" styleType="body_12_bold" customStyles={{color: '#FFFFFF'}} />
            </UX.Box>
            <UX.Box layout="row" spacing="xs" style={{gap: 8, alignItems: 'center'}}>
              {hasSpecial(contextData.isStepSetPin ? valueInput : contextData.password2 || '') ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <mask id="mask0_4337_9188" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
                    <rect width="16" height="16" fill="#D9D9D9"/>
                  </mask>
                  <g mask="url(#mask0_4337_9188)">
                    <path d="M6.36709 12.3014L2.26562 8.19991L3.52651 6.93903L6.36709 9.77961L12.4743 3.67236L13.7352 4.93325L6.36709 12.3014Z" fill="#089B6A"/>
                  </g>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <mask id="mask0_4335_10794" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
                    <rect width="16" height="16" fill="#D9D9D9"/>
                  </mask>
                  <g mask="url(#mask0_4335_10794)">
                    <path d="M8.0002 12.9872C6.62308 12.9872 5.44753 12.5004 4.47353 11.5268C3.49964 10.5533 3.0127 9.37791 3.0127 8.00068C3.0127 6.62357 3.49947 5.44802 4.47303 4.47402C5.44658 3.50013 6.62197 3.01318 7.9992 3.01318C9.37631 3.01318 10.5519 3.49996 11.5259 4.47352C12.4998 5.44707 12.9867 6.62246 12.9867 7.99968C12.9867 9.37679 12.4999 10.5524 11.5264 11.5264C10.5528 12.5002 9.37742 12.9872 8.0002 12.9872ZM7.99953 11.2205C8.89042 11.2205 9.64992 10.9065 10.278 10.2785C10.906 9.65063 11.22 8.89124 11.22 8.00035C11.22 7.10946 10.906 6.34996 10.278 5.72185C9.65014 5.09385 8.89075 4.77985 7.99986 4.77985C7.10897 4.77985 6.34947 5.09385 5.72136 5.72185C5.09336 6.34974 4.77936 7.10913 4.77936 8.00002C4.77936 8.89091 5.09336 9.65041 5.72136 10.2785C6.34925 10.9065 7.10864 11.2205 7.99953 11.2205Z" fill="white" fillOpacity="0.69"/>
                  </g>
                </svg>
              )}
              <UX.Text title="Must have at least 1 special character" styleType="body_12_bold" customStyles={{color: '#FFFFFF'}} />
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
            title="Confirm"
            onClick={handleNavigate}
            isDisable={disabled}
          />
        </UX.Box>
      }
    />
  );
};

export default CreatePassWord;
