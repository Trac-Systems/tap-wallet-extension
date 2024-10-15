import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import {PinInputRef} from '../../component/pin-input';
import LayoutSendReceive from '../../layouts/send-receive';
import {SVG} from '../../svg';

const Security = () => {
  //! State
  const navigate = useNavigate();
  const pinInputRef = useRef<PinInputRef>(null);
  const [valueInput, setValueInput] = useState('');
  const [disabled, setDisabled] = useState(true);

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

export default Security;
