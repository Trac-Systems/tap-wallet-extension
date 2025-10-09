import {useCustomToast} from '@/src/ui/component/toast-custom';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {AccountActions} from '@/src/ui/redux/reducer/account/slice';
import {InscriptionActions} from '@/src/ui/redux/reducer/inscription/slice';
import {WalletActions} from '@/src/ui/redux/reducer/wallet/slice';
import {TracApiService} from '@/src/background/service/trac-api.service';
import {
  PAGE_SIZE,
  useAppDispatch,
  useAppSelector,
  TOKEN_PAGE_SIZE,
} from '@/src/ui/utils';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {TracBalanceActions} from '@/src/ui/redux/reducer/trac-balance/slice';
import {TracBalanceSelector} from '@/src/ui/redux/reducer/trac-balance/selector';
import {InscriptionSelector} from '@/src/ui/redux/reducer/inscription/selector';
// TRAC balance service (shared)
export const TRAC_BASE_URL = 'http://trac.intern.ungueltig.com:1337';

export async function getTracBalances(address: string): Promise<{
  total: string;
  confirmed: string;
  unconfirmed: string;
}> {
  if (!address) return {total: '', confirmed: '', unconfirmed: ''};
  const urlTotal = `${TRAC_BASE_URL}/balance/${address}`;
  const urlConfirmed = `${TRAC_BASE_URL}/balance/${address}?confirmed=true`;
  const urlUnconfirmed = `${TRAC_BASE_URL}/balance/${address}?confirmed=false`;
  const [rTotal, rConfirmed, rUnconfirmed] = await Promise.all([
    fetch(urlTotal),
    fetch(urlConfirmed),
    fetch(urlUnconfirmed),
  ]);
  const [jTotal, jConfirmed, jUnconfirmed] = await Promise.all([
    rTotal.ok ? rTotal.json().catch(() => ({} as any)) : ({} as any),
    rConfirmed.ok ? rConfirmed.json().catch(() => ({} as any)) : ({} as any),
    rUnconfirmed.ok ? rUnconfirmed.json().catch(() => ({} as any)) : ({} as any),
  ]);
  return {
    total: jTotal?.balance ? TracApiService.balanceToDisplay(jTotal.balance) : '',
    confirmed: jConfirmed?.balance ? TracApiService.balanceToDisplay(jConfirmed.balance) : '',
    unconfirmed: jUnconfirmed?.balance ? TracApiService.balanceToDisplay(jUnconfirmed.balance) : '',
  };
}

export async function getTracTotal(address: string): Promise<string> {
  if (!address) return '';
  const url = `${TRAC_BASE_URL}/balance/${address}`;
  const resp = await fetch(url);
  if (!resp.ok) return '';
  const data = await resp.json().catch(() => ({} as any));
  const rawBalance = (data?.balance ?? '') as string;
  return rawBalance ? TracApiService.balanceToDisplay(rawBalance) : '';
}

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


// Derive active TRAC address from active wallet/account indices
export function useActiveTracAddress() {
  const wallet = useWalletProvider();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const [tracAddress, setTracAddress] = useState<string>('');

  useEffect(() => {
    let ignore = false;
    const deriveTrac = async () => {
      try {
        if (
          typeof activeWallet?.index === 'number' &&
          typeof activeAccount?.index === 'number'
        ) {
          const addr = await wallet.getTracAddress(
            activeWallet.index,
            activeAccount.index,
          );
          if (!ignore) setTracAddress(addr || '');
        } else if (!ignore) {
          setTracAddress('');
        }
      } catch {
        if (!ignore) setTracAddress('');
      }
    };
    deriveTrac();
    return () => {
      ignore = true;
    };
  }, [wallet, activeWallet?.index, activeAccount?.index]);

  return tracAddress;
}

// Check if current active wallet is a Single wallet that has TRAC mapped
export function useIsTracSingleWallet() {
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const tracAddress = useActiveTracAddress();
  const isSingle = !!activeWallet?.type?.includes('Single');
  return !!(isSingle && tracAddress);
}

