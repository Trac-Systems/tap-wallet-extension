import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component/index';
import {useCustomToast} from '../../component/toast-custom';
import {copyToClipboard} from '../../helper';
import LayoutScreenSettings from '../../layouts/settings';
import Navbar from '../home-flow/components/navbar-navigate';
import {useMemo} from 'react';
import {isEmpty} from 'lodash';
import {RestoreTypes} from '@/src/wallet-instance';
import {useAppSelector} from '../../utils';
import {AccountSelector} from '../../redux/reducer/account/selector';

const ShowKey = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const {state} = location;
  const queryParams = new URLSearchParams(location.search);
  const type = queryParams.get('type');
  const isMnemonics = type === 'recovery';
  const activeAccount = useAppSelector(AccountSelector.activeAccount);

  const secretValue = useMemo(() => {
    if (type === RestoreTypes.MNEMONIC) {
      return state?.mnemonic;
    } else {
      return state?.hex;
    }
  }, [state, type]);

  const {showToast} = useCustomToast();
  const appBarTitleText = isMnemonics ? 'Seed Phrase' : 'Private key';
  const contentTitleText = isMnemonics
    ? 'These are the key to your wallet!'
    : 'This is the key to your wallet!';
  const warningText = isMnemonics
    ? 'Please write them down or store it anywhere safe.'
    : 'Make sure you don’t share it with anyone.';
  //! Function
  const handleGoBack = () => {
    navigate('/setting');
  };

  const handleCopied = () => {
    copyToClipboard(secretValue ?? '').then(() => {
      showToast({
        type: 'copied',
        title: 'Copied',
      });
    });
  };
  if (isEmpty(state)) {
    return <UX.Loading />;
  }

  //! Render
  return (
    <LayoutScreenSettings
      header={
        <UX.Box style={{padding: '0 24px'}}>
          <UX.TextHeader onBackClick={handleGoBack} text={appBarTitleText} />
        </UX.Box>
      }
      body={
        <UX.Box layout="column_center" spacing="xl" style={{padding: '0 24px'}}>
          <UX.Box layout="column_center" style={{width: '100%'}}>
            <UX.Text
              title={contentTitleText}
              styleType="body_16_normal"
              customStyles={{textAlign: 'center'}}
            />
            <UX.Text
              title={warningText}
              styleType="body_16_normal"
              customStyles={{textAlign: 'center'}}
            />
          </UX.Box>

          <UX.TextArea
            className="textareaWidth"
            disabled
            placeholder={secretValue ?? ''}
          />
          <UX.Button
            styleType="copy"
            title="Copy to clipboard"
            copy
            onClick={handleCopied}
          />
          {isMnemonics ? (
            <UX.Box layout="box" spacing="sm" style={{width: '100%'}}>
              <UX.Text
                title="Advance Options"
                styleType="body_14_bold"
                customStyles={{color: 'white'}}
              />
              <UX.Text
                title={`Derivation Path: ${state?.derivationPath ?? ''}/${activeAccount.index}`}
                styleType="body_14_bold"
              />
              {state?.passphrase && (
                <UX.Text
                  title={`Passphrase: ${state.passphrase}`}
                  styleType="body_14_bold"
                  customStyles={{color: 'white'}}
                />
              )}
            </UX.Box>
          ) : null}
        </UX.Box>
      }
      footer={<Navbar />}
    />
  );
};

export default ShowKey;
