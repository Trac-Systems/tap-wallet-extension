import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {
  formatNumberValue,
  satoshisToAmount,
} from '@/src/shared/utils/btc-helper';
import {UX} from '@/src/ui/component';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {SVG} from '@/src/ui/svg';
import {useAppSelector} from '@/src/ui/utils';
import {NETWORK_TYPES, WalletDisplay} from '@/src/wallet-instance';
import {useNavigate} from 'react-router-dom';
import {useAccountBalance} from '../hook';
import './index.css';
import {debounce} from 'lodash';
import {useSafeBalance} from '@/src/ui/pages/send-receive/hook';

interface IWalletCardProps {
  keyring: WalletDisplay;
  handleOpenDrawerEdit?: () => void;
  handleOpenDrawerAccount?: () => void;
}

const WalletCard = (props: IWalletCardProps) => {
  //! State
  const {keyring, handleOpenDrawerEdit, handleOpenDrawerAccount} = props;
  const navigate = useNavigate();
  const wallet = useWalletProvider();
  const networkType = useAppSelector(GlobalSelector.networkType);
  const ref = useRef<HTMLDivElement>(null);
  const accountBalance = useAccountBalance();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const accountName = useMemo(() => {
    return activeWallet.accounts.find(acc => acc.key === activeAccount.key)
      ?.name;
  }, [activeAccount.key, activeWallet]);
  const [usdPrice, setUsdPrice] = useState(0);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const safeBalance = useSafeBalance();

  const [usdAvailable, setUsdAvailable] = useState(0);


  const checkIsSingleWallet = useMemo(() => {
    return activeWallet?.type?.includes('Single');
  }, [activeWallet]);

  const {address} = activeAccount;
  const isActive = keyring.key === activeWallet.key;

  const balanceValue = useMemo(() => {
    return satoshisToAmount(Number(accountBalance.amount ?? 0));
  }, [accountBalance.amount]);

  //! Function
  const handleShowHistory = () => {
    const url =
      networkType === NETWORK_TYPES.MAINNET.label
        ? 'https://mempool.space/address/' + address
        : 'https://mempool.space/testnet/address/' + address;
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
    if (!isActive) return;
    wallet.getUSDPrice(Number(safeBalance)).then(setUsdAvailable);
  }, [safeBalance, isActive]);

  
  //! Render
  return (
    <>
      <div className="cardSliderContainer">
        <div className="cardSlider">
          <UX.Text
            styleType="body_14_normal"
            title={keyring?.name ?? 'Error'}
            className="nameHdWallet"
          />
          <UX.Box ref={ref}>
            <UX.Box
              onClick={() => setMenuOpen(true)}
              style={{cursor: 'pointer', position: 'relative'}}>
              <SVG.DotIcon />
            </UX.Box>
            {menuOpen && (
              <div className="containerOption">
                <UX.Text
                  onClick={handleShowHistory}
                  styleType="body_14_bold"
                  customStyles={{cursor: 'pointer', color: 'white'}}
                  title="View History"
                />
                <UX.Text
                  onClick={() => {
                    setMenuOpen(false);
                    handleOpenDrawerEdit?.();
                  }}
                  styleType="body_14_bold"
                  customStyles={{cursor: 'pointer', color: 'white'}}
                  title="Edit Wallet"
                />
              </div>
            )}
          </UX.Box>
        </div>
        <div>
        {checkIsSingleWallet ? null : (
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
            <UX.Box layout="row" spacing="xss_s">
              <>
                <UX.Tooltip text={`${safeBalance}`} isText  >
                  <UX.Text
                    styleType="body_14_normal"
                    title={`${safeBalance}`}
                    className="textBalance"
                    customStyles={{color: 'white'}} 
                  />
                </UX.Tooltip>
                <UX.Text styleType="body_14_normal" title={'BTC'} customStyles={{color: 'white'}} />
              </>
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
          </UX.Box>
        </UX.Box>
      </div>

    </>
  );
};

export default WalletCard;
