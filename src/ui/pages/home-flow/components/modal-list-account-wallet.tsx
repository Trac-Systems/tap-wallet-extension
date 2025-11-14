import {useEffect, useState} from 'react';
import {UX} from '@/src/ui/component';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {AccountActions} from '@/src/ui/redux/reducer/account/slice';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {useAppDispatch, useAppSelector} from '@/src/ui/utils';
import {IDisplayAccount} from '@/src/wallet-instance';
import {useNavigate} from 'react-router-dom';
import {useReloadAccounts} from '../hook';
import {SVG} from '@/src/ui/svg';

interface IModalListAccountWalletProps {
  handleClose?: () => void;
}
const ModalListAccountWallet = (props: IModalListAccountWalletProps) => {
  //! State
  const {handleClose} = props;
  const navigate = useNavigate();
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const wallet = useWalletProvider();
  const dispatch = useAppDispatch();
  const {showToast} = useCustomToast();
  const reloadAccounts = useReloadAccounts();
  const [tracAddressMap, setTracAddressMap] = useState<{
    [accountIndex: string]: string;
  }>({});

  useEffect(() => {
    let ignore = false;
    const fetchTracAddresses = async () => {
      if (typeof activeWallet?.index !== 'number') {
        if (!ignore) {
          setTracAddressMap({});
        }
        return;
      }

      try {
        const map =
          (await Promise.resolve(
            wallet.getWalletTracAddresses(activeWallet.index),
          )) || {};
        if (!ignore) {
          setTracAddressMap(map);
        }
      } catch (error) {
        if (!ignore) {
          setTracAddressMap({});
        }
      }
    };

    fetchTracAddresses();
    return () => {
      ignore = true;
    };
  }, [wallet, activeWallet?.index, activeWallet?.accounts?.length]);

  const deriveTracPath = (accountIndex?: number) => {
    const index = accountIndex ?? 0;
    return `m/918'/0'/0'/${index}'`;
  };

  //! Function
  const handleChangeAccount = async (account: IDisplayAccount) => {
    if (activeAccount.pubkey !== account.pubkey) {
      await wallet.changeWallet(activeWallet, account.index);
      const _activeAccount = await wallet.getActiveAccount();
      dispatch(AccountActions.setActiveAccount(_activeAccount));
      reloadAccounts();
      showToast({
        title: 'Account changed',
        type: 'success',
      });
      handleClose?.();
    }
  };

  //! Render
  return (
    <UX.Box
      style={{
        padding: '0 16px',
      }}
      spacing="xl">
      <UX.Box layout="row_between" style={{marginTop: '16px'}}>
        <UX.Text title="Select account" styleType="body_20_extra_bold" />
        <UX.Box
          onClick={() => navigate('/home/create-account')}
          style={{cursor: 'pointer'}}>
          <SVG.AddIcon />
        </UX.Box>
      </UX.Box>

      <UX.Box
        spacing="xs"
        style={{
          width: '100%',
          height: '75vh',
          padding: '10px 0',
          overflowY: 'scroll',
        }}>
        {activeWallet?.accounts?.map(item => {
          const btcPath = `${activeWallet.derivationPath}/${item.index}`;
          const accountIndexKey = String(item?.index ?? 0);
          const tracAddress = tracAddressMap?.[accountIndexKey];

          return (
            <UX.CardAddress
              isAccount
              onClick={() => handleChangeAccount(item)}
              isActive={item.index === activeAccount.index}
              key={item.index}
              nameCardAddress={item.name}
              path={btcPath}
              address={item.address}
              secondaryLabel={tracAddress ? 'TRAC' : undefined}
              secondaryAddress={tracAddress}
              secondaryPath={tracAddress ? deriveTracPath(item.index) : undefined}
              item={item}
            />
          );
        })}
      </UX.Box>
      {/* <UX.Button
        title="Create account"
        styleType="primary"
        onClick={() => navigate('/home/create-account')}
      /> */}
    </UX.Box>
  );
};

export default ModalListAccountWallet;
