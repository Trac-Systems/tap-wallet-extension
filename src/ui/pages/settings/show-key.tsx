import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component/index';
import {copyToClipboard} from '../../helper';
import LayoutScreenSettings from '../../layouts/settings';
import Navbar from '../home-flow/components/navbar-navigate';
import {useMemo} from 'react';
import {isEmpty} from 'lodash';
import {RestoreTypes} from '@/src/wallet-instance';
import {useAppSelector} from '../../utils';
import {AccountSelector} from '../../redux/reducer/account/selector';
import {useIsTracSingleWallet} from '../home-flow/hook';
import {useI18n, useTranslatedToast} from '../../i18n';

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
  const {t} = useI18n();
  const {showTranslatedToast} = useTranslatedToast();

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
  

  

  const appBarTitleText = isMnemonics
    ? t('settings.showKey.seedPhrase')
    : t('settings.showKey.privateKeys');
  const contentTitleText = isMnemonics
    ? t('settings.showKey.seedPhraseTitle')
    : t('settings.showKey.privateKeyTitle');
  const warningText = isMnemonics
    ? t('settings.showKey.seedPhraseWarning')
    : t('settings.showKey.privateKeyWarning');
  //! Function
  const handleGoBack = () => {
    navigate('/setting');
  };

  const handleCopy = (value: string) => {
    copyToClipboard(value).then(() => {
      showTranslatedToast({
        type: 'copied',
        titleKey: 'common.copied',
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
              <UX.Button styleType="copy" title={t('settings.showKey.copyToClipboard')} copy onClick={() => handleCopy(String(secretValue ?? ''))} />
            </>
          ) : (
            <>
              {/* Show Bitcoin Private Key if not TRAC single wallet */}
              {!isTracSingleWallet && (
                <>
                  <UX.Text title={t('settings.showKey.bitcoinPrivateKey')} styleType="body_16_bold" />
                  <UX.TextArea className="textareaWidth" disabled placeholder={String(state?.btcHex ?? '')} />
                  <UX.Button styleType="copy" title={t('settings.showKey.copyBTCKey')} copy onClick={() => handleCopy(String(state?.btcHex ?? ''))} />
                  
                  <UX.Box style={{height: '20px'}} />
                </>
              )}
              
              {/* Show TRAC Private Key */}
              <UX.Text title={t('settings.showKey.tracPrivateKey')} styleType="body_16_bold" />
              <UX.TextArea className="textareaWidth" disabled placeholder={toHexString(state?.tracHex ?? '')} />
              <UX.Button styleType="copy" title={t('settings.showKey.copyTRACKey')} copy onClick={() => handleCopy(toHexString(state?.tracHex ?? ''))} />
            </>
          )}
          {isMnemonics ? (
            <UX.Box layout="box" spacing="sm" style={{width: '100%'}}>
              <UX.Text
                title={t('settings.showKey.advancedOptions')}
                styleType="body_14_bold"
                customStyles={{color: 'white'}}
              />
              <UX.Text
                title={t('settings.showKey.derivationPath', {
                  path: `${state?.derivationPath ?? ''}/${activeAccount.index}`,
                })}
                styleType="body_14_bold"
              />
              {state?.passphrase && (
                <UX.Text
                  title={t('settings.showKey.passphrase', {
                    passphrase: state.passphrase,
                  })}
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
