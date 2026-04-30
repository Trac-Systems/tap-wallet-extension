import {useEffect, useState} from 'react';
import {UX} from '@/src/ui/component';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {AccountActions} from '@/src/ui/redux/reducer/account/slice';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {useAppDispatch, useAppSelector} from '@/src/ui/utils';
import {IDisplayAccount, WalletDisplay} from '@/src/wallet-instance';
import {useNavigate} from 'react-router-dom';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';
import {getTracDerivationPath} from '@/src/background/service/trac-api.service';
import {useReloadAccounts} from '../hook';
import {SVG} from '@/src/ui/svg';

interface IModalListAccountWalletProps {
  handleClose?: () => void;
}

const ModalListAccountWallet = (props: IModalListAccountWalletProps) => {
  const {handleClose} = props;
  const navigate = useNavigate();
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const wallet = useWalletProvider();
  const dispatch = useAppDispatch();
  const {showToast} = useCustomToast();
  const reloadAccounts = useReloadAccounts();
  const networkType = useAppSelector(GlobalSelector.networkType);
  const [displayWallet, setDisplayWallet] = useState<WalletDisplay | null>(null);
  const [tracAddressMap, setTracAddressMap] = useState<{
    [accountIndex: string]: string;
  }>({});

  useEffect(() => {
    let ignore = false;

    const syncWalletState = async () => {
      await reloadAccounts();
      const nextWallet = await wallet.getActiveWallet();

      if (!ignore) {
        setDisplayWallet(nextWallet);
      }
    };

    syncWalletState();

    return () => {
      ignore = true;
    };
  }, [reloadAccounts, wallet, networkType, activeWallet?.index]);

  useEffect(() => {
    let ignore = false;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let retries = 0;
    const MAX_RETRIES = 4;
    const currentWallet = displayWallet || activeWallet;

    const fetchTracAddresses = async () => {
      if (typeof currentWallet?.index !== 'number') {
        if (!ignore) {
          setTracAddressMap({});
        }
        return;
      }

      try {
        const map =
          (await Promise.resolve(
            wallet.getWalletTracAddresses(currentWallet.index, networkType),
          )) || {};

        if (!ignore) {
          setTracAddressMap(map);

          const totalAccounts = currentWallet?.accounts?.length || 0;
          const fetchedTracCount = Object.keys(map).length;

          if (fetchedTracCount > 0 && fetchedTracCount < totalAccounts && retries < MAX_RETRIES) {
            retries++;
            retryTimeout = setTimeout(() => {
              if (!ignore) fetchTracAddresses();
            }, 300);
          }
        }
      } catch {
        if (!ignore) {
          setTracAddressMap({});
        }
      }
    };

    fetchTracAddresses();

    return () => {
      ignore = true;
      clearTimeout(retryTimeout);
    };
  }, [wallet, activeWallet, displayWallet, networkType]);

  const deriveTracPath = (accountIndex?: number) => {
    const index = accountIndex ?? 0;
    return getTracDerivationPath(index, networkType);
  };

  const handleChangeAccount = async (account: IDisplayAccount) => {
    const currentWallet = displayWallet || activeWallet;

    if (!currentWallet) {
      return;
    }

    if (activeAccount.pubkey !== account.pubkey) {
      await wallet.changeWallet(currentWallet, account.index);
      await reloadAccounts();
      const _activeAccount = await wallet.getActiveAccount();
      const _activeWallet = await wallet.getActiveWallet();
      dispatch(AccountActions.setActiveAccount(_activeAccount));
      setDisplayWallet(_activeWallet);
      showToast({
        titleKey: 'account.changed',
        type: 'success',
      });
      handleClose?.();
    }
  };

  return (
    <UX.Box
      style={{
        padding: '0 16px',
      }}
      spacing="xl">
      <UX.Box layout="row_between" style={{marginTop: '16px'}}>
        <UX.Text titleKey="account.select" styleType="body_20_extra_bold" />
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
        {(displayWallet?.accounts || activeWallet?.accounts || []).map(item => {
          const derivationPath =
            (displayWallet || activeWallet)?.derivationPath || '';
          const btcPath = `${derivationPath}/${item.index}`;
          const accountIndexKey = String(item?.index ?? 0);
          const tracAddress = tracAddressMap?.[accountIndexKey];

          return (
            <UX.CardAddress
              isAccount
              onClick={() => handleChangeAccount(item)}
              isActive={item.index === activeAccount.index}
              key={`${networkType}-${item.index}`}
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
    </UX.Box>
  );
};

export default ModalListAccountWallet;
