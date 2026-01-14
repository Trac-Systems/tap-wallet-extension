import {satoshisToAmount} from '@/src/shared/utils/btc-helper';
import {ADDRESS_TYPES, AddressType} from '@/src/wallet-instance';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import {useCustomToast} from '../../component/toast-custom';
import {useWalletProvider} from '../../gateway/wallet-provider';
import LayoutScreenImport from '../../layouts/import-export';
import {GlobalActions} from '../../redux/reducer/global/slice';
import {SVG} from '../../svg';
import {useAppDispatch} from '../../utils';
import {useReloadAccounts} from '../home-flow/hook';
import {CreateWalletContext} from './services/wallet-service-create';

interface IUpdateContextDataParams {
  wif?: string;
  addressType?: AddressType;
  addressTypeIndex?: number;
}

interface IContextData {
  wif: string;
  addressType: AddressType;
  addressTypeIndex?: number;
}
const ChooseAddressPrivate = () => {
  //! State
  const navigate = useNavigate();
  const reloadAccounts = useReloadAccounts();
  const dispatch = useAppDispatch();
  const walletProvider = useWalletProvider();
  const {showToast} = useCustomToast();
  const CreateWalletContextHandler = useContext(CreateWalletContext);
  const [contextData, setContextData] = useState<IContextData>({
    wif: CreateWalletContextHandler.Handlers.wif,
    addressType: AddressType.M44_P2TR,
    addressTypeIndex: 0,
  });

  const updateContextData = useCallback(
    (params: IUpdateContextDataParams) => {
      setContextData(Object.assign({}, contextData, params));
    },
    [contextData, setContextData],
  );

  const derivationPathOptions = useMemo(() => {
    const _pathOptions: any[] = [];
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

  const [previewAddresses, setPreviewAddresses] = useState<string[]>(
    derivationPathOptions.map(() => ''),
  );
  const [addressAssets, setAddressAssets] = useState<{
    [key: string]: {
      totalBtc: string;
      satoshis: number;
      totalInscription: number;
    };
  }>({});

  const selfRef = useRef({
    maxSatoshis: 0,
    recommended: 0,
    count: 0,
    addressBalances: {},
  });
  const self = selfRef.current;

  const run = async () => {
    const addresses: string[] = [];
    // try {
    for (let i = 0; i < derivationPathOptions.length; i++) {
      const options = derivationPathOptions[i];
      const keyring = await walletProvider.previewAddressFromPrivateKey(
        contextData.wif,
        options.addressType,
      );
      const address = keyring.accounts[0].address;
      addresses.push(address);
    }

    const balances = await walletProvider.getAddressesBalance(addresses);
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      const balance = balances[i];
      const satoshis = balance.satoshi;
      self.addressBalances[address] = {
        totalBtc: satoshisToAmount(balance.satoshi + balance.pendingSatoshi),
        satoshis,
        totalInscription: balance.inscriptionUtxoCount,
      };
      if (satoshis > self.maxSatoshis) {
        self.maxSatoshis = satoshis;
        self.recommended = i;
      }

      updateContextData({
        addressType: derivationPathOptions[self.recommended].addressType,
      });
      setAddressAssets(self.addressBalances);
    }
    setPreviewAddresses(addresses);
    // } catch (error) {
    //   showToast({
    //     title: error.message,
    //     type: 'error',
    //   });
    // }
  };

  useEffect(() => {
    run();
  }, [contextData.wif]);

  const handleConfirmPress = async () => {
    try {
      await walletProvider.createWalletFromPrivateKey(
        contextData.wif,
        contextData.addressType,
      );
      reloadAccounts();
      dispatch(GlobalActions.update({isUnlocked: true}));
      navigate('/success?isImport=isImport');
    } catch (e) {
      const txError = (e as Error).message;
      showToast({
        title: txError,
        type: 'error',
      });
    }
  };

  const pathIndex = useMemo(() => {
    return derivationPathOptions.findIndex(
      v => v.addressType === contextData.addressType,
    );
  }, [derivationPathOptions, contextData.addressType]);

  return (
    <LayoutScreenImport
      header={<UX.TextHeader onBackClick={() => navigate(-1)} />}
      body={
        <UX.Box className="heightAddress" spacing="sm">
          <UX.Box layout="column_center" spacing="xxl">
            <SVG.WalletIcon />
            <UX.Text
              title="Choose your Address"
              styleType="heading_24"
              customStyles={{
                textAlign: 'center',
                marginTop: '8px',
              }}
            />
            <UX.Box spacing="xs" style={{width: '100%'}}>
              {derivationPathOptions.map((item, index) => {
                const address = previewAddresses[index];
                const assets = addressAssets[address];
                const hasVault = parseFloat(assets?.totalBtc || '0') > 0;
                return (
                  <UX.CardAddress
                    key={index}
                    hasVault={hasVault}
                    nameCardAddress={item?.label}
                    address={address}
                    isActive={index === pathIndex}
                    assets={assets}
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
            onClick={handleConfirmPress}
          />
        </UX.Box>
      }
    />
  );
};

export default ChooseAddressPrivate;
