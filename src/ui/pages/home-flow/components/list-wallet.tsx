import {UX} from '@/src/ui/component';
import {Loading} from '@/src/ui/component/loading-custom';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountActions} from '@/src/ui/redux/reducer/account/slice';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {WalletActions} from '@/src/ui/redux/reducer/wallet/slice';
import {spaces} from '@/src/ui/themes/space';
import {useAppDispatch, useAppSelector} from '@/src/ui/utils';
import {WalletDisplay} from '@/src/wallet-instance';
import {isEmpty} from 'lodash';
import {useCallback, useMemo, useState, useEffect} from 'react';
import 'swiper/css';
import 'swiper/css/pagination';
import {Pagination} from 'swiper/modules';
import {Swiper as Swipe, SwiperSlide as SwipeSlide} from 'swiper/react';
import './index.css';
import ModalDeleteWallet from './modal-delete-wallet';
import ModalEditWallet from './modal-edit-wallet';
import ModalListAccountWallet from './modal-list-account-wallet';
import ModalReceive from './modal-receive';
import ModalSelectToken from './modal-select-token';
import WalletCard from './wallet-card-item';
import WalletCardNew from './wallet-card-new';
import { useActiveTracAddress, useIsTracSingleWallet } from '../hook';
import {SVG} from '@/src/ui/svg';
import { debounce } from 'lodash';
import { useRef } from 'react';
import {useNavigate} from 'react-router-dom';
import {useFetchUtxosCallback, useHardwareWalletMismatch} from '@/src/ui/pages/send-receive/hook';

interface ListWalletsProps {
  networkFilters?: {bitcoin: boolean; trac: boolean};
}

