import {useCustomToast} from '@/src/ui/component/toast-custom';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {AccountActions} from '@/src/ui/redux/reducer/account/slice';
import {InscriptionActions} from '@/src/ui/redux/reducer/inscription/slice';
import {WalletActions} from '@/src/ui/redux/reducer/wallet/slice';
import {
  PAGE_SIZE,
  useAppDispatch,
  useAppSelector,
  TOKEN_PAGE_SIZE,
} from '@/src/ui/utils';
import {useCallback} from 'react';

export function useAccountBalance() {
  const accountBalanceMap = useAppSelector(AccountSelector.accountBalanceMap);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);

  return (
    accountBalanceMap[activeAccount.address] || {
      amount: 0,
      expired: true,
      confirmBtcAmount: 0,
      pendingBtcAmount: 0,
      inscriptionAmount: 0,
    }
  );
}

export function useFetchBalanceCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWalletProvider();
  const currentAccount = useAppSelector(AccountSelector.activeAccount);
  const balance = useAccountBalance();
  return useCallback(async () => {
    if (!currentAccount.address) {
      return;
    }
    const _accountBalance = await wallet.getAddressBalance(
      currentAccount.address,
    );
    dispatch(
      AccountActions.setBalance({
        address: currentAccount.address,
        amount: _accountBalance.satoshi + _accountBalance.pendingSatoshi,
        btcAmount: _accountBalance.btcSatoshi,
        inscriptionAmount: _accountBalance.inscriptionUtxoCount,
        pendingBtcAmount: _accountBalance.btcPendingSatoshi,
      }),
    );
  }, [dispatch, wallet, currentAccount, balance]);
}

export function useReloadAccounts() {
  const dispatch = useAppDispatch();
  const wallet = useWalletProvider();
  return useCallback(async () => {
    const wallets = await wallet.getWallets();
    dispatch(WalletActions.setListWallet(wallets));

    const activeWallet = await wallet.getActiveWallet();
    dispatch(WalletActions.setActiveWallet(activeWallet));

    const _accounts = await wallet.getAccounts();
    dispatch(AccountActions.setAccounts(_accounts));

    const activeAccount = await wallet.getActiveAccount();
    dispatch(AccountActions.setActiveAccount(activeAccount));

    dispatch(AccountActions.expireBalance());
    dispatch(AccountActions.expireInscriptions());

    const runeUtxos = await wallet.getAllRuneUtxos(activeAccount.address);
    dispatch(AccountActions.setRuneUtxos(runeUtxos));

    dispatch(AccountActions.resetDmtCollectibleMap());
  }, [dispatch, wallet]);
}

export const useInscriptionHook = () => {
  const wallet = useWalletProvider();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const dispatch = useAppDispatch();
  const {showToast} = useCustomToast();

  const getInscriptionList = async (currentCursor: number) => {
    if (!activeAccount.address) {
      return;
    }
    try {
      const {list, total} = await wallet.getInscriptions(
        activeAccount.address,
        currentCursor,
        PAGE_SIZE,
      );
      dispatch(InscriptionActions.setTotalInscription(total));
      dispatch(InscriptionActions.setListInscription({list}));
    } catch (err) {
      showToast({
        title: `${(err as Error).message}`,
        type: 'error',
      });
    }
  };

  const getTapList = async (page: number) => {
    try {
      const {list, total} = await wallet.getTapList(
        activeAccount.address,
        page,
        TOKEN_PAGE_SIZE,
      );
      dispatch(InscriptionActions.setTotalTap(total));
      dispatch(InscriptionActions.setListTapToken({list}));
    } catch (err) {
      showToast({
        title: `${(err as Error).message}`,
        type: 'error',
      });
    }
  };

  return {
    getTapList,
    getInscriptionList,
  };
};
