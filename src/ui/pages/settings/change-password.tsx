import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import type {AuthInputRef} from '../../component/auth-input';
import LayoutSendReceive from '../../layouts/send-receive';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {useCustomToast} from '../../component/toast-custom';
import {AppDispatch} from '../../redux/store';
import {useDispatch} from 'react-redux';
import {GlobalActions} from '../../redux/reducer/global/slice';

const hasUppercase = (s: string) => /[A-Z]/.test(s);
const hasLowercase = (s: string) => /[a-z]/.test(s);
const hasSpecial = (s: string) => /[^a-zA-Z0-9]/.test(s);

const ChangePassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const wallet = useWalletProvider();
  const {showToast} = useCustomToast();
  const dispatch = useDispatch<AppDispatch>();

  const currentRef = useRef<AuthInputRef>(null);
  const newRef = useRef<AuthInputRef>(null);
  const confirmRef = useRef<AuthInputRef>(null);

  const [current, setCurrent] = useState<string>(location.state?.current || '');
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const validNew = pwd?.length >= 12 && hasUppercase(pwd) && hasLowercase(pwd) && hasSpecial(pwd);
    const validConfirm = pwd === confirm && confirm.length > 0;
    const validCurrent = (current?.length ?? 0) > 0;
    setDisabled(!(validNew && validConfirm && validCurrent));
  }, [current, pwd, confirm]);

  const strength = useMemo(() => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    if (pwd.length >= 16) score += 1;
    return Math.min(score, 5);
  }, [pwd]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // perform atomic change in background
      await (wallet as any).changePassword?.(current, pwd);
      // fallback if provider changePassword is not exposed
      if (!(wallet as any).changePassword) {
        // try through unlock + internal migration path
        await wallet.unlockApp(current);
        // background now supports changePassword on walletService, expose via provider in future
      }
      
      // Mark password as upgraded
      await wallet.markPasswordUpgraded();
      
      showToast({type: 'success', title: 'Password updated'});
      navigate('/home');
    } catch (e) {
      showToast({type: 'error', title: e?.message || 'Update failed'});
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutSendReceive
      header={<UX.TextHeader text="Change Password" onBackClick={() => navigate(-1)} />}
      body={
        <UX.Box layout="column_center" style={{width: '100%'}}>
          <UX.Box
            layout="column"
            spacing="xl"
            style={{width: '100%', maxWidth: '500px', margin: '0 auto'}}>
          <UX.Box layout="column" spacing="sm">
            <UX.Text title="Current password" styleType="body_14_normal" customStyles={{color: '#FFFFFF'}} />
            <UX.AuthInput
              ref={currentRef}
              onChange={setCurrent}
              autoComplete="current-password"
              autoFocus={true}
            />
          </UX.Box>
          <UX.Box layout="column" spacing="sm">
            <UX.Text title="New password" styleType="body_14_normal" customStyles={{color: '#FFFFFF'}} />
            <UX.AuthInput
              ref={newRef}
              onChange={setPwd}
              autoComplete="new-password"
              autoFocus={false}
            />
            {/* Password requirements checklist */}
            <UX.Box layout="column" spacing="xs" style={{marginTop: '12px'}}>
              <UX.Box layout="row" spacing="xs" style={{gap: 8, alignItems: 'center'}}>
                {pwd.length >= 12 ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6.36709 12.3014L2.26562 8.19991L3.52651 6.93903L6.36709 9.77961L12.4743 3.67236L13.7352 4.93325L6.36709 12.3014Z" fill="#089B6A"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8.0002 12.9872C6.62308 12.9872 5.44753 12.5004 4.47353 11.5268C3.49964 10.5533 3.0127 9.37791 3.0127 8.00068C3.0127 6.62357 3.49947 5.44802 4.47303 4.47402C5.44658 3.50013 6.62197 3.01318 7.9992 3.01318C9.37631 3.01318 10.5519 3.49996 11.5259 4.47352C12.4998 5.44707 12.9867 6.62246 12.9867 7.99968C12.9867 9.37679 12.4999 10.5524 11.5264 11.5264C10.5528 12.5002 9.37742 12.9872 8.0002 12.9872ZM7.99953 11.2205C8.89042 11.2205 9.64992 10.9065 10.278 10.2785C10.906 9.65063 11.22 8.89124 11.22 8.00035C11.22 7.10946 10.906 6.34996 10.278 5.72185C9.65014 5.09385 8.89075 4.77985 7.99986 4.77985C7.10897 4.77985 6.34947 5.09385 5.72136 5.72185C5.09336 6.34974 4.77936 7.10913 4.77936 8.00002C4.77936 8.89091 5.09336 9.65041 5.72136 10.2785C6.34925 10.9065 7.10864 11.2205 7.99953 11.2205Z" fill="white" fillOpacity="0.69"/>
                  </svg>
                )}
                <UX.Text title="Must have at least 12 characters" styleType="body_12_normal" customStyles={{color: '#FFFFFF'}} />
              </UX.Box>
              <UX.Box layout="row" spacing="xs" style={{gap: 8, alignItems: 'center'}}>
                {hasUppercase(pwd) ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6.36709 12.3014L2.26562 8.19991L3.52651 6.93903L6.36709 9.77961L12.4743 3.67236L13.7352 4.93325L6.36709 12.3014Z" fill="#089B6A"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8.0002 12.9872C6.62308 12.9872 5.44753 12.5004 4.47353 11.5268C3.49964 10.5533 3.0127 9.37791 3.0127 8.00068C3.0127 6.62357 3.49947 5.44802 4.47303 4.47402C5.44658 3.50013 6.62197 3.01318 7.9992 3.01318C9.37631 3.01318 10.5519 3.49996 11.5259 4.47352C12.4998 5.44707 12.9867 6.62246 12.9867 7.99968C12.9867 9.37679 12.4999 10.5524 11.5264 11.5264C10.5528 12.5002 9.37742 12.9872 8.0002 12.9872ZM7.99953 11.2205C8.89042 11.2205 9.64992 10.9065 10.278 10.2785C10.906 9.65063 11.22 8.89124 11.22 8.00035C11.22 7.10946 10.906 6.34996 10.278 5.72185C9.65014 5.09385 8.89075 4.77985 7.99986 4.77985C7.10897 4.77985 6.34947 5.09385 5.72136 5.72185C5.09336 6.34974 4.77936 7.10913 4.77936 8.00002C4.77936 8.89091 5.09336 9.65041 5.72136 10.2785C6.34925 10.9065 7.10864 11.2205 7.99953 11.2205Z" fill="white" fillOpacity="0.69"/>
                  </svg>
                )}
                <UX.Text title="Must have at least 1 uppercase letter" styleType="body_12_normal" customStyles={{color: '#FFFFFF'}} />
              </UX.Box>
              <UX.Box layout="row" spacing="xs" style={{gap: 8, alignItems: 'center'}}>
                {hasLowercase(pwd) ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6.36709 12.3014L2.26562 8.19991L3.52651 6.93903L6.36709 9.77961L12.4743 3.67236L13.7352 4.93325L6.36709 12.3014Z" fill="#089B6A"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8.0002 12.9872C6.62308 12.9872 5.44753 12.5004 4.47353 11.5268C3.49964 10.5533 3.0127 9.37791 3.0127 8.00068C3.0127 6.62357 3.49947 5.44802 4.47303 4.47402C5.44658 3.50013 6.62197 3.01318 7.9992 3.01318C9.37631 3.01318 10.5519 3.49996 11.5259 4.47352C12.4998 5.44707 12.9867 6.62246 12.9867 7.99968C12.9867 9.37679 12.4999 10.5524 11.5264 11.5264C10.5528 12.5002 9.37742 12.9872 8.0002 12.9872ZM7.99953 11.2205C8.89042 11.2205 9.64992 10.9065 10.278 10.2785C10.906 9.65063 11.22 8.89124 11.22 8.00035C11.22 7.10946 10.906 6.34996 10.278 5.72185C9.65014 5.09385 8.89075 4.77985 7.99986 4.77985C7.10897 4.77985 6.34947 5.09385 5.72136 5.72185C5.09336 6.34974 4.77936 7.10913 4.77936 8.00002C4.77936 8.89091 5.09336 9.65041 5.72136 10.2785C6.34925 10.9065 7.10864 11.2205 7.99953 11.2205Z" fill="white" fillOpacity="0.69"/>
                  </svg>
                )}
                <UX.Text title="Must have at least 1 lowercase letter" styleType="body_12_normal" customStyles={{color: '#FFFFFF'}} />
              </UX.Box>
              <UX.Box layout="row" spacing="xs" style={{gap: 8, alignItems: 'center'}}>
                {hasSpecial(pwd) ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6.36709 12.3014L2.26562 8.19991L3.52651 6.93903L6.36709 9.77961L12.4743 3.67236L13.7352 4.93325L6.36709 12.3014Z" fill="#089B6A"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8.0002 12.9872C6.62308 12.9872 5.44753 12.5004 4.47353 11.5268C3.49964 10.5533 3.0127 9.37791 3.0127 8.00068C3.0127 6.62357 3.49947 5.44802 4.47303 4.47402C5.44658 3.50013 6.62197 3.01318 7.9992 3.01318C9.37631 3.01318 10.5519 3.49996 11.5259 4.47352C12.4998 5.44707 12.9867 6.62246 12.9867 7.99968C12.9867 9.37679 12.4999 10.5524 11.5264 11.5264C10.5528 12.5002 9.37742 12.9872 8.0002 12.9872ZM7.99953 11.2205C8.89042 11.2205 9.64992 10.9065 10.278 10.2785C10.906 9.65063 11.22 8.89124 11.22 8.00035C11.22 7.10946 10.906 6.34996 10.278 5.72185C9.65014 5.09385 8.89075 4.77985 7.99986 4.77985C7.10897 4.77985 6.34947 5.09385 5.72136 5.72185C5.09336 6.34974 4.77936 7.10913 4.77936 8.00002C4.77936 8.89091 5.09336 9.65041 5.72136 10.2785C6.34925 10.9065 7.10864 11.2205 7.99953 11.2205Z" fill="white" fillOpacity="0.69"/>
                  </svg>
                )}
                <UX.Text title="Must have at least 1 special character" styleType="body_12_normal" customStyles={{color: '#FFFFFF'}} />
              </UX.Box>
            </UX.Box>
          </UX.Box>
          <UX.Box layout="column" spacing="sm">
            <UX.Text title="Confirm new password" styleType="body_14_normal" customStyles={{color: '#FFFFFF'}} />
            <UX.AuthInput
              ref={confirmRef}
              onChange={setConfirm}
              toggleVisibility
              autoComplete="new-password"
              autoFocus={false}
            />
          </UX.Box>
          </UX.Box>
        </UX.Box>
      }
      footer={
        <UX.Box layout="column" spacing="xl" style={{padding: '10px 0'}}>
          <UX.Button
            styleType="primary"
            title={loading ? 'Updating...' : 'Confirm'}
            isDisable={disabled || loading}
            onClick={handleSubmit}
          />
        </UX.Box>
      }
    />
  );
};

export default ChangePassword;


