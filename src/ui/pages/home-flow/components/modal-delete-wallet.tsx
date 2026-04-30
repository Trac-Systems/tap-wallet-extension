import {UX} from '@/src/ui/component';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountActions} from '@/src/ui/redux/reducer/account/slice';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {WalletActions} from '@/src/ui/redux/reducer/wallet/slice';
import {SVG} from '@/src/ui/svg';
import {useAppDispatch, useAppSelector} from '@/src/ui/utils';

interface IModalDeleteWalletProps {
  handleCloseModal?: () => void;
  handleCloseDrawerEdit?: () => void;
  walletName?: string;
}
const ModalDeleteWallet = (props: IModalDeleteWalletProps) => {
  //! State
  const {handleCloseModal, handleCloseDrawerEdit, walletName} = props;
  const wallet = useWalletProvider();
  const dispatch = useAppDispatch();
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const {showToast} = useCustomToast();

  //! Function
  const handleDeleteWallet = async () => {
    const wallets = await wallet.getWallets();
    if (wallets.length === 1) {
      showToast({
        titleKey: 'wallet.cannotRemoveLast',
        type: 'error',
      });
      handleCloseModal();
      return;
    }
    try {
      const nextWallet = await wallet.removeWallet(activeWallet);
      const wallets = await wallet.getWallets();
      dispatch(WalletActions.setListWallet(wallets));

      if (nextWallet) {
        dispatch(AccountActions.setActiveAccount(nextWallet.accounts[0]));
      } else if (wallets[0]) {
        dispatch(WalletActions.setActiveWallet(wallets[0]));
      }
      handleCloseDrawerEdit();
      showToast({
        titleKey: 'wallet.deletedSuccessfully',
        type: 'success',
      });
    } catch {
      showToast({
        titleKey: 'wallet.deleteFailed',
        type: 'error',
      });
    } finally {
      handleCloseModal();
    }
  };

  //! Render
  return (
    <UX.Box layout="column_center" spacing="xl">
      <UX.Text titleKey="wallet.remove" styleType="body_20_extra_bold" />
      <UX.Button
        styleType="isIcon"
        isIcon
        svgIcon={<SVG.DeleteWalletIcon width={24} height={24} color="white" />}
      />
      <UX.Text
        titleKey="wallet.removeConfirm"
        titleParams={{walletName}}
        styleType="body_16_normal"
        customStyles={{textAlign: 'center'}}
      />
      <UX.Box layout="row_between" spacing="xl" style={{width: '100%'}}>
        <UX.Button
          styleType="dark"
          titleKey="common.cancel"
          customStyles={{width: '100%'}}
          onClick={handleCloseModal}
        />
        <UX.Button
          styleType="primary"
          titleKey="common.remove"
          customStyles={{width: '100%'}}
          onClick={handleDeleteWallet}
        />
      </UX.Box>
    </UX.Box>
  );
};

export default ModalDeleteWallet;
