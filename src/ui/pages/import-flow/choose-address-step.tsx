import {ADDRESS_TYPES, AddressType} from '@/src/wallet-instance';
import bitcore from 'bitcore-lib';
import {debounce, isEmpty} from 'lodash';
import {useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component/index';
import {useCustomToast} from '../../component/toast-custom';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {satoshisToAmount} from '../../helper';
import LayoutScreenImport from '../../layouts/import-export';
import {GlobalActions} from '../../redux/reducer/global/slice';
import {SVG} from '../../svg';
import {colors} from '../../themes/color';
import {useAppDispatch} from '../../utils';
import {CreateWalletContext} from './services/wallet-service-create';
import {IResponseAddressBalance} from '../../../background/requests/paid-api';
import trac from 'trac-crypto-api';
import {AccountActions} from '../../redux/reducer/account/slice';

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
  const walletProvider = useWalletProvider();
  const dispatch = useAppDispatch();
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
        setInputDerivationPathError('Invalid derivation path.');
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
  const [tracAddress, setTracAddress] = useState<string>('');
  const [tracBalance, setTracBalance] = useState<string>('0');
  const showTracBalance = useMemo(() => {
    const n = Number(tracBalance);
    return Number.isFinite(n) && n > 0;
  }, [tracBalance]);

  const toHardenedPath = (path: string): string => {
    try {
      const cleaned = (path || '').trim();
      if (!cleaned) return "m/44'";
      const parts = cleaned.split('/');
      const prefix = parts.shift();
      const hardenedParts = parts
        .filter(Boolean)
        .map(seg => (seg.endsWith("'") ? seg : `${seg}'`));
      return `${prefix}/${hardenedParts.join('/')}`;
    } catch {
      return "m/44'";
    }
  };

  const mnemonicWordCount = useMemo(() => {
    try {
      const phrase = (contextData.mnemonics || '').trim();
      return phrase ? phrase.split(/\s+/).length : 0;
    } catch {
      return 0;
    }
  }, [contextData.mnemonics]);
  const is12Words = mnemonicWordCount === 12;

  const generateTracAddress = async () => {
    // If seed phrase is exactly 12 words, skip generating TRAC address on this screen
    if (is12Words) return;
    try {
      const option = derivationPathOptions[contextData.addressTypeIndex];
      const basePath = contextData.customDerivationPath || option?.derivationPath || "m/44'";
      const hardenedBase = toHardenedPath(basePath);
      const tracDerivationPath = `${hardenedBase}/0'`;
      let address: string;
      try {
        ({ address } = await trac.address.generate('trac', contextData.mnemonics, tracDerivationPath));
      } catch (e) {
        // Fallback when SLIP-10 lib is unavailable in runtime
        ({ address } = await trac.address.generate('trac', contextData.mnemonics));
      }
      setTracAddress(address);
      // fetch balance for preview
      try {
        const { balance } = await walletProvider.getTracBalance(address);
        setTracBalance(balance || '0');
      } catch {}
      // Persist to background for the future active account. We cannot know the actual
      // account address until wallet creation completes; so we only stage it here.
      // no need to set here; TRAC will be persisted after wallet/account creation with a stable account.key
    } catch (error) {
      console.log('Error generating Trac address:', error);
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
      keyrings.forEach(keyring => {
        keyring.accounts.forEach(v => {
          addresses.push(v.address);
        });
      });
    } catch {
      showToast({
        title: 'Something went wrong with address generation',
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
      try {
        const active = await walletProvider.getActiveAccount();
        if (active?.key && tracAddress) {
          // Save TRAC address bound to this newly created active account (stable key)
          await walletProvider.setTracAddress(tracAddress, active.key);
          dispatch(AccountActions.setTracAddressForKey({key: active.key, address: tracAddress}));
        }
      } catch {}
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
      if (!is12Words) {
        generateTracAddress();
      }
    }, 100);
  }, [
    contextData.passphrase,
    contextData.customDerivationPath,
    contextData.mnemonics,
    is12Words,
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
        header={<UX.TextHeader disableIconBack text="Error" />}
        body={
          <UX.Box spacing="xl">
            <UX.Text
              title="Can not find your seed phrase"
              styleType="heading_24"
              customStyles={{textAlign: 'center'}}
            />
            <UX.Text title="Recommend" styleType="body_16_bold" />
            <UX.Text
              title="Go back to generate new seed phrase"
              styleType="body_16_bold"
              customStyles={{color: 'white'}}
            />
          </UX.Box>
        }
        footer={
          <UX.Button
            title="Go Back"
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
              title="Choose your address type"
              styleType="heading_24"
              customStyles={{
                textAlign: 'center',
                marginTop: '8px',
              }}
            />
            
            {/* Trac Network Section: hide when mnemonic is exactly 12 words */}
            {(!is12Words) && (
                <UX.Box spacing="xs" style={{width: '100%'}}>
                  <UX.CardAddress
                    isActive={true}
                    nameCardAddress="Trac Network (TRAC)"
                    path={
                      (() => {
                        // Show SLIP-10 ed25519 hardened path aligned with selected BTC type (index 0)
                        const opt = derivationPathOptions[contextData.addressTypeIndex] || derivationPathOptions[0];
                        const base = (contextData.customDerivationPath || opt?.derivationPath || "m/44'");
                        return `${base}/0'`;
                      })()
                    }
                    address={tracAddress}
                    hasVault={showTracBalance}
                    assets={showTracBalance ? { totalBtc: tracBalance, satoshis: 0, totalInscription: 0 } : undefined}
                    assetUnit="TRAC"
                    assetIcon={<SVG.TracIcon width={20} height={20} />}
                    onClick={() => {}}
                  />
                </UX.Box>
            )}

            {/* Bitcoin Addresses Section */}
            <UX.Box spacing="xs" style={{width: '100%'}}>
              <UX.Text
                title="Bitcoin addresses:"
                styleType="body_16_bold"
                customStyles={{color: 'white', marginBottom: '8px'}}
              />
              {derivationPathOptions.filter(item => !item.label.includes('Trac')).map((item, index) => {
                const derivationPath =
                  (contextData.customDerivationPath || item.derivationPath) +
                  '/0';
                const address = previewAddresses?.[index] ?? '';
                const assets = addressAssets[address];
                const hasVault = Boolean(
                  assets?.satoshis && assets?.satoshis > 0,
                );

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
                title="Custom HdPath (Optional)"
                styleType="body_16_bold"
                customStyles={{color: 'white'}}
              />
              <UX.Input
                placeholder="Custom Hd Wallet Derivation Path"
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
                title="Phrase (Optional)"
                styleType="body_16_bold"
                customStyles={{color: 'white'}}
              />
              <UX.Input
                value={contextData.passphrase}
                placeholder="Passphrase"
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
            title="Confirm"
            onClick={handleNavigate}
          />
        </UX.Box>
      }
    />
  );
};

export default ChooseAddress;
