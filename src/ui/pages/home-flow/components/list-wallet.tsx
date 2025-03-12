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
import {useCallback, useMemo, useState} from 'react';
import 'swiper/css';
import 'swiper/css/pagination';
import {Pagination} from 'swiper/modules';
import {Swiper as Swipe, SwiperSlide as SwipeSlide} from 'swiper/react';
import './index.css';
import ModalDeleteWallet from './modal-delete-wallet';
import ModalEditWallet from './modal-edit-wallet';
import ModalListAccountWallet from './modal-list-account-wallet';
import WalletCard from './wallet-card-item';

const ListWallets = () => {
  //! State
  const [openDrawerEditWallet, setOpenDrawerEditWallet] = useState(false);
  const [openModalDelete, setOpenModalDelete] = useState(false);
  const [drawerAccount, setDrawerAccount] = useState<boolean>(false);
  const listWallets = useAppSelector(WalletSelector.wallets);
  const pagination = {
    clickable: true,
  };
  const dispatch = useAppDispatch();
  const wallet = useWalletProvider();
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const {showToast} = useCustomToast();

  const positionSlider = useMemo(() => {
    if (!isEmpty(listWallets) || !activeWallet.key)
      return listWallets.findIndex(wallet => wallet.key === activeWallet.key);
  }, [listWallets.length, activeWallet.key]);

  //! Function
  const handleOpenDrawerEdit = () => setOpenDrawerEditWallet(true);
  const handleOpenDrawerAccount = () => setDrawerAccount(true);

  const handleChangeSlide = useCallback(
    async (el: any) => {
      if (activeWallet.key !== listWallets[el.activeIndex].key) {
        try {
          await wallet.setActiveWallet(listWallets[el.activeIndex], 0);
          dispatch(WalletActions.setActiveWallet(listWallets[el.activeIndex]));
          const _activeAccount = await wallet.getActiveAccount();
          dispatch(AccountActions.setActiveAccount(_activeAccount));
        } catch {
          showToast({title: 'Oops something go wrong!!!', type: 'error'});
        }
      }
    },
    [activeWallet.key, listWallets],
  );

  //! Render
  if (listWallets.length === 0 || positionSlider === -1) {
    return (
      <UX.Box
        layout="column_center"
        style={{height: '30vh'}}>
        <Loading />
      </UX.Box>
    );
  }
  return (
    <>
      <Swipe
        pagination={pagination}
        modules={[Pagination]}
        initialSlide={positionSlider}
        slidesPerView={1.15}
        spaceBetween={spaces.xl}
        onSlideChange={handleChangeSlide}
        centeredSlides>
        {listWallets.map((wallet: WalletDisplay) => {
          return (
            <SwipeSlide key={wallet.key}>
              <WalletCard
                keyring={wallet}
                handleOpenDrawerEdit={handleOpenDrawerEdit}
                handleOpenDrawerAccount={handleOpenDrawerAccount}
              />
            </SwipeSlide>
          );
        })}
      </Swipe>
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
    </>
  );
};
export default ListWallets;
