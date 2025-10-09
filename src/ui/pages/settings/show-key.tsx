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
import {useIsTracSingleWallet} from '../home-flow/hook';

const ShowKey = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const {state} = location;
  const queryParams = new URLSearchParams(location.search);
  const type = queryParams.get('type');
  const isMnemonics = type === 'recovery';
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const isTracSingleWallet = useIsTracSingleWallet();

  const toHexString = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    try {
      // Uint8Array or Buffer-like
      if (Array.isArray(val)) {
        return (val as number[]).map(b => b.toString(16).padStart(2, '0')).join('');
      }
      if (val?.type === 'Buffer' && Array.isArray(val?.data)) {
        return (val.data as number[]).map((b: number) => b.toString(16).padStart(2, '0')).join('');
      }
      if (val?.length !== undefined && typeof val[0] === 'number') {
        const arr = Array.from(val as Uint8Array);
        return arr.map(b => b.toString(16).padStart(2, '0')).join('');
      }
      // Plain object with numeric keys: { "0": 135, "1": 164, ... }
      if (
        typeof val === 'object' &&
        val !== null &&
        Object.keys(val).length > 0 &&
        Object.keys(val).every(k => /^\d+$/.test(k))
      ) {
        const maxIndex = Math.max(...Object.keys(val).map(k => Number(k)));
        const bytes: number[] = [];
        for (let i = 0; i <= maxIndex; i++) {
          const v = (val as Record<string, number>)[String(i)];
          if (typeof v !== 'number') break;
          bytes.push(v);
        }
        if (bytes.length > 0) {
          return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
        }
      }
      // Common shapes: { hex: '...' } or nested string fields
      if (typeof val.hex === 'string') {
        return val.hex;
      }
      // Find any long hex-like string field
      for (const k of Object.keys(val)) {
        const v = val[k];
        if (typeof v === 'string' && /^(0x)?[0-9a-fA-F]{32,}$/.test(v)) {
          return v.startsWith('0x') ? v.slice(2) : v;
        }
      }
      // Fallback to stringify
      return String(val);
    } catch {
      return String(val);
    }
  };
  const secretValue = useMemo(() => {
    if (type === RestoreTypes.MNEMONIC) {
      return state?.mnemonic;
    } else {
      // For private keys, we now have both btcHex and tracHex in state
      return state?.hex; // This is for backward compatibility
    }
  }, [state, type]);
  

  

  const {showToast} = useCustomToast();
  const appBarTitleText = isMnemonics ? 'Seed Phrase' : 'Private Keys';
  const contentTitleText = isMnemonics
    ? 'These are the key to your wallet!'
    : 'This is the key to your wallet!';
  const warningText = isMnemonics
    ? 'Please write them down or store it anywhere safe.'
    : 'Make sure you don\'t share it with anyone.';
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

          {isMnemonics ? (
            <>
              <UX.TextArea className="textareaWidth" disabled placeholder={secretValue ?? ''} />
              <UX.Button styleType="copy" title="Copy to clipboard" copy onClick={() => copyToClipboard(String(secretValue ?? '')).then(() => showToast({type: 'copied', title: 'Copied'}))} />
            </>
          ) : (
            <>
              {/* Show Bitcoin Private Key if not TRAC single wallet */}
              {!isTracSingleWallet && (
                <>
                  <UX.Text title="Bitcoin Private Key" styleType="body_16_bold" />
                  <UX.TextArea className="textareaWidth" disabled placeholder={String(state?.btcHex ?? '')} />
                  <UX.Button styleType="copy" title="Copy BTC key" copy onClick={() => copyToClipboard(String(state?.btcHex ?? '')).then(() => showToast({type: 'copied', title: 'Copied'}))} />
                  
                  <UX.Box style={{height: '20px'}} />
                </>
              )}
              
              {/* Show TRAC Private Key */}
              <UX.Text title="TRAC Private Key" styleType="body_16_bold" />
              <UX.TextArea className="textareaWidth" disabled placeholder={toHexString(state?.tracHex ?? '')} />
              <UX.Button styleType="copy" title="Copy TRAC key" copy onClick={() => copyToClipboard(toHexString(state?.tracHex ?? '')).then(() => showToast({type: 'copied', title: 'Copied'}))} />
            </>
          )}
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
