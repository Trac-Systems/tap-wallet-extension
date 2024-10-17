import {useEffect, useMemo, useRef, useState} from 'react';

import {UX} from '@/src/ui/component';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {SVG} from '@/src/ui/svg';
import {useAppSelector} from '@/src/ui/utils';
import {NETWORK_TYPES, WalletDisplay} from '@/src/wallet-instance';
import {useNavigate} from 'react-router-dom';
import {useAccountBalance} from '../hook';
import './index.css';
import {satoshisToAmount} from '@/src/shared/utils/btc-helper';
import { GlobalSelector } from '@/src/ui/redux/reducer/global/selector';

interface IWalletCardProps {
  keyring: WalletDisplay;
  handleOpenDrawerEdit?: () => void;
  handleOpenDrawerAccount?: () => void;
}

const WalletCard = (props: IWalletCardProps) => {
  //! State
  const {keyring, handleOpenDrawerEdit, handleOpenDrawerAccount} = props;
  const navigate = useNavigate();
    const networkType = useAppSelector(GlobalSelector.networkType);
  const ref = useRef<HTMLDivElement>(null);
  const accountBalance = useAccountBalance();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const accountName = useMemo(() => {
    return activeWallet.accounts.find(acc => acc.key === activeAccount.key)
      ?.name;
  }, [activeAccount.key, activeWallet]);

  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const checkIsSingleWallet = useMemo(() => {
    return activeWallet?.type?.includes('Single');
  }, [activeWallet]);
  const {address} = activeAccount;
  const balanceValue = useMemo(() => {
    return satoshisToAmount(Number(accountBalance.amount ?? 0));
  }, [accountBalance.amount]);

  //! Function
  const handleShowHistory = () => {
    const url = networkType === NETWORK_TYPES.MAINNET.label ? 'https://mempool.space/address/' + address:  'https://mempool.space/testnet/address/' + address;
    setMenuOpen(false);
    return window.open(url, '_blank')?.focus();
  };

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
          <div style={{position: 'relative'}} ref={ref}>
            <UX.Box
              onClick={() => setMenuOpen(true)}
              style={{cursor: 'pointer'}}>
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
          </div>
        </div>
        {checkIsSingleWallet ? null : (
          <UX.Box layout="row" spacing="xl" onClick={handleOpenDrawerAccount}>
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
        <UX.Text styleType="heading_20" title={balanceValue + ' ' + 'BTC'} />
        <div className="groupAction">
          <div className="groupBox" onClick={() => navigate('/home/send')}>
            <SVG.ArrowSendIcon />
            <UX.Text
              title="Send"
              styleType="body_14_bold"
              customStyles={{color: 'white'}}
            />
          </div>
          <div className="groupBox" onClick={() => navigate('/home/receive')}>
            <SVG.ArrowReceiveIcon />
            <UX.Text
              title="Receive"
              styleType="body_14_bold"
              customStyles={{color: 'white'}}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default WalletCard;
