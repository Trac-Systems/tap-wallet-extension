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
import {useCallback, useEffect, useState, useRef} from 'react';
import {InscriptionSelector} from '@/src/ui/redux/reducer/inscription/selector';

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
    dispatch(AccountActions.resetDmtGroupMap());

    const currentAuthority = await wallet.getCurrentAuthority(
      activeAccount.address,
    );
    dispatch(AccountActions.setCurrentAuthority(currentAuthority));
  }, [dispatch, wallet]);
}

export const useInscriptionHook = () => {
  const wallet = useWalletProvider();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const dispatch = useAppDispatch();
  const {showToast} = useCustomToast();
  const retryCountRef = useRef(0);

  const getInscriptionList = async (currentCursor: number) => {
    if (!activeAccount.address) {
      return;
    }
    
    try {
      let result;
      try {
        result = await wallet.getInscriptions(
          activeAccount.address,
          currentCursor,
          PAGE_SIZE,
        );
      } catch (apiError) {
        throw apiError;
      }
      if (result?.total === undefined) {
        throw new Error('[getInscriptionList] Invalid API response structure');
      }
      const {list, total} = result;
      retryCountRef.current = 0;
      dispatch(InscriptionActions.setTotalInscription(total));
      dispatch(InscriptionActions.setListInscription({list}));
      
    } catch (err) {
      if (retryCountRef.current < 10) {
        setTimeout(() => {
          retryCountRef.current += 1;
          getInscriptionList(currentCursor);
        }, 100);
        
      } else {
        dispatch(InscriptionActions.setTotalInscription(0));
        dispatch(InscriptionActions.setListInscription({list: []}));
        retryCountRef.current = 0;
        showToast({
          title: `${(err as Error).message}`,
          type: 'error',
        });
      }
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

export const useTokenInfo = () => {

  const dispatch = useAppDispatch();
  const tokenInfoMap = useAppSelector(state => state.inscriptionReducer.tokenInfoMap);
  const wallet = useWalletProvider();

  const [loadingTicker, setLoadingTicker] = useState<string | null>(null);
  const [errorTicker, setErrorTicker] = useState<string | null>(null);

  const getTokenInfoAndStore = useCallback(async (ticker: string) => {
    if (!ticker || tokenInfoMap[ticker] || loadingTicker === ticker) return;
    setLoadingTicker(ticker);
    setErrorTicker(null);
    try {
      const tokenInfoRaw = await wallet.getDeployment(ticker);
      dispatch(InscriptionActions.setTokenInfo({
        ticker,
        tokenInfo: tokenInfoRaw,
      }));
    } catch (e) {
      setErrorTicker(ticker);
    } finally {
      setLoadingTicker(null);
    }
  }, [dispatch, tokenInfoMap, wallet, loadingTicker]);

  const getTokenInfo = useCallback((ticker: string) => {
    return tokenInfoMap[ticker];
  }, [tokenInfoMap]);

  return {
    getTokenInfo,
    getTokenInfoAndStore,
    loadingTicker,
    errorTicker,
    tokenInfoMap,
  };
};

export const useAllInscriptions = () => {
  const wallet = useWalletProvider();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const dispatch = useAppDispatch();
  
  const allInscriptions = useAppSelector(InscriptionSelector.allInscriptions);
  const loading = useAppSelector(InscriptionSelector.allInscriptionsLoading);
  const error = useAppSelector(InscriptionSelector.allInscriptionsError);

  const fetchAllInscriptions = useCallback(async () => {
    if (!activeAccount?.address) {
      return;
    }
    
    dispatch(InscriptionActions.setAllInscriptionsLoading(true));
    dispatch(InscriptionActions.setAllInscriptionsError(null));
    
    try {
      const inscriptions = await wallet.getAllInscriptions(activeAccount.address);
      dispatch(InscriptionActions.setAllInscriptions(inscriptions || []));
    } catch (err) {
      dispatch(InscriptionActions.setAllInscriptionsError((err as Error).message));
      dispatch(InscriptionActions.setAllInscriptions([]));
    } finally {
      dispatch(InscriptionActions.setAllInscriptionsLoading(false));
    }
  }, [wallet, activeAccount?.address, dispatch]);

  const refreshAllInscriptions = useCallback(async () => {
    await fetchAllInscriptions();
  }, [fetchAllInscriptions]);

  useEffect(() => {
    dispatch(InscriptionActions.setAllInscriptions([]));
    dispatch(InscriptionActions.setAllInscriptionsError(null));
  }, [activeAccount?.address, dispatch]);

  return {
    allInscriptions,
    loading,
    error,
    fetchAllInscriptions,
    refreshAllInscriptions,
  };
};
