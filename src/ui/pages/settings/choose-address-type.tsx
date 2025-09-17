import {satoshisToAmount} from '@/src/shared/utils/btc-helper';
import {ADDRESS_TYPES} from '@/src/wallet-instance';
import {isEmpty} from 'lodash';
import {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import {useCustomToast} from '../../component/toast-custom';
import {useWalletProvider} from '../../gateway/wallet-provider';
import LayoutScreenSettings from '../../layouts/settings';
import {AccountSelector} from '../../redux/reducer/account/selector';
import {WalletSelector} from '../../redux/reducer/wallet/selector';
import {useAppSelector} from '../../utils';
import Navbar from '../home-flow/components/navbar-navigate';
import {useReloadAccounts} from '../home-flow/hook';

const ChooseAddressType = () => {
  //! State
  const navigate = useNavigate();
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const {showToast} = useCustomToast();
  const reloadAccounts = useReloadAccounts();
  const wallet = useWalletProvider();
  const [addresses, setAddresses] = useState<string[]>([]);
  const [addressAssets, setAddressAssets] = useState<{
    [key: string]: {
      totalBtc: string;
      satoshis: number;
      totalInscription: number;
    };
  }>({});
  const [addressTypeMap, setAddressTypeMap] = useState<{
    [key: string]: string;
  }>({});

  const checkIsSingleWallet = useMemo(() => {
    return activeWallet?.type?.includes('Single');
  }, [activeWallet]);

  const selfRef = useRef<{
    addressAssets: {
      [key: string]: {
        totalBtc: string;
        satoshis: number;
        totalInscription: number;
      };
    };
  }>({
    addressAssets: {},
  });
  const self = selfRef.current;

  const loadAddresses = async () => {
    try {
      if (isEmpty(activeWallet.key)) {
        return;
      }
      const _addresses = await wallet.getAllAddresses(
        activeWallet,
        activeAccount.index || 0,
      );
      const balances = await wallet.getAddressesBalance(
        Object.keys(_addresses),
      );

      setAddresses(Object.keys(_addresses));
      const _addressTypeMap: any = {};

      for (let i = 0; i < Object.keys(_addresses).length; i++) {
        const address = Object.keys(_addresses)[i];
        const v = _addresses[address];

        const balance = balances[i];
        const satoshis = balance?.satoshi;
        self.addressAssets[address] = {
          totalBtc: satoshisToAmount(balance?.satoshi+ balance?.pendingSatoshi),
          satoshis,
          totalInscription: balance?.inscriptionUtxoCount,
        };
        _addressTypeMap[v.addressType] = address;
      }

      setAddressTypeMap(_addressTypeMap);
      setAddressAssets(self.addressAssets);
    } catch (error) {
      showToast({
        title: error.message,
        type: 'error',
      });
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [activeWallet]);

  const checkSelected = (value: string) => {
    if (activeWallet.addressType === undefined) {
      if (value === activeWallet.addressType) {
        return true;
      }
      return false;
    } else {
      return activeWallet.addressType === value;
    }
  };

  const handleChooseAddress = async (item: any) => {
    if (item.value !== undefined && item.value !== activeWallet.addressType) {
      try {
        await wallet.changeAddressType(item.value);
      } catch (error) {
        console.log('error', error);
      }
      reloadAccounts();
      showToast({
        title: 'Wallet address type is changed',
        type: 'success',
      });
      navigate('/setting');
    }
  };

  const addressTypes = useMemo(() => {
    const _displayAddresses: any[] = [];
    for (const k in ADDRESS_TYPES) {
      const v = {
        ...ADDRESS_TYPES[k],
        derivationPath: checkIsSingleWallet
          ? ''
          : `${ADDRESS_TYPES[k].derivationPath}/${activeAccount.index}`,
      };

      if (v.displayIndex >= 0) {
        _displayAddresses.push(v);
      }
    }
    return _displayAddresses.sort((a, b) => a.displayIndex - b.displayIndex);
  }, [activeWallet.type, addressAssets, addresses]);

  //! Render
  if (isEmpty(addressTypes) || isEmpty(addressTypeMap)) {
    return <UX.Loading />;
  }

  return (
    <LayoutScreenSettings
      header={
        <UX.Box style={{padding: '0 24px'}}>
          <UX.TextHeader
            text="Choose your Bitcoin Address"
            onBackClick={() => navigate('/setting')}
          />
        </UX.Box>
      }
      body={
        <UX.Box layout="column_center" style={{padding: '0 24px'}}>
          <UX.Box spacing="xs" style={{width: '100%'}}>
            {addressTypes.map(item => {
              const address = addressTypeMap?.[item.value] ?? '';
              const assets = addressAssets[address];
              const hasVault = Boolean(
                assets?.satoshis && assets?.satoshis > 0,
              );

              return (
                <UX.CardAddress
                  onClick={() => handleChooseAddress(item)}
                  isActive={checkSelected(item.value)}
                  key={item.id}
                  nameCardAddress={item.name ?? ''}
                  path={item?.derivationPath}
                  address={addressTypeMap[item.value]}
                  hasVault={hasVault}
                  assets={assets}
                />
              );
            })}
          </UX.Box>
        </UX.Box>
      }
      footer={<Navbar />}
    />
  );
};

export default ChooseAddressType;
