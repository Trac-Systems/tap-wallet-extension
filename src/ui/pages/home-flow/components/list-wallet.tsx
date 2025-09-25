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
import WalletCard from './wallet-card-item';
import {useFetchUtxosCallback} from '@/src/ui/pages/send-receive/hook';
import {useNavigate} from 'react-router-dom';
import {SVG} from '@/src/ui/svg';
import { debounce } from 'lodash';
import { useRef } from 'react';

const ListWallets = () => {
  //! State
  const navigate = useNavigate();
  const [openDrawerEditWallet, setOpenDrawerEditWallet] = useState(false);
  const [openModalDelete, setOpenModalDelete] = useState(false);
  const [drawerAccount, setDrawerAccount] = useState<boolean>(false);
  const [openReceive, setOpenReceive] = useState<boolean>(false);
  const listWallets = useAppSelector(WalletSelector.wallets);
  const pagination = {
    clickable: true,
  };
  const dispatch = useAppDispatch();
  const wallet = useWalletProvider();
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const {showToast} = useCustomToast();
  const fetchUtxos = useFetchUtxosCallback();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingUtxo, setIsLoadingUtxo] = useState(true);
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const positionSlider = useMemo(() => {
    if (!isEmpty(listWallets) || !activeWallet.key)
      return listWallets.findIndex(wallet => wallet.key === activeWallet.key);
    return 0;
  }, [listWallets.length, activeWallet.key]);

  const handleFetchUtxos = useCallback(async () => {
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
  }, [fetchUtxos]);

  const debouncedFetchUtxos = useRef(
    debounce(handleFetchUtxos, 50)
  ).current;

  useEffect(() => {
    if (!listWallets.length) return;
    debouncedFetchUtxos();
    setCurrentIndex(positionSlider ?? 0);

    return () => {
      debouncedFetchUtxos.cancel();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [listWallets, debouncedFetchUtxos, positionSlider]);

  useEffect(() => {
    // Debug log for listWallets
    // eslint-disable-next-line no-console
    console.log('listWallets =>', listWallets);
  }, [listWallets]);
 
  useEffect(() => {
    retryCountRef.current = 0;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [activeWallet.key]);
  
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
          await wallet.setActiveWallet(listWallets[el.activeIndex], 0);
          dispatch(WalletActions.setActiveWallet(listWallets[el.activeIndex]));
          const _activeAccount = await wallet.getActiveAccount();
          dispatch(AccountActions.setActiveAccount(_activeAccount));
          retryCountRef.current = 0;
        } catch {
          showToast({title: 'Oops something go wrong!!!', type: 'error'});
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

  //! Render
  if (listWallets.length === 0 || positionSlider === -1) {
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
              <WalletCard
                keyring={wallet}
                handleOpenDrawerEdit={handleOpenDrawerEdit}
                handleOpenDrawerAccount={handleOpenDrawerAccount}
                isLoadingUtxo={isLoadingUtxo}
              />
            </SwipeSlide>
          );
        })}
      </Swipe>
        <div className="groupAction">
          <div
            className="groupBox"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/home/send')}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate('/home/send');
              }
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
        <ModalReceive handleClose={() => setOpenReceive(false)} />
      </UX.DrawerCustom>
    </>
  );
};
export default ListWallets;