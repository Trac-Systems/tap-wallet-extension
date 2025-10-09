import {useMemo, useRef, useState} from 'react';
import {UX} from '@/src/ui/component';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {SVG} from '@/src/ui/svg';
import {useAppSelector} from '@/src/ui/utils';
import {WalletDisplay} from '@/src/wallet-instance';
import './index.css';
import {useActiveTracAddress, useTracBalances} from '../hook';

interface IWalletCardNewProps {
  keyring: WalletDisplay;
  handleOpenDrawerEdit?: () => void;
  handleOpenDrawerAccount?: () => void;
  isLoadingUtxo?: boolean;
}

const WalletCardNew = (props: IWalletCardNewProps) => {
  //! State
  const {keyring, handleOpenDrawerEdit, handleOpenDrawerAccount, isLoadingUtxo} = props;
  const ref = useRef<HTMLDivElement>(null);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const accountName = useMemo(() => {
    return activeWallet.accounts.find(acc => acc.key === activeAccount.key)?.name;
  }, [activeAccount.key, activeWallet]);

  // All wallets are TRAC wallets per latest requirement

  const {address} = activeAccount;
  const isActive = keyring.key === activeWallet.key;

  // TRAC balances
  const tracAddress = useActiveTracAddress();
  const {total: tracTotal, confirmed: tracConfirmed} = useTracBalances(
    tracAddress,
  );

  const formatMax8 = (val?: string) => {
    const s = String(val || '0');
    if (s.length <= 8) return s;
    return s.slice(0, 8) + '...';
  };

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
                  onClick={() => setMenuOpen(false)}
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
        {activeWallet?.type?.includes('Single') ? 
        <UX.Box style={{height: '32px'}}/>
        : (
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

        {/* <UX.AddressBar address={address} /> */}
        </div>
        <UX.Box layout="row_between">
          <UX.Box layout="row" spacing="xss_s">
            <UX.Tooltip text={tracTotal} isText>
              <UX.Text
                styleType="heading_20"
                title={formatMax8(tracTotal)}
                className="textBalance"
                customStyles={{lineHeight: '32px', fontSize: 24}}
              />
            </UX.Tooltip>
            <UX.Text styleType="heading_20" customStyles={{lineHeight: '32px', fontSize: 24}} title={'NTK'} />
          </UX.Box>
        </UX.Box>

        {/* Confirmed balance section (replace Available balance, hide USD) */}
        <UX.Box>
          <UX.Text styleType="body_12_normal" title="Confirmed balance:"  />
          <UX.Box layout="row_between">
            {isLoadingUtxo ? (
              <UX.Box layout="row_center" style={{ width: '100%'}}>
                <SVG.LoadingIcon />
              </UX.Box>
            ) : (
              <>
                <UX.Box layout="row" spacing="xss_s">
                  <UX.Tooltip text={tracConfirmed} isText>
                    <UX.Text
                      styleType="body_14_normal"
                      title={formatMax8(tracConfirmed)}
                      className="textBalance"
                      customStyles={{ color: 'white' }}
                    />
                  </UX.Tooltip>
                  <UX.Text styleType="body_14_normal" title={'NTK'} customStyles={{ color: 'white' }} />
                </UX.Box>
              </>
            )}
          </UX.Box>
        </UX.Box>
      </div>

    </>
  );
};

export default WalletCardNew;