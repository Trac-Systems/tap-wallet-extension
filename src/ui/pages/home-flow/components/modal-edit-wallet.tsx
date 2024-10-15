import {UX} from '@/src/ui/component';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {WalletActions} from '@/src/ui/redux/reducer/wallet/slice';
import {SVG} from '@/src/ui/svg';
import {useAppDispatch, useAppSelector} from '@/src/ui/utils';
import {useEffect, useState} from 'react';

interface IModalEditWalletProps {
  openModalWallet?: () => void;
  closeModalWallet?: () => void;
}
const ModalEditWallet = (props: IModalEditWalletProps) => {
  //! State
  const {openModalWallet, closeModalWallet} = props;
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const [walletName, setWalletName] = useState(activeWallet?.name ?? '');
  const wallet = useWalletProvider();
  const dispatch = useAppDispatch();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const {address} = activeAccount;
  const {showToast} = useCustomToast();

  //! Function
  const handleSubmit = async () => {
    const newWallet = await wallet.setWalletName(
      activeWallet,
      walletName || activeWallet.name,
    );
    dispatch(WalletActions.updateWalletName(newWallet));
    closeModalWallet();
    showToast({
      title: 'Wallet name updated successfully',
      type: 'success',
    });
  };

  useEffect(() => {
    if (walletName === '') {
      setWalletName(activeWallet?.name);
    }
  }, [activeWallet?.name]);

  //! Render
  return (
    <UX.Box
      style={{
        padding: '24px 16px',
        zIndex: '1000',
      }}>
      <UX.Box
        layout="row_between"
        style={{
          padding: '8px 0',
        }}>
        <UX.Text title="Edit Wallet" styleType="body_20_extra_bold" />
        <UX.Box onClick={openModalWallet}>
          <SVG.DeleteWalletIcon />
        </UX.Box>
      </UX.Box>
      <UX.Box
        style={{
          padding: '16px',
          margin: '16px 0',
          background: 'black',
          borderRadius: '10px',
        }}
        layout="column_center"
        spacing="xl">
        <UX.Button isIcon styleType="isIcon" svgIcon={<SVG.WalletInfoIcon />} />
        <UX.Box
          style={{
            background: '#545454',
            borderRadius: '32px',
            padding: '8px 16px',
          }}>
          <UX.AddressBar address={address} />
        </UX.Box>
        <UX.MaxLengthInput
          placeholder="Name wallet"
          value={walletName}
          onChange={e => setWalletName(e.target.value)}
        />
      </UX.Box>
      <UX.Button
        isDisable={walletName.length === 0}
        title="Save Change"
        styleType="primary"
        onClick={handleSubmit}
      />
    </UX.Box>
  );
};

export default ModalEditWallet;
