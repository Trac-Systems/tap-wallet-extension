import {useRef, useCallback, useEffect} from 'react';
import {useSelector} from 'react-redux';
import {useAppDispatch, useAppSelector} from '../utils';
import {useWalletProvider} from '../gateway/wallet-provider';
import {AccountSelector} from '../redux/reducer/account/selector';
import {GlobalSelector} from '../redux/reducer/global/selector';
import {
  useAccountBalance,
  useFetchBalanceCallback,
  useReloadAccounts,
} from '../pages/home-flow/hook';
import {IDisplayAccount, Network} from '@/src/wallet-instance';
import {AccountActions} from '../redux/reducer/account/slice';
import eventBus from '@/src/gateway/event-bus';
import { GlobalActions } from '@/src/ui/redux/reducer/global/slice';

export default function AccountUpdater() {
  const dispatch = useAppDispatch();
  const wallet = useWalletProvider();
  const fetchBalance = useFetchBalanceCallback();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const isUnlocked = useSelector(GlobalSelector.isUnlocked);
  const balance = useAccountBalance();
  const selfRef = useRef({
    preAccountKey: '',
    loadingBalance: false,
    loadingHistory: false,
  });
  const self = selfRef.current;

  const reloadAccounts = useReloadAccounts();

  const onCurrentChange = useCallback(async () => {
    if (
      isUnlocked &&
      activeAccount &&
      activeAccount.key !== self.preAccountKey
    ) {
      self.preAccountKey = activeAccount.key;
      reloadAccounts();
    }
  }, [dispatch, activeAccount, wallet, isUnlocked]);

  useEffect(() => {
    onCurrentChange();
  }, [activeAccount && activeAccount.key, isUnlocked]);

  useEffect(() => {
    if (self.loadingBalance) {
      return;
    }
    if (!isUnlocked) {
      return;
    }
    if (!balance.expired) {
      return;
    }
    self.loadingBalance = true;
    fetchBalance().finally(() => {
      self.loadingBalance = false;
    });
  }, [fetchBalance, wallet, isUnlocked, self, balance.expired]);

  useEffect(() => {
    const accountChangeHandler = (account: IDisplayAccount) => {
      if (account && account.address) {
        dispatch(AccountActions.setActiveAccount(account));
      }
    };

    eventBus.addEventListener('accountsChanged', accountChangeHandler);
    return () => {
      eventBus.removeEventListener('accountsChanged', accountChangeHandler);
    };
  }, [dispatch]);

  useEffect(() => {
    const networkChangedHandler = (networkType: Network) => {
      dispatch(
        GlobalActions.updateNetwork({
          networkType,
        }),
      );
    };

    eventBus.addEventListener('networkChanged', networkChangedHandler);
    return () => {
      eventBus.removeEventListener('networkChanged', networkChangedHandler);
    };
  }, [dispatch]);

  return <></>;
}
