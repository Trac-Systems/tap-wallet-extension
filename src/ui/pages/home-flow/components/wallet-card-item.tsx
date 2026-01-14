import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {
  formatNumberValue,
  satoshisToAmount,
} from '@/src/shared/utils/btc-helper';
import {UX} from '@/src/ui/component';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {AccountActions} from '@/src/ui/redux/reducer/account/slice';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {WalletActions} from '@/src/ui/redux/reducer/wallet/slice';
import {SVG} from '@/src/ui/svg';
import {useAppSelector, useAppDispatch} from '@/src/ui/utils';
import {NETWORK_TYPES, Network, WalletDisplay} from '@/src/wallet-instance';
import {useNavigate} from 'react-router-dom';
import {useAccountBalance, useActiveTracAddress} from '../hook';
import './index.css';
import {debounce} from 'lodash';
import {useSafeBalance, useHardwareWalletMismatch} from '@/src/ui/pages/send-receive/hook';
import {getTracExplorerUrl} from '../../../../background/constants/trac-api';

interface IWalletCardProps {
  keyring: WalletDisplay;
  handleOpenDrawerEdit?: () => void;
  handleOpenDrawerAccount?: () => void;
  isLoadingUtxo?: boolean;
}

const WalletCard = (props: IWalletCardProps) => {
  //! State
  const {keyring, handleOpenDrawerEdit, handleOpenDrawerAccount, isLoadingUtxo} = props;
  const navigate = useNavigate();
  const wallet = useWalletProvider();
  const dispatch = useAppDispatch();
  const networkType = useAppSelector(GlobalSelector.networkType);
  const ref = useRef<HTMLDivElement>(null);
  const accountBalance = useAccountBalance();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const {isMismatched: cardMismatched, expectedNetwork} = useHardwareWalletMismatch();
  const showOverlay = cardMismatched && keyring.key === activeWallet.key;
  const accountName = useMemo(() => {
    return activeWallet.accounts.find(acc => acc.key === activeAccount.key)
      ?.name;
  }, [activeAccount.key, activeWallet]);
  const [usdPrice, setUsdPrice] = useState(0);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const safeBalance = useSafeBalance();

  const [usdAvailable, setUsdAvailable] = useState(0);
  const [isLoadingUsd, setIsLoadingUsd] = useState(false);

  const checkIsSingleWallet = useMemo(() => {
    return activeWallet?.type?.includes('Single');
  }, [activeWallet]);

  const isHardwareWallet = useMemo(() => {
    return keyring?.type === 'Hardware Wallet';
  }, [keyring?.type]);

  const {address} = activeAccount;
  const tracAddress = useActiveTracAddress();
  const isActive = keyring.key === activeWallet.key;

  const balanceValue = useMemo(() => {
    return satoshisToAmount(Number(accountBalance.amount ?? 0));
  }, [accountBalance.amount]);

  //! Function
  const handleShowHistoryBTC = () => {
    const url =
      networkType === NETWORK_TYPES.MAINNET.label
        ? 'https://mempool.space/address/' + address
        : 'https://mempool.space/testnet/address/' + address;
    setMenuOpen(false);
    return window.open(url, '_blank')?.focus();
  };

  const handleShowHistoryTRAC = () => {
    const currentNetwork = networkType === NETWORK_TYPES.MAINNET.label ? Network.MAINNET : Network.TESTNET;
    const url = `${getTracExplorerUrl(currentNetwork)}/address/${tracAddress}`;
    setMenuOpen(false);
    return window.open(url, '_blank')?.focus();
  };

  const debouncedFetchDataUSD = useCallback(
    debounce(async (balanceValue, setUsdPrice) => {
      const response = await wallet.getUSDPrice(Number(balanceValue));
      setUsdPrice(response);
    }, 200),
    [],
  );

  useEffect(() => {
    if (!isActive) return;
    debouncedFetchDataUSD(balanceValue, setUsdPrice);
  }, [balanceValue, debouncedFetchDataUSD, isActive]);

  useEffect(() => {
    return () => {
      debouncedFetchDataUSD.cancel();
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node) &&
        menuOpen
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    let cancelled = false;
    if (!isActive) {
      setIsLoadingUsd(false);
      setUsdAvailable(0);
      return;
    }
    if (!safeBalance || Number(safeBalance) === 0) {
      setUsdAvailable(0);
      setIsLoadingUsd(false);
      return;
    }
    setIsLoadingUsd(true);
    wallet.getUSDPrice(Number(safeBalance))
      .then(val => {
        if (!cancelled) {
          setUsdAvailable(val);
        } 
      })
      .catch((error) => {
        if (!cancelled) {
          setUsdAvailable(0);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingUsd(false);
        }
      });
      
    return () => { 
      cancelled = true; 
    };
  }, [safeBalance, isActive]);

  
  //! Render
  return (
    <>
        <div className="cardSliderContainer" style={{position: 'relative'}}>
          {showOverlay && (
            <UX.Box
              layout="column_center"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(138, 47, 61, 0.3)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                zIndex: 6,
                borderRadius: 16,
                textAlign: 'center',
                padding: '0 16px',
              }}>
              <UX.Text
                styleType="body_16_bold"
                customStyles={{color: 'white'}}
              title={`Wallet only available on ${
                expectedNetwork === Network.TESTNET ? 'testnet' : 'mainnet'
              }`}
              />
            </UX.Box>
          )}
          <div className="cardSlider">
            <UX.Box layout="row_between" style={{width: '100%', alignItems: 'center'}}>
              <UX.Box layout="row" spacing="xs" style={{alignItems: 'center'}}>
                <UX.Text
                  styleType="body_14_normal"
                  title={keyring?.name ?? 'Error'}
                  className="nameHdWallet"
                />
              </UX.Box>
              <UX.Box ref={ref}>
                <UX.Box
                  onClick={() => setMenuOpen(true)}
                  style={{cursor: 'pointer', position: 'relative'}}>
                  <SVG.DotIcon />
                </UX.Box>
                {menuOpen && (
                  <div className="containerOption">
                    <UX.Text
                      onClick={handleShowHistoryBTC}
                      styleType="body_14_bold"
                      customStyles={{cursor: 'pointer', color: 'white'}}
                      title="View BTC History"
                    />
                    <UX.Text
                      onClick={handleShowHistoryTRAC}
                      styleType="body_14_bold"
                      customStyles={{cursor: 'pointer', color: 'white'}}
                      title="View TRAC History"
                    />
                    <UX.Text
                      onClick={async () => {
                        setMenuOpen(false);
                        // Set active wallet if this card is not already active
                        if (keyring.key !== activeWallet.key) {
                          await wallet.setActiveWallet(keyring);
                          dispatch(WalletActions.setActiveWallet(keyring));
                          const _activeAccount = await wallet.getActiveAccount();
                          dispatch(AccountActions.setActiveAccount(_activeAccount));
                        }
                        handleOpenDrawerEdit?.();
                      }}
                      styleType="body_14_bold"
                      customStyles={{cursor: 'pointer', color: 'white'}}
                      title="Edit Wallet"
                    />
                  </div>
                )}
              </UX.Box>
            </UX.Box>
        </div>
        <div>
        {checkIsSingleWallet ? (
          <UX.Box style={{height: '28px', marginBottom: 4}} />
        ) : (
          <UX.Box
            layout="row"
            spacing="xl"
            onClick={handleOpenDrawerAccount}
            style={{cursor: 'pointer', marginBottom: 4}}>
            <UX.Text
              styleType="heading_16"
              customStyles={{
                color: 'white',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
              title={accountName ?? ''}
            />
            <UX.Box style={{width: '30px'}}>
              <SVG.ArrowDownIcon />
            </UX.Box>
          </UX.Box>
        )}

        <UX.AddressBar address={address} />
        </div>
        <UX.Box layout="row_between">
          <UX.Box layout="row" spacing="xss_s">
            <UX.Tooltip text={balanceValue} isText>
              <UX.Text
                styleType="heading_20"
                title={Number(balanceValue).toFixed(8)}
                className="textBalance"
                customStyles={{lineHeight: '32px', fontSize: 24}}
              />
            </UX.Tooltip>
            <UX.Text styleType="heading_20" customStyles={{lineHeight: '32px', fontSize: 24}} title={'BTC'} />
          </UX.Box>
          <UX.Box layout="row" spacing="xss_s">
            <UX.Text title="≈" styleType="body_16_normal" />
            <UX.Tooltip text={formatNumberValue(String(usdPrice))} isText>
              <UX.Text
                title={`${formatNumberValue(String(usdPrice))}`}
                styleType="body_16_normal"
                className="textBalance"
              />
            </UX.Tooltip>
            <UX.Text title="USD" styleType="body_16_normal" />
          </UX.Box>
        </UX.Box>
        <UX.Box>
          <UX.Text styleType="body_12_normal" title="Available balance:"  />
          <UX.Box layout="row_between">
            {isLoadingUtxo || isLoadingUsd ? (
              <UX.Box layout="row_center" style={{ width: '100%'}}>
                <SVG.LoadingIcon />
              </UX.Box>
            ) : (
              <>
                <UX.Box layout="row" spacing="xss_s">
                  <UX.Tooltip text={`${safeBalance}`} isText>
                    <UX.Text
                      styleType="body_14_normal"
                      title={`${safeBalance}`}
                      className="textBalance"
                      customStyles={{ color: 'white' }}
                    />
                  </UX.Tooltip>
                  <UX.Text styleType="body_14_normal" title={'BTC'} customStyles={{ color: 'white' }} />
                </UX.Box>
                <UX.Box layout="row" spacing="xss_s">
                  <UX.Text title="≈" styleType="body_16_normal" />
                  <UX.Tooltip text={`${usdAvailable}`} isText>
                    <UX.Text
                      title={`${usdAvailable}`}
                      styleType="body_16_normal"
                      className="textBalance"
                    />
                  </UX.Tooltip>
                  <UX.Text title="USD" styleType="body_16_normal" />
                </UX.Box>
              </>
            )}
          </UX.Box>
        </UX.Box>
      </div>

    </>
  );
};

export default WalletCard;