import React, {useEffect, useRef, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import {PinInputRef} from '../../component/pin-input';
import LayoutSendReceive from '../../layouts/send-receive';
import {SVG} from '../../svg';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {useCustomToast} from '../../component/toast-custom';
import {useAppSelector} from '../../utils';
import {AccountSelector} from '../../redux/reducer/account/selector';
import {WalletSelector} from '../../redux/reducer/wallet/selector';
import {useIsTracSingleWallet} from '../home-flow/hook';
import { RestoreTypes } from '@/src/wallet-instance';

// Function to derive TRAC private key from mnemonic
const deriveTracPrivateKeyFromMnemonic = async (mnemonic: string, accountIndex: number): Promise<string> => {
  try {
    const api = (window as any).TracCryptoApi;
    if (!api) {
      throw new Error('TracCryptoApi not loaded');
    }
    
    const derivationPath = `m/0'/0'/${accountIndex}'`;
    const { secretKey } = await api.address.generate("trac", mnemonic, derivationPath);
    
    if (!secretKey) {
      throw new Error('No secretKey returned from TracCryptoApi');
    }
    
    return secretKey;
  } catch (error) {
    throw new Error('Failed to derive TRAC private key: ' + (error as Error).message);
  }
};

const SecuritySetting = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const type = queryParams.get('type');
  const wallet = useWalletProvider();
  const pinInputRef = useRef<PinInputRef>(null);
  const [valueInput, setValueInput] = useState('');
  const [disabled, setDisabled] = useState(true);
  const {showToast} = useCustomToast();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const isTracSingleWallet = useIsTracSingleWallet();
  //! Function
  const handleGoBack = () => {
    return navigate('/setting');
  };

  const handleOnChange = (pwd: string) => {
    setValueInput(pwd);
  };

  const getSecretValue = async (pinString: string) => {
    let _res: any;
    if (type === RestoreTypes.MNEMONIC) {
      _res = await wallet.getMnemonics(pinString, activeWallet);
    } else {
      // Get both Bitcoin and TRAC private keys
      const btc = await wallet.getPrivateKey(pinString, activeAccount);
      
      let tracPrivateKey: string;
      if (isTracSingleWallet) {
        // For TRAC Single wallet, get private key from stored data
        tracPrivateKey = await (wallet as any).getTracPrivateKey(pinString, activeWallet.index, activeAccount.index);
      } else {
        // For TRAC HD wallet, derive from mnemonic
        const mnemonicData = await wallet.getMnemonics(pinString, activeWallet);
        tracPrivateKey = await deriveTracPrivateKeyFromMnemonic(mnemonicData.mnemonic, activeAccount.index);
      }
      
      _res = {
        btcHex: btc.hex,
        btcWif: btc.wif,
        tracHex: tracPrivateKey,
        type: 'private'
      };
    }
    return _res;
  };

  const handleNavigate = async () => {
    try {
      await getSecretValue(valueInput).then(secretResponse => {
        return navigate(`/setting/show-key?type=${type}`, {
          state: secretResponse,
        });
      });
    } catch (e) {
      pinInputRef.current?.clearPin();
      setValueInput('')
      showToast({
        title: e.message,
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
            onClick={handleNavigate}
            isDisable={disabled}
          />
        </UX.Box>
      }
    />
  );
};

export default SecuritySetting;
