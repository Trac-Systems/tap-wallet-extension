import {ADDRESS_TYPES, AddressType} from '@/src/wallet-instance';
import bitcore from 'bitcore-lib';
import {debounce, isEmpty} from 'lodash';
import {useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component/index';
import {useCustomToast} from '../../component/toast-custom';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {satoshisToAmount} from '../../helper';
import {formatTracBalance} from '../../../shared/utils/btc-helper';
import {useTracBalances} from '../home-flow/hook';
import LayoutScreenImport from '../../layouts/import-export';
import {GlobalActions} from '../../redux/reducer/global/slice';
import {SVG} from '../../svg';
import {colors} from '../../themes/color';
import {TracApiService, getTracDerivationPath} from '@/src/background/service/trac-api.service';
import {useAppDispatch, useAppSelector} from '../../utils';
import {GlobalSelector} from '../../redux/reducer/global/selector';
import {CreateWalletContext} from './services/wallet-service-create';
import {IResponseAddressBalance} from '../../../background/requests/paid-api';
import {useI18n} from '../../i18n';

interface IUpdateContextDataParams {
  mnemonics?: string;
  derivationPath?: string;
  passphrase?: string;
  addressType?: AddressType;
  isCustom?: boolean;
  customDerivationPath?: string;
  addressTypeIndex?: number;
  isRestore?: boolean;
}

interface IContextData {
  mnemonics: string;
  derivationPath: string;
  passphrase: string;
  addressType: AddressType;
  isCustom: boolean;
  customDerivationPath: string;
  addressTypeIndex: number;
  isRestore?: boolean;
}

type PathOption = {
  label: string;
  derivationPath: string;
  addressType: AddressType;
  displayIndex: number;
};

const ChooseAddress = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const {showToast} = useCustomToast();
  const {t} = useI18n();
  const walletProvider = useWalletProvider();
  const dispatch = useAppDispatch();
  const networkType = useAppSelector(GlobalSelector.networkType);
  const queryParams = new URLSearchParams(location.search);
  const isImport = queryParams.get('type');
  const CreateWalletContextHandler = useContext(CreateWalletContext);
  const mnemonicString = CreateWalletContextHandler.Handlers.mnemonic;
  const [contextData, setContextData] = useState<IContextData>({
    mnemonics: mnemonicString,
    derivationPath: '',
    passphrase: '',
    addressType: AddressType.M44_P2TR,
    isCustom: false,
    customDerivationPath: '',
    addressTypeIndex: 0,
    isRestore: !!isImport,
  });
  const [addressAssets, setAddressAssets] = useState<{
    [key: string]: {
      totalBtc: string;
      satoshis: number;
      totalInscription: number;
    };
  }>({});

  const [recommendedTypeIndex, setRecommendedTypeIndex] = useState(0);
  const [pathText, setPathText] = useState(contextData.customDerivationPath);
  const [inputDerivationPathError, setInputDerivationPathError] =
    useState<string>('');

  const derivationPathOptions = useMemo(() => {
    const _pathOptions: PathOption[] = [];
    for (const k in ADDRESS_TYPES) {
      const v = ADDRESS_TYPES[k];
      _pathOptions.push({
        label: v.name,
        derivationPath: v.derivationPath,
        addressType: v.value,
        displayIndex: v.displayIndex,
      });
    }
    return _pathOptions.sort((a, b) => a.displayIndex - b.displayIndex);
  }, [contextData]);

  //! Function
  const updateContextData = useCallback(
    (params: IUpdateContextDataParams) => {
      setContextData(Object.assign({}, contextData, params));
    },
    [contextData, setContextData],
  );

  const handleCustomDerivationPath = (text: string) => {
    if (isEmpty(text)) {
      setInputDerivationPathError('');
      updateContextData({
        customDerivationPath: '',
      });
    } else {
      const isValid = bitcore.HDPrivateKey.isValidPath(text);
      if (!isValid) {
        setInputDerivationPathError(t('wallet.invalidDerivationPath'));
        return;
      }
      setInputDerivationPathError('');
      updateContextData({
        customDerivationPath: text,
      });
    }
  };

  const onDebounceCustomDerivationPath = useCallback(
    debounce(handleCustomDerivationPath, 1000),
    [],
  );

  const [previewAddresses, setPreviewAddresses] = useState<string[]>(
    derivationPathOptions.map(_v => ''),
  );

  // TRAC Address state for UI display only
  const [tracAddress, setTracAddress] = useState<string>('');
  
  // Get TRAC balance for the address
  const {total: tracBalance} = useTracBalances(tracAddress);

  const generateTracAddress = async (mnemonic: string, accountIndex: number = 0) => {
    try {
      const result = await TracApiService.generateKeypairFromMnemonic(mnemonic, accountIndex, networkType);
      return result?.address || '';
    } catch (error) {
      console.error('Error generating TRAC address:', error);
      return '';
    }
  };

  const generateAddress = async () => {
    const addresses: string[] = [];
    const keyrings = await walletProvider.previewAllAddressesFromMnemonics(
      contextData.mnemonics,
      contextData.passphrase,
      derivationPathOptions,
      contextData.customDerivationPath,
      1,
    );

    try {
      // Generate regular Bitcoin addresses
      keyrings.forEach(keyring => {
        keyring.accounts.forEach(v => {
          addresses.push(v.address);
        });
      });

      // Generate TRAC address for account 0
      const tracAddress = await generateTracAddress(contextData.mnemonics, 0);
      setTracAddress(tracAddress);

      // Do NOT persist here; persist after wallet is actually created to use real wallet.index
      
    } catch {
      showToast({
        titleKey: 'wallet.addressGenerationFailed',
        type: 'error',
      });
      return;
    }
    setPreviewAddresses(addresses);
  };

  const fetchAddressesBalance = async () => {
    if (!contextData.isRestore) {
      return;
    }

    const addresses = previewAddresses;
    if (!addresses[0]) {
      return;
    }

    let balances: IResponseAddressBalance[] = [];
    try {
      balances = await walletProvider.getAddressesBalance(addresses);
    } catch (error) {
      console.log('fetchAddressesBalance ~ error:', error);
    }

    const _addressAssets: {
      [key: string]: {
        totalBtc: any;
        satoshis: number;
        totalInscription: number;
      };
    } = {};
    let maxSatoshis = 0;
    let recommended = 0;
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      const balance = balances[i];
      const satoshis = balance?.satoshi;
      _addressAssets[address] = {
        totalBtc: satoshisToAmount(balance?.satoshi + balance?.pendingSatoshi),
        satoshis,
        totalInscription: balance?.inscriptionUtxoCount,
      };
      if (satoshis > maxSatoshis) {
        maxSatoshis = satoshis;
        recommended = i;
      }
    }
    if (maxSatoshis > 0) {
      setRecommendedTypeIndex(recommended);
    }

    setAddressAssets(_addressAssets);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleNavigate = async () => {
    try {
      const option = derivationPathOptions[contextData.addressTypeIndex];
      const derivationPath =
        contextData.customDerivationPath || option.derivationPath;
      await walletProvider.createWalletFromMnemonic(
        contextData.mnemonics,
        derivationPath,
        contextData.passphrase,
        contextData.addressType,
        1,
      );
      // After wallet is created, persist TRAC address using the real wallet index
      try {
        const activeWallet = await walletProvider.getActiveWallet();
        const walletIndex = activeWallet?.index ?? 0;
        const accountIndex = 0; // first account for new wallet
        if (tracAddress) {
          walletProvider.setTracAddress(walletIndex, accountIndex, tracAddress, networkType);
        }
      } catch (err) {
        console.log('persist TRAC address after wallet creation failed:', err);
      }
      dispatch(GlobalActions.update({isUnlocked: true}));
      if (isImport) {
        navigate(`/success?isImport=${isImport}`);
      } else {
        navigate('/success');
      }
    } catch (e) {
      const txError = (e as Error).message;
      showToast({
        title: txError,
        type: 'error',
      });
    }
  };

  //! Effect
  useEffect(() => {
    const option = derivationPathOptions[recommendedTypeIndex];
    updateContextData({
      addressType: option.addressType,
      addressTypeIndex: recommendedTypeIndex,
    });
  }, [recommendedTypeIndex]);

  useEffect(() => {
    setTimeout(() => {
      generateAddress();
    }, 100);
  }, [
    contextData.passphrase,
    contextData.customDerivationPath,
    contextData.mnemonics,
  ]);

  useEffect(() => {
    return () => {
      onDebounceCustomDerivationPath.cancel();
    };
  }, []);

  useEffect(() => {
    fetchAddressesBalance();
  }, [previewAddresses]);

  //! Render
  if (isEmpty(derivationPathOptions)) {
    return <UX.Loading />;
  }
  if (!mnemonicString) {
    return (
      <LayoutScreenImport
        header={<UX.TextHeader disableIconBack textKey="common.error" />}
        body={
          <UX.Box spacing="xl">
            <UX.Text
              titleKey="onboarding.seedPhraseNotFound"
              styleType="heading_24"
              customStyles={{textAlign: 'center'}}
            />
            <UX.Text titleKey="common.recommend" styleType="body_16_bold" />
            <UX.Text
              titleKey="onboarding.goBackGenerateSeed"
              styleType="body_16_bold"
              customStyles={{color: 'white'}}
            />
          </UX.Box>
        }
        footer={
          <UX.Button
            titleKey="common.goBack"
            onClick={() => navigate(-3)}
            styleType="primary"
          />
        }
      />
    );
  }

  return (
    <LayoutScreenImport
      header={<UX.TextHeader onBackClick={handleGoBack} />}
      body={
        <UX.Box className="heightAddress" spacing="sm">
          <UX.Box layout="column_center" spacing="xxl">
            <SVG.WalletIcon />
            <UX.Text
              titleKey="wallet.chooseAddressType"
              styleType="heading_24"
              customStyles={{
                textAlign: 'center',
                marginTop: '8px',
              }}
            />
            
            {/* TRAC Network Section */}
            <UX.Box spacing="xs" style={{width: '100%'}}>
              <UX.Text
                titleKey="wallet.tracNetworkAddress"
                styleType="body_16_bold"
                customStyles={{color: 'white', marginBottom: '8px'}}
              />
              <UX.CardAddress
                isActive={true}
                nameCardAddress="TRAC Network (TRAC)"
                path={getTracDerivationPath(0, networkType)}
                address={tracAddress}
                hasVault={tracBalance && parseFloat(tracBalance) > 0}
                assets={tracBalance && parseFloat(tracBalance) > 0 ? { totalBtc: formatTracBalance(tracBalance), satoshis: 0, totalInscription: 0 } : undefined}
                assetUnit={tracBalance && parseFloat(tracBalance) > 0 ? "TNK" : undefined}
                assetIcon={<SVG.TracIcon width={20} height={20} />}
                onClick={() => {}}
              />
            </UX.Box>

            {/* Bitcoin Addresses Section */}
            <UX.Box spacing="xs" style={{width: '100%'}}>
              <UX.Text
                titleKey="wallet.bitcoinAddresses"
                styleType="body_16_bold"
                customStyles={{color: 'white', marginBottom: '8px'}}
              />
              {derivationPathOptions.map((item, index) => {
                const derivationPath =
                  (contextData.customDerivationPath || item.derivationPath) +
                  '/0';
                const address = previewAddresses?.[index] ?? '';
                const assets = addressAssets[address];
                const hasVault = parseFloat(assets?.totalBtc || '0') > 0;

                return (
                  <UX.CardAddress
                    isActive={contextData.addressTypeIndex === index}
                    key={item.addressType}
                    nameCardAddress={item.label}
                    path={derivationPath}
                    assets={assets}
                    address={address}
                    hasVault={hasVault}
                    onClick={() =>
                      updateContextData({
                        addressTypeIndex: index,
                        addressType: item.addressType,
                      })
                    }
                  />
                );
              })}
            </UX.Box>

            <UX.Box spacing="xss" style={{width: '100%'}}>
              <UX.Text
                titleKey="wallet.customHdPathOptional"
                styleType="body_16_bold"
                customStyles={{color: 'white'}}
              />
              <UX.Input
                placeholderKey="wallet.customHdPathPlaceholder"
                value={pathText}
                onChange={e => {
                  setPathText(e.target.value);
                  onDebounceCustomDerivationPath(e.target.value);
                }}
                style={{
                  backgroundColor: colors.greyRgba42,
                }}
              />
              {inputDerivationPathError ? (
                <UX.Text
                  title={inputDerivationPathError}
                  styleType="body_12_bold"
                  customStyles={{color: colors.red_500}}
                />
              ) : null}
            </UX.Box>
            <UX.Box spacing="xss" style={{width: '100%'}}>
              <UX.Text
                titleKey="wallet.phraseOptional"
                styleType="body_16_bold"
                customStyles={{color: 'white'}}
              />
              <UX.Input
                value={contextData.passphrase}
                placeholderKey="settings.showKey.passphraseLabel"
                onChange={e => {
                  updateContextData({
                    passphrase: e.target.value,
                  });
                }}
                style={{
                  backgroundColor: colors.greyRgba42,
                }}
              />
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
            titleKey="common.confirm"
            onClick={handleNavigate}
          />
        </UX.Box>
      }
    />
  );
};

export default ChooseAddress;
