import {UX} from '@/src/ui/component/index';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {SVG} from '@/src/ui/svg';
import {useRef, useState, useEffect, useCallback} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useCustomToast} from '../../component/toast-custom';
import {useActiveTracAddress, useIsTracSingleWallet} from '../home-flow/hook';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {useAppSelector, useAppDispatch, isValidAuthInput} from '../../utils';
import {WalletSelector} from '../../redux/reducer/wallet/selector';
import {AccountSelector} from '../../redux/reducer/account/selector';
import {GlobalSelector} from '../../redux/reducer/global/selector';
import {GlobalActions} from '../../redux/reducer/global/slice';
import {PinInputRef} from '../../component/pin-input';
import type {AuthInputRef} from '../../component/auth-input';
import {TracApi} from '../../../background/requests/trac-api';
import {TracApiService} from '../../../background/service/trac-api.service';

interface TracSummaryData {
  to: string;
  amountHex: string;
  validityHex: string;
  amount: string;
  fee: string;
}

const SendTracPin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {summaryData}: {summaryData: TracSummaryData} = location.state;
  
  const tracAddress = useActiveTracAddress();
  const {showToast} = useCustomToast();
  const wallet = useWalletProvider();
  const dispatch = useAppDispatch();
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const isTracSingleWallet = useIsTracSingleWallet();
  const isLegacyUser = useAppSelector(GlobalSelector.isLegacyUser);
  
  const [pinValue, setPinValue] = useState('');
  const [sending, setSending] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const pinRef = useRef<PinInputRef>(null);
  const authInputRef = useRef<AuthInputRef>(null);

  // Check user type (PIN vs Password)
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

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleOnChange = (pwd: string) => {
    setPinValue(pwd);
  };

  const onConfirmPin = async () => {
    try {
      setSending(true);
      
      let secret: Buffer;
      
      if (isTracSingleWallet) {
        // For TRAC Single wallet: get TRAC private key directly
        const tracPrivateKey = await (wallet as any).getTracPrivateKey(
          pinValue,
          activeWallet.index, 
          activeAccount.index
        );
        secret = Buffer.from(tracPrivateKey, 'hex');
      } else {
        // For mnemonic wallet: generate keypair from mnemonic
        const mnemonicData = await wallet.getMnemonics(pinValue, activeWallet);
        if (!mnemonicData || !mnemonicData.mnemonic) {
          throw new Error(`Failed to get mnemonic from wallet. Please check your ${isLegacyUser ? 'PIN' : 'password'}.`);
        }
        
        const generated = await TracApiService.generateKeypairFromMnemonic(
          mnemonicData.mnemonic,
          activeAccount.index
        );
        
        secret = TracApiService.toSecretBuffer(generated.secretKey);
      }
      
      const txData = await TracApiService.preBuildTransaction({
        from: tracAddress, // Use active TRAC address
        to: summaryData.to,
        amountHex: summaryData.amountHex,
        validityHex: summaryData.validityHex
      });
      
      const txPayload = TracApiService.buildTransaction(txData, secret);
      
      const result = await TracApi.broadcastTransaction(txPayload);
      
      if (result.success) {
        showToast({title: 'Transaction sent successfully', type: 'success'});
        navigate('/home/send-trac-success', { state: { txid: result.txid } });
      } else {
        showToast({title: result.error || 'Transaction failed', type: 'error'});
      }
      
      setPinValue('');
      pinRef.current?.clearPin();
      authInputRef.current?.clear();
    } catch (e) {
      pinRef.current?.clearPin();
      authInputRef.current?.clear();
      const err = e as Error;
      showToast({title: err.message || `${isLegacyUser ? 'PIN' : 'Password'} invalid`, type: 'error'});
    } finally {
      setSending(false);
    }
  };

  // Effects
  useEffect(() => {
    checkUserType();
  }, []);

  useEffect(() => {
    if (isLegacyUser) {
      setDisabled(!(pinValue?.length === 4));
    } else {
      setDisabled(!isValidAuthInput(pinValue));
    }
  }, [pinValue, isLegacyUser]);


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
              ref={pinRef}
            />
          ) : (
            <UX.AuthInput
              placeholder={isLegacyUser ? 'Enter your PIN' : 'Enter your password'}
              onChange={handleOnChange}
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
            title={sending ? 'Sending...' : 'Confirm'}
            onClick={onConfirmPin}
            isDisable={disabled || sending}
          />
        </UX.Box>
      }
    />
  );
};

export default SendTracPin;
