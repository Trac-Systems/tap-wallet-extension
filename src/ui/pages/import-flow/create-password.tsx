import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import {PinInputRef} from '../../component/pin-input';
import {useCustomToast} from '../../component/toast-custom';
import {useWalletProvider} from '../../gateway/wallet-provider';
import LayoutScreenImport from '../../layouts/import-export';
import {SVG} from '../../svg';

interface IContextData {
  isStepSetPin?: boolean;
  password?: string;
  password2?: string;
}

const CreatePassWord = () => {
  //! State
  const walletProvider = useWalletProvider();
  const navigate = useNavigate();
  const pinInputRef = useRef<PinInputRef>(null);
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
      pinInputRef.current?.clearPin();
      updateContextData({isStepSetPin: false});
    } else {
      if (
        contextData.password2?.length === 4 &&
        contextData.password !== contextData.password2
      ) {
        showToast({
          title: 'Please enter correct PIN',
          type: 'error',
        });
        pinInputRef.current?.clearPin();
        return;
      }

      await walletProvider.register(contextData.password);
      if (check === 'isImport') {
        navigate('/restore-wallet-option');
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
      if (valueInput?.length === 4) {
        setDisabled(false);
      }
    } else {
      if (contextData.password2.length === 4) {
        setDisabled(false);
      }
    }
  }, [valueInput]);

  //! Render
  return (
    <LayoutScreenImport
      header={<UX.TextHeader onBackClick={handleGoBack} />}
      body={
        <UX.Box layout="column_center" spacing="xl">
          <SVG.UnlockIcon />
          <UX.Text
            title={contextData.isStepSetPin ? 'Set PIN' : 'Confirm PIN'}
            styleType="heading_24"
            customStyles={{
              marginTop: '16px',
            }}
          />
          <UX.Text
            title="Create a password to enter the application and perform operations."
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

export default CreatePassWord;
