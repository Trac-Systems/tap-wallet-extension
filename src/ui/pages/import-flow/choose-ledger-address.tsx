import {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
  ADDRESS_TYPES,
  AddressType,
  Network,
  adjustDerivationPathForNetwork,
} from '@/src/wallet-instance';
import LayoutScreenImport from '../../layouts/import-export';
import {UX} from '../../component';
import {SVG} from '../../svg';
import {colors} from '../../themes/color';
import browser from 'webextension-polyfill';
import {useCustomToast} from '../../component/toast-custom';
import {useAppSelector, useAppDispatch} from '../../utils';
import {GlobalSelector} from '../../redux/reducer/global/selector';
import {deriveAddressFromPublicKey} from '@/src/background/utils';
import {Buffer} from 'buffer';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {useReloadAccounts} from '../home-flow/hook';
import {satoshisToAmount} from '@/src/shared/utils/btc-helper';
import {AccountActions} from '../../redux/reducer/account/slice';

type LedgerPathOption = {
  label: string;
  derivationPath: string;
  addressType: AddressType;
  displayIndex: number;
};

const isExpectedLedgerApp = (appName: string | undefined, network: Network) => {
  if (!appName) return false;
  const normalized = appName.toLowerCase().trim();
  if (!normalized) return false;
  if (network === Network.TESTNET) {
    return normalized.includes('bitcoin') && normalized.includes('test');
  }
  return normalized === 'bitcoin';
};

const getExpectedAppName = (network: Network): string => {
  return network === Network.TESTNET ? 'Bitcoin Test' : 'Bitcoin';
};