// Fetch TRAC balance for an arbitrary TRAC address (not tied to Redux map)
export function useTracBalanceByAddress(address?: string) {
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const latestCallIdRef = useRef<number>(0);

  const fetchBalance = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    const callId = ++latestCallIdRef.current;
    try {
      const next = await getTracTotal(address);
      if (callId === latestCallIdRef.current) {
        setBalance(next || '');
      }
    } catch (e) {
      if (callId === latestCallIdRef.current) {
        setError((e as Error).message);
        setBalance('');
      }
    } finally {
      if (callId === latestCallIdRef.current) {
        setLoading(false);
      }
    }
  }, [address]);

  useEffect(() => {
    // Clear value immediately when address changes to avoid showing previous address total
    setBalance('0');
    fetchBalance();
  }, [fetchBalance]);

  return {balance, loading, error, refetch: fetchBalance};
}

// Reusable TRAC balances hook: total, confirmed, unconfirmed
export function useTracBalances(address?: string) {
  const dispatch = useAppDispatch();
  const reduxBalances = useAppSelector(state => TracBalanceSelector.byAddress(state, address));
  
  // Use useMemo to automatically sync with Redux state changes
  const total = useMemo(() => reduxBalances.total || '', [reduxBalances.total]);
  const confirmed = useMemo(() => reduxBalances.confirmed || '', [reduxBalances.confirmed]);
  const unconfirmed = useMemo(() => reduxBalances.unconfirmed || '', [reduxBalances.unconfirmed]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const latestCallIdRef = useRef<number>(0);

  const fetchBalances = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);

    const callId = ++latestCallIdRef.current;
    const urlTotal = `${TRAC_BASE_URL}/balance/${address}`;
    const urlConfirmed = `${TRAC_BASE_URL}/balance/${address}?confirmed=true`;
    const urlUnconfirmed = `${TRAC_BASE_URL}/balance/${address}?confirmed=false`;

    try {
      // Fetch all three in parallel for maximum responsiveness
      const [rTotal, rConfirmed, rUnconfirmed] = await Promise.all([
        fetch(urlTotal),
        fetch(urlConfirmed),
        fetch(urlUnconfirmed),
      ]);

      const [jTotal, jConfirmed, jUnconfirmed] = await Promise.all([
        rTotal.ok ? rTotal.json().catch(() => ({} as any)) : ({} as any),
        rConfirmed.ok ? rConfirmed.json().catch(() => ({} as any)) : ({} as any),
        rUnconfirmed.ok ? rUnconfirmed.json().catch(() => ({} as any)) : ({} as any),
      ]);

      const nextTotal = (jTotal?.balance ?? '') as string;
      const nextConfirmed = (jConfirmed?.balance ?? '') as string;
      const nextUnconfirmed = (jUnconfirmed?.balance ?? '') as string;

      // ensure only latest request updates state
      if (callId === latestCallIdRef.current) {
        // Convert raw balances to display format (18 decimals)
        const displayTotal = nextTotal ? TracApiService.balanceToDisplay(nextTotal) : '';
        const displayConfirmed = nextConfirmed ? TracApiService.balanceToDisplay(nextConfirmed) : '';
        const displayUnconfirmed = nextUnconfirmed ? TracApiService.balanceToDisplay(nextUnconfirmed) : '';
        
        // Update Redux store with converted values
        if (address) {
          dispatch(TracBalanceActions.setBalancesIfChanged({
            address,
            total: displayTotal, // Store converted values in Redux
            confirmed: displayConfirmed,
            unconfirmed: displayUnconfirmed,
          }));
        }
      }
    } catch (e) {
      if (callId === latestCallIdRef.current) {
        setError((e as Error).message);
        // keep last values on error
      }
    } finally {
      if (callId === latestCallIdRef.current) {
        setLoading(false);
      }
    }
  }, [address]);

  useEffect(() => {
    // Revalidate when address changes
    if (address) {
      setLoading(true);
      fetchBalances().finally(() => setLoading(false));
    }
  }, [address, fetchBalances]);

  return {total, confirmed, unconfirmed, loading, error, refetch: fetchBalances};
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