const ListWallets = (props: ListWalletsProps) => {
  const {networkFilters} = props;
  const {showToast} = useCustomToast();
  //! State
  const navigate = useNavigate();
  const [openDrawerEditWallet, setOpenDrawerEditWallet] = useState(false);
  const [openModalDelete, setOpenModalDelete] = useState(false);
  const [drawerAccount, setDrawerAccount] = useState<boolean>(false);
  const [openReceive, setOpenReceive] = useState<boolean>(false);
  const [openSelectToken, setOpenSelectToken] = useState<boolean>(false);
  const listWallets = useAppSelector(WalletSelector.wallets);
  const pagination = {
    clickable: true,
  };
  const dispatch = useAppDispatch();
  const wallet = useWalletProvider();
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const fetchUtxos = useFetchUtxosCallback();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingUtxo, setIsLoadingUtxo] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if hardware wallet is mismatched
  const {isMismatched, expectedNetwork} = useHardwareWalletMismatch();
  const positionSlider = useMemo(() => {
    if (!isEmpty(listWallets) || !activeWallet.key)
      return listWallets.findIndex(wallet => wallet.key === activeWallet.key);
    return 0;
  }, [listWallets.length, activeWallet.key]);

  const isTracSingle = useIsTracSingleWallet();

  const handleFetchUtxos = useCallback(async () => {
    if (isTracSingle) {
      setIsLoadingUtxo(false);
      return;
    }
    setIsLoadingUtxo(true);
    try {
      const utxos = await fetchUtxos();
      if (utxos && Array.isArray(utxos) && utxos.length === 0) {
        retryCountRef.current = 0;
        setIsLoadingUtxo(false);
        return;
      }
      retryCountRef.current = 0;
      setIsLoadingUtxo(false);
    } catch (err) {
      console.log('retryCountRef.current', retryCountRef.current);
      if (retryCountRef.current < 10) {
        setTimeout(() => {
          retryCountRef.current += 1;
          handleFetchUtxos();
        }, 100);
      } else {
        retryCountRef.current = 0;
        setIsLoadingUtxo(false);
        console.error('Failed to fetch UTXOs after retries:', err);
      }
    }
  }, [fetchUtxos, isTracSingle]);

  const debouncedFetchUtxos = useRef(
    debounce(handleFetchUtxos, 50)
  ).current;

  useEffect(() => {
    if (!listWallets.length) return;
    if (isTracSingle) {
      setIsLoadingUtxo(false);
    } else {
      debouncedFetchUtxos();
    }
    setCurrentIndex(positionSlider ?? 0);

    return () => {
      debouncedFetchUtxos.cancel();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [listWallets, debouncedFetchUtxos, positionSlider, isTracSingle]);

  useEffect(() => {
    retryCountRef.current = 0;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [activeWallet.key]);

  // Track initial load completion
  useEffect(() => {
    if (listWallets.length > 0) {
      setIsInitialLoad(false);
    } else {
      // Set timeout to mark as loaded even if no wallets found
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 3000); // Wait 3 seconds for accounts to load
      return () => clearTimeout(timer);
    }
  }, [listWallets.length]);

  // Handle case where positionSlider is -1 but wallets exist
  useEffect(() => {
    if (!isInitialLoad && positionSlider === -1 && listWallets.length > 0 && activeWallet.key) {
      // Try to find wallet by key or set first wallet as active
      const foundWallet = listWallets.find(w => w.key === activeWallet.key);
      if (foundWallet) {
        wallet.setActiveWallet(foundWallet).then(() => {
          dispatch(WalletActions.setActiveWallet(foundWallet));
        });
      } else if (listWallets.length > 0) {
        // If activeWallet not found in list, set first wallet as active
        const firstWallet = listWallets[0];
        wallet.setActiveWallet(firstWallet).then(() => {
          dispatch(WalletActions.setActiveWallet(firstWallet));
        });
      }
    }
  }, [isInitialLoad, positionSlider, listWallets, activeWallet.key, wallet, dispatch]);
  
  const handleOpenDrawerEdit = () => setOpenDrawerEditWallet(true);
  const handleOpenDrawerAccount = () => setDrawerAccount(true);

  const handleChangeSlide = useCallback(
    async (el: any) => {
      setCurrentIndex(el.activeIndex);
      if (activeWallet.key !== listWallets[el.activeIndex].key) {
        try {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          const nextWallet = listWallets[el.activeIndex];
          await wallet.setActiveWallet(nextWallet); // Use saved account index
          dispatch(WalletActions.setActiveWallet(nextWallet));
          const _activeAccount = await wallet.getActiveAccount();
          dispatch(AccountActions.setActiveAccount(_activeAccount));
          retryCountRef.current = 0;
        } catch (error) {
          console.error('Error switching wallet:', error);
          showToast({title: `Error switching wallet: ${error.message || 'Unknown error'}`, type: 'error'});
        }
      }
    },
    [activeWallet.key, listWallets, fetchUtxos],
  );

  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const handleBulletClick = (idx: number) => {
    if (swiperInstance) {
      swiperInstance.slideTo(idx);
    }
  };

  // Auto-scroll to active wallet after reload
  useEffect(() => {
    if (swiperInstance && positionSlider >= 0 && listWallets.length > 0) {
      // Use setTimeout to ensure Swiper is fully initialized
      const timer = setTimeout(() => {
        swiperInstance.slideTo(positionSlider, 0); // 0 = no animation
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [swiperInstance, positionSlider, listWallets.length]);

  const tracAddress = useActiveTracAddress();
  const hasTrac = !!tracAddress;

  //! Render
  // Show loading only during initial load
  if (isInitialLoad && (listWallets.length === 0 || positionSlider === -1)) {
    return (
      <UX.Box
        layout="column_center"
        style={{height: '30vh', position: 'relative'}}>
        <Loading />
      </UX.Box>
    );
  }

  // If loaded but no wallets, redirect to start screen
  if (!isInitialLoad && listWallets.length === 0) {
    navigate('/', {replace: true});
    return null;
  }

  // If loaded but positionSlider is -1, show loading while fixing
  if (!isInitialLoad && positionSlider === -1 && listWallets.length > 0) {
    return (
      <UX.Box
        layout="column_center"
        style={{height: '30vh', position: 'relative'}}>
        <Loading />
      </UX.Box>
    );
  }
  return (
    <>
      <Swipe
        modules={[]}
        initialSlide={positionSlider}
        slidesPerView={1.15}
        spaceBetween={spaces.xl}
        onSlideChange={handleChangeSlide}
        centeredSlides
        onSwiper={setSwiperInstance}
      >
        {listWallets.map((wallet: WalletDisplay) => {
          return (
            <SwipeSlide key={wallet.key}>
              {isTracSingle ? (
                <WalletCardNew
                  keyring={wallet}
                  handleOpenDrawerEdit={handleOpenDrawerEdit}
                  handleOpenDrawerAccount={handleOpenDrawerAccount}
                  isLoadingUtxo={isLoadingUtxo}
                />
              ) : hasTrac && networkFilters?.bitcoin === false ? (
                <WalletCardNew
                  keyring={wallet}
                  handleOpenDrawerEdit={handleOpenDrawerEdit}
                  handleOpenDrawerAccount={handleOpenDrawerAccount}
                  isLoadingUtxo={isLoadingUtxo}
                />
              ) : (
                <WalletCard
                  keyring={wallet}
                  handleOpenDrawerEdit={handleOpenDrawerEdit}
                  handleOpenDrawerAccount={handleOpenDrawerAccount}
                  isLoadingUtxo={isLoadingUtxo}
                />
              )}
            </SwipeSlide>
          );
        })}
      </Swipe>
        <div className="groupAction">
          <div
            className="groupBox"
            role="button"
            tabIndex={0}
            onClick={() => {
              if (isMismatched) {
                showToast({
                  title: 'Please reconnect Ledger and sync network before sending.',
                  type: 'error',
                });
                return;
              }
              setOpenSelectToken(true);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (isMismatched) {
                  showToast({
                    title: 'Please reconnect Ledger and sync network before sending.',
                    type: 'error',
                  });
                  return;
                }
                setOpenSelectToken(true);
              }
            }}
            style={{
              opacity: isMismatched ? 0.8 : 1,
              cursor: isMismatched ? 'not-allowed' : 'pointer',
              pointerEvents: isMismatched ? 'none' : 'auto',
            }}
          >
            <SVG.ArrowSendIcon />
            <UX.Text
              title="Send"
              styleType="body_14_bold"
              customStyles={{color: 'white'}}
            />
          </div>
          <div
            className="groupBox"
            role="button"
            tabIndex={0}
            onClick={() => setOpenReceive(true)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                setOpenReceive(true);
              }
            }}
          >
            <SVG.ArrowReceiveIcon />
            <UX.Text
              title="Receive"
              styleType="body_14_bold"
              customStyles={{color: 'white'}}
            />
          </div>
        </div>

      <div className="custom-pagination">
        {listWallets.map((_, idx) => (
          <span
            key={idx}
            className={`custom-pagination-bullet${currentIndex === idx ? ' active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => handleBulletClick(idx)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleBulletClick(idx);
              }
            }}
          />
        ))}
      </div>
      
      <UX.DrawerCustom
        className="modal-edit-wallet"
        open={openDrawerEditWallet}
        onClose={() => setOpenDrawerEditWallet(false)}>
        <ModalEditWallet
          openModalWallet={() => setOpenModalDelete(true)}
          closeModalWallet={() => setOpenDrawerEditWallet(false)}
        />
      </UX.DrawerCustom>
      <UX.CustomModal
        isOpen={openModalDelete}
        onClose={() => setOpenModalDelete(false)}>
        <ModalDeleteWallet
          walletName={activeWallet.name ?? ''}
          handleCloseDrawerEdit={() => setOpenDrawerEditWallet(false)}
          handleCloseModal={() => setOpenModalDelete(false)}
        />
      </UX.CustomModal>
      <UX.DrawerCustom
        className="drawer-list-account"
        open={drawerAccount}
        onClose={() => setDrawerAccount(false)}>
        <ModalListAccountWallet handleClose={() => setDrawerAccount(false)} />
      </UX.DrawerCustom>
      <UX.DrawerCustom
        className="drawer-receive"
        open={openReceive}
        onClose={() => setOpenReceive(false)}>
        <ModalReceive 
          handleClose={() => setOpenReceive(false)} 
          isOpen={openReceive}
        />
      </UX.DrawerCustom>
      <UX.DrawerCustom
        className="drawer-receive"
        open={openSelectToken}
        onClose={() => setOpenSelectToken(false)}>
        <ModalSelectToken 
          handleClose={() => setOpenSelectToken(false)}
          onSelectBTC={() => {
            navigate('/home/send');
            setOpenSelectToken(false);
          }}
          onSelectTNK={() => {
            navigate('/home/send-trac');
            setOpenSelectToken(false);
          }}
        />
      </UX.DrawerCustom>
    </>
  );
};
export default ListWallets;