const ChooseLedgerAddress = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {showToast} = useCustomToast();
  const wallet = useWalletProvider();
  const reloadAccounts = useReloadAccounts();
  const networkType = useAppSelector(GlobalSelector.networkType);
  const activeNetwork =
    networkType === 'TESTNET' ? Network.TESTNET : Network.MAINNET;
  const [isCreating, setIsCreating] = useState(false);
  const options = useMemo<LedgerPathOption[]>(() => {
    const result: LedgerPathOption[] = [];
    for (const key in ADDRESS_TYPES) {
      const item = ADDRESS_TYPES[key];
      // Adjust derivation path for current network (testnet/mainnet)
      const adjustedPath = adjustDerivationPathForNetwork(item.derivationPath, activeNetwork);
      result.push({
        label: item.name,
        derivationPath: adjustedPath,
        addressType: item.value,
        displayIndex: item.displayIndex,
      });
    }
    return result.sort((a, b) => a.displayIndex - b.displayIndex);
  }, [activeNetwork]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addressMap, setAddressMap] = useState<Record<string, string>>({});
  const [pubkeyMap, setPubkeyMap] = useState<Record<string, {pubkey: string; derivationPath: string; addressType: AddressType}>>({});
  const [balanceMap, setBalanceMap] = useState<
    Record<
      string,
      {
        totalBtc: string;
        satoshis: number;
        totalInscription: number;
      }
    >
  >({});
  const [screenStep, setScreenStep] = useState<'intro' | 'loading' | 'ready'>(
    'intro',
  );
  const [ledgerStatus, setLedgerStatus] = useState<{connected: boolean; name?: string} | null>(null);
  const statusPollingRef = useRef<NodeJS.Timeout | null>(null);
  const fetchSessionRef = useRef<number>(0);
  const lastStatusRef = useRef<{connected: boolean; name?: string} | null>(null);
  const lastReconnectAttemptRef = useRef<number>(0);
  const optionKey = (option: LedgerPathOption) =>
    `${option.addressType}-${option.derivationPath}`;

  const getLedgerFormat = (type: AddressType) => {
    switch (type) {
      case AddressType.P2PKH:
        return 'legacy';
      case AddressType.P2SH_P2WPKH:
        return 'p2sh';
      case AddressType.P2TR:
      case AddressType.M44_P2TR:
        return 'bech32m';
      case AddressType.P2WPKH:
      case AddressType.M44_P2WPKH:
        return 'bech32';
      default:
        // Fallback to bech32 for unknown types
        return 'bech32';
    }
  };

  const fetchAddress = async (option: LedgerPathOption, index: number) => {
    const key = optionKey(option);

    const attemptFetch = async (retryAfterReconnect = false): Promise<void> => {
      // Derivation path is already adjusted for network in options
      const previewPath = `${option.derivationPath.replace(/\/$/, '')}/0`;
      const resp: any = await browser.runtime.sendMessage({
        type: 'LEDGER_GET_PUBLIC_KEY',
        path: previewPath,
        options: {verify: false, format: getLedgerFormat(option.addressType)},
      });
      if (!resp?.success) {
        throw new Error(resp?.error || 'Failed to fetch Ledger address');
      }
      
      let publicKeyHex: string | undefined = resp.data?.publicKeyHex;
      if (!publicKeyHex && resp.data?.publicKey) {
        const raw = resp.data.publicKey;
        let bytes: Uint8Array | null = null;
        if (raw instanceof Uint8Array) {
          bytes = raw;
        } else if (ArrayBuffer.isView(raw) || raw instanceof ArrayBuffer) {
          bytes = new Uint8Array(raw as ArrayBufferLike);
        } else if (Array.isArray(raw)) {
          bytes = Uint8Array.from(raw);
        } else if (typeof raw === 'object' && raw !== null) {
          // Structured clone of Uint8Array may come as object with numeric keys
          const values = Object.values(raw).filter(v => typeof v === 'number') as number[];
          if (values.length) {
            bytes = Uint8Array.from(values);
          }
        }
        if (bytes) {
          publicKeyHex = Buffer.from(bytes).toString('hex');
        }
      }
      if (!publicKeyHex) {
        throw new Error('Failed to derive public key from Ledger response');
      }
      const address = deriveAddressFromPublicKey(
        publicKeyHex,
        option.addressType,
        activeNetwork,
      );
      setAddressMap(prev => ({
        ...prev,
        [key]: address,
      }));
      // Save pubkey for later use when creating wallet
      setPubkeyMap(prev => ({
        ...prev,
        [key]: {
          pubkey: publicKeyHex,
          derivationPath: option.derivationPath,
          addressType: option.addressType,
        },
      }));

      // Fetch balance in the background – do NOT await here so we don't block
      // the sequential Ledger calls. Network calls can run in parallel.
      (async () => {
        try {
          const balance = await wallet.getAddressBalance(address);
          // Include both confirmed and pending satoshis for total balance
          // Use satoshi + pendingSatoshi for total (covers all cases)
          const confirmedSatoshi = balance?.satoshi || 0;
          const pendingSatoshi = balance?.pendingSatoshi || 0;
          const totalSatoshi = confirmedSatoshi + Math.max(0, pendingSatoshi);
          const btc = (totalSatoshi / 1e8).toFixed(8);
          setBalanceMap(prev => ({
            ...prev,
            [key]: {
              totalBtc: btc,
              satoshis: totalSatoshi,
              totalInscription: balance?.inscriptionUtxoCount || 0,
            },
          }));
        } catch (err) {
          // Ignore balance errors; still show the derived address.
        }
      })();
    };
    
    try {
      await attemptFetch();
    } catch (error: any) {
      const errorMsg = error?.message || String(error || '');
      
      // Check if error is transport-related (transfer cancelled, invalid sequence, etc.)
      const isTransportError = 
        errorMsg.includes('transfer was cancelled') ||
        errorMsg.includes('Invalid sequence') ||
        errorMsg.includes('transferIn') ||
        errorMsg.includes('0x6b0c') ||
        errorMsg.includes('Transport');
      
      // Try reconnect once if transport error (max once per 10 seconds)
      if (isTransportError) {
        const now = Date.now();
        if (now - lastReconnectAttemptRef.current > 10000) {
          lastReconnectAttemptRef.current = now;
          try {
            const reconnectResp: any = await browser.runtime.sendMessage({
              type: 'LEDGER_CONNECT',
              method: 'auto',
            });
            if (reconnectResp?.success && reconnectResp.deviceInfo?.name) {
              const reconnectedStatus = {
                connected: true,
                name: reconnectResp.deviceInfo.name,
              };
              lastStatusRef.current = reconnectedStatus;
              setLedgerStatus(reconnectedStatus);
              await new Promise(resolve => setTimeout(resolve, 500));
              try {
                await attemptFetch(true);
                return;
              } catch (retryError) {
                // Fall through to error handling
              }
            }
          } catch (reconnectErr) {
            // Ignore reconnect errors
          }
        }
      }
      
      // Set error state in address map
      setAddressMap(prev => ({
        ...prev,
        [key]: errorMsg.includes('0x6a80') 
          ? 'Taproot requires Ledger Bitcoin app 2.1.0+'
          : 'Failed to fetch address',
      }));
    }
  };

  useEffect(() => {
    let cancelled = false;

    const pollStatus = async () => {
      try {
        const resp: any = await browser.runtime.sendMessage({type: 'LEDGER_STATUS'});
        if (cancelled) return;
        if (resp?.success && resp.status) {
          const connected = Boolean(resp.status.connected);
          const appName = resp.status.name;
          
          const nextStatus = {connected, name: appName};
          const prevStatus = lastStatusRef.current;
          
          // Don't override a valid status (with app name) with an invalid one (undefined name)
          if (prevStatus?.name && !nextStatus.name && connected) {
            return;
          }
          
          if (
            !prevStatus ||
            prevStatus.connected !== nextStatus.connected ||
            prevStatus.name !== nextStatus.name
          ) {
            lastStatusRef.current = nextStatus;
            setLedgerStatus(nextStatus);
          }
        } else if (!lastStatusRef.current || lastStatusRef.current.connected) {
          lastStatusRef.current = {connected: false};
          setLedgerStatus({connected: false});
        }
      } catch (error) {
        if (cancelled) return;
        if (!lastStatusRef.current || lastStatusRef.current.connected) {
          lastStatusRef.current = {connected: false};
          setLedgerStatus({connected: false});
        }
      }
    };

    pollStatus();
    statusPollingRef.current = setInterval(pollStatus, 3000);

    return () => {
      cancelled = true;
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
        statusPollingRef.current = null;
      }
    };
  }, [activeNetwork]);

  useEffect(() => {
    if (!options.length) {
      setScreenStep('ready');
      return;
    }

    const status = ledgerStatus;
    const connected = Boolean(status?.connected);

    if (!status || !status.connected) {
      if (screenStep !== 'intro') {
        setScreenStep('intro');
        fetchSessionRef.current += 1;
        setAddressMap({});
      }
      return;
    }

    const isCorrectApp = isExpectedLedgerApp(status.name, activeNetwork);
    
    if (!isCorrectApp) {
      if (screenStep !== 'intro') {
        setScreenStep('intro');
        fetchSessionRef.current += 1;
        setAddressMap({});
      }
      return;
    }

    const currentSession = Date.now();
    fetchSessionRef.current = currentSession;

    const loadAddresses = async () => {
      setScreenStep('loading');
      setAddressMap({});
      setPubkeyMap({});
      setBalanceMap({});

      for (let i = 0; i < options.length; i++) {
        if (fetchSessionRef.current !== currentSession) {
          return;
        }
        try {
          await fetchAddress(options[i], i);
          if (i < options.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 80));
          }
        } catch (error) {
          // Ignore fetch errors
        }
      }
      if (fetchSessionRef.current === currentSession) {
        setScreenStep('ready');
      }
    };

    loadAddresses();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerStatus, options, activeNetwork]);

  // Auto-select Native Segwit by default, switch to address with balance if Native Segwit has no balance
  useEffect(() => {
    if (screenStep !== 'ready' || !options.length) {
      return;
    }

    // Find Native Segwit (P2WPKH) index first
    const nativeSegwitIndex = options.findIndex(
      option =>
        option.addressType === AddressType.P2WPKH ||
        option.addressType === AddressType.M44_P2WPKH,
    );

    // Default to Native Segwit
    let targetIndex = nativeSegwitIndex >= 0 ? nativeSegwitIndex : 0;

    // Check if Native Segwit has balance
    if (nativeSegwitIndex >= 0) {
      const nativeSegwitKey = optionKey(options[nativeSegwitIndex]);
      const nativeSegwitBalance = balanceMap[nativeSegwitKey];
      const hasNativeSegwitBalance =
        nativeSegwitBalance &&
        (nativeSegwitBalance.satoshis > 0 ||
          (nativeSegwitBalance.totalInscription || 0) > 0);

      // If Native Segwit has no balance, look for other addresses with balance
      if (!hasNativeSegwitBalance) {
        for (let i = 0; i < options.length; i++) {
          // Skip Native Segwit itself
          if (i === nativeSegwitIndex) {
            continue;
          }
          const key = optionKey(options[i]);
          const balanceInfo = balanceMap[key];
          if (
            balanceInfo &&
            (balanceInfo.satoshis > 0 ||
              (balanceInfo.totalInscription || 0) > 0)
          ) {
            targetIndex = i;
            break;
          }
        }
      }
    }

    setSelectedIndex(targetIndex);
  }, [screenStep, balanceMap, options]);

  const removeExistingHardwareWallets = async () => {
    try {
      const wallets = await wallet.getWallets();
      for (const existing of wallets) {
        if (existing?.type === 'Hardware Wallet') {
          await wallet.removeWallet(existing);
        }
      }
    } catch (error) {
      throw new Error('Unable to reset existing Ledger wallets. Please try again.');
    }
  };

  const handleContinue = async () => {
    if (isCreating) return;
    
    const option = options[selectedIndex];
    setIsCreating(true);
    
    try {
      const ledgerAddressType =
        option.addressType && ADDRESS_TYPES[option.addressType]
          ? option.addressType
          : AddressType.P2WPKH;
      // Derivation path is already adjusted for network in options
      const derivationPath = option.derivationPath || adjustDerivationPathForNetwork(
        ADDRESS_TYPES[ledgerAddressType]?.derivationPath || "m/84'/0'/0'/0",
        activeNetwork
      );
      
      await removeExistingHardwareWallets();

      // Collect all pubkeys to cache in hardware wallet
      const allPubkeys = Object.values(pubkeyMap).map(item => ({
        derivationPath: item.derivationPath,
        pubkey: item.pubkey,
        addressType: item.addressType,
      }));

      await wallet.createWalletFromLedger(
        derivationPath,
        ledgerAddressType,
        1,
        allPubkeys,
      );
      
      await reloadAccounts();
      
      // Fetch balance immediately for hardware wallet to avoid timing issues on first import
      try {
        const activeAccount = await wallet.getActiveAccount();
        if (activeAccount?.address) {
          const balanceData = await wallet.getAddressBalance(activeAccount.address);
          if (balanceData) {
            dispatch(
              AccountActions.setBalance({
                address: activeAccount.address,
                amount: (balanceData.satoshi || 0) + (balanceData.pendingSatoshi || 0),
                btcAmount: balanceData.btcSatoshi || 0,
                inscriptionAmount: balanceData.inscriptionUtxoCount || 0,
                pendingBtcAmount: balanceData.btcPendingSatoshi || 0,
              }),
            );
          }
        }
      } catch (e) {
        console.error('Failed to prefetch balance for hardware wallet:', e);
      }
      
      navigate('/home');
    } catch (error: any) {
      showToast({
        title: error?.message || 'Failed to create wallet from Ledger',
        type: 'error',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const renderBody = () => {
    if (screenStep === 'intro') {
      return (
        <UX.Box
          layout="column_center"
          spacing="xl"
          style={{width: '100%', minHeight: '70vh'}}>
          <SVG.BitcoinIcon width={80} height={80} />
          <UX.Text
            title={`Open the ${getExpectedAppName(activeNetwork)} app on your Ledger`}
            styleType="heading_20"
            customStyles={{textAlign: 'center', color: 'white', marginTop: '16px'}}
          />
          <UX.Text
            title="Make sure your device is unlocked."
            styleType="body_14_normal"
            customStyles={{textAlign: 'center', color: colors.gray, marginTop: '8px'}}
          />
          <UX.Text
            title="Trac Network app will be available soon via Ledger Connect"
            styleType="body_14_normal"
            customStyles={{textAlign: 'center', color: colors.gray, marginTop: '8px'}}
          />
        </UX.Box>
      );
    }

    if (screenStep === 'loading') {
      return (
        <UX.Box
          layout="column_center"
          spacing="xl"
          style={{width: '100%', minHeight: '70vh'}}>
          <div className="ripple-loader">
            <span />
            <span />
            <span />
          </div>
          <UX.Text
            title="Connecting your accounts..."
            styleType="heading_20"
            customStyles={{textAlign: 'center', color: 'white', marginTop: '16px'}}
          />
          <UX.Text
            title="Finding your accounts..."
            styleType="body_14_normal"
            customStyles={{textAlign: 'center', color: colors.gray, marginTop: '8px'}}
          />
        </UX.Box>
      );
    }

    // Ready state - render actual list
    return (
      <UX.Box spacing="xl" className="heightAddress">
        <UX.Box layout="column_center" spacing="xxl">
          <SVG.WalletIcon />
          <UX.Text
            title="Choose your Bitcoin address type"
            styleType="heading_24"
            customStyles={{textAlign: 'center', marginTop: '8px'}}
          />
          <UX.Text
            title="Trac Network app will be available soon via Ledger Connect"
            styleType="body_14_normal"
            customStyles={{
              textAlign: 'center',
              color: colors.gray,
              maxWidth: 320,
            }}
          />
          <UX.Box spacing="xs" style={{width: '100%'}}>
            {options.map((item, index) => {
              const key = optionKey(item);
              const balanceInfo = balanceMap[key];
              const hasBalanceData =
                balanceInfo &&
                (balanceInfo.satoshis > 0 ||
                  (balanceInfo.totalInscription || 0) > 0);

              return (
                <UX.CardAddress
                  key={key}
                  isActive={selectedIndex === index}
                  nameCardAddress={item.label}
                  path={`${item.derivationPath.replace(/\/$/, '')}/0`}
                  address={addressMap[key] || 'Fetching address…'}
                  hasVault={!!hasBalanceData}
                  assets={
                    hasBalanceData
                      ? {
                          totalBtc: balanceInfo?.totalBtc || '0',
                          satoshis: balanceInfo?.satoshis || 0,
                          totalInscription:
                            balanceInfo?.totalInscription || 0,
                        }
                      : undefined
                  }
                  assetUnit="BTC"
                  onClick={() => setSelectedIndex(index)}
                />
              );
            })}
          </UX.Box>
        </UX.Box>
      </UX.Box>
    );
  };

  return (
    <LayoutScreenImport
      header={<UX.TextHeader text="Connect Ledger" onBackClick={handleGoBack} />}
      body={renderBody()}
      footer={
        <UX.Box
          layout="column"
          spacing="xl"
          style={{
            padding: '10px 0',
          }}>
          <UX.Button
            styleType="primary"
            title={isCreating ? 'Creating wallet...' : 'Continue'}
            onClick={handleContinue}
            isDisable={!options.length || isCreating || screenStep !== 'ready'}
          />
        </UX.Box>
      }
    />
  );
};

export default ChooseLedgerAddress;

