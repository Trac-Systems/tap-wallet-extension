import * as bip39 from 'bip39';
import {useContext, useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component/index';
import {useCustomToast} from '../../component/toast-custom';
import LayoutScreenImport from '../../layouts/import-export';
import {SVG} from '../../svg';
import {CreateWalletContext} from './services/wallet-service-create';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {AddressType} from '@/src/wallet-instance';

const RestoreWallet = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const walletProvider = useWalletProvider();
  const CreateWalletContextHandler = useContext(CreateWalletContext);
  const {showToast} = useCustomToast();
  const [disabled, setDisabled] = useState(true);
  const [restoreInput, setRestoreInput] = useState('');
  const queryParams = new URLSearchParams(location.search);
  const restore = queryParams.get('restore');
  const isMnemonics = restore === 'mnemonics';
  const text = isMnemonics ? 'mnemonics' : 'Private key';
  const desc = isMnemonics
    ? 'wallet mnemonics phrase'
    : 'your single private key';
  const placeholder = isMnemonics
    ? 'wallet seed phrase'
    : 'your single private key';

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleNavigate = async () => {
    try {
      if (isMnemonics) {
        CreateWalletContextHandler.Handlers.mnemonic = restoreInput;
        navigate('/choose-address?type=isImport');
      } else {
        const _res = await walletProvider.previewAddressFromPrivateKey(
          restoreInput,
          AddressType.P2TR,
        );
        if (_res.accounts.length === 0) {
          throw new Error('Invalid Private Key');
        }
        CreateWalletContextHandler.Handlers.wif = restoreInput;
        navigate('/choose-address-private');
      }
    } catch (e) {
      showToast({
        type: 'error',
        title: e.message,
      });
    }
  };

  const handleOnChange = (inputData: string) => {
    setRestoreInput(inputData.trim());
  };

  useEffect(() => {
    setDisabled(true);
    if (restoreInput === '') {
      return;
    }
    if (isMnemonics) {
      if (!bip39.validateMnemonic(restoreInput)) {
        return;
      }
    }
    setDisabled(false);
  }, [restoreInput]);

  //! Render
  return (
    <LayoutScreenImport
      header={<UX.TextHeader onBackClick={handleGoBack} />}
      body={
        <UX.Box layout="column_center" spacing="xl">
          <SVG.SeedPhraseIcon />
          <UX.Text
            title={`Restore from ${text}`}
            styleType="heading_24"
            customStyles={{
              marginTop: '16px',
              textAlign: 'center',
            }}
          />
          <UX.Text
            title={`Enter ${desc} below. This will restore your existing wallet.`}
            styleType="body_16_normal"
            customStyles={{textAlign: 'center'}}
          />
          <style>
            {`
              .textareaWidth {
                color: #FFFFFFB0 !important;
                font-size: 16px !important;
                font-weight: 400 !important;
                font-family: Exo !important;
                line-height: 24px !important;
              }
              .textareaWidth::placeholder {
                color: #FFFFFFB0 !important;
                font-size: 16px !important;
                font-weight: 400 !important;
                font-family: Exo !important;
                line-height: 24px !important;
              }
            `}
          </style>
          <UX.TextArea
            className="textareaWidth"
            onChange={e => handleOnChange(e.target.value)}
            placeholder={`Enter/paste ${placeholder} here `}
            customStyles={{width: '100%'}}
            style={{display: 'flex', width: '100%'}}
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
            isDisable={disabled}
            styleType="primary"
            title="Restore Wallet"
            onClick={handleNavigate}
          />
        </UX.Box>
      }
    />
  );
};

export default RestoreWallet;
