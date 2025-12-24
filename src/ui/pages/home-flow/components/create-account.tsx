import {UX} from '@/src/ui/component';
import {useCustomToast} from '@/src/ui/component/toast-custom';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {AccountActions} from '@/src/ui/redux/reducer/account/slice';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {WalletActions} from '@/src/ui/redux/reducer/wallet/slice';
import {useAppDispatch, useAppSelector} from '@/src/ui/utils';
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {TracApiService} from '@/src/background/service/trac-api.service';

const CreateAccount = () => {
  //! State
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {showToast} = useCustomToast();
  const wallet = useWalletProvider();
  const [newAccountName, setNewAccountName] = useState<string>('');
  const [defaultName, setDefaultName] = useState<string>('');
  const activeWallet = useAppSelector(WalletSelector.activeWallet);

  const init = async () => {
    const accountName = await wallet.getNextAccountName(activeWallet);
    setDefaultName(accountName);
  };

  //! Function
  const handleGoBack = () => {
    navigate('/home');
  };

  const generateTracAddressForNewAccount = async (
    walletIndex: number, 
    accountIndex: number, 
    mnemonic: string
  ) => {
    try {
      const result = await TracApiService.generateKeypairFromMnemonic(mnemonic, accountIndex);
      if (result?.address) {
        wallet.setTracAddress(walletIndex, accountIndex, result.address);
      }
    } catch (error) {
      console.error('Error generating TRAC address:', error);
    }
  };

  const handleSubmit = async () => {
    await wallet.createNewAccountFromMnemonic(
      activeWallet,
      newAccountName || defaultName,
    );
    
    const activeAccount = await wallet.getActiveAccount();
    const _activeWallet = await wallet.getActiveWallet();
    
    // Generate TRAC address for new account
    try {
      const walletInfo = await wallet.getMnemonicsUnlocked(activeWallet);
      const mnemonic = walletInfo.mnemonic;
      
      if (mnemonic && activeAccount) {
        await generateTracAddressForNewAccount(
          activeWallet.index,
          activeAccount.index || 0,
          mnemonic
        );
      }
    } catch (error) {
      console.log('Could not generate TRAC address:', error);
    }
    
    dispatch(WalletActions.setActiveWallet(_activeWallet));
    dispatch(AccountActions.setActiveAccount(activeAccount));
    showToast({
      title: 'Create account successfully',
      type: 'success',
    });
    navigate('/home');
  };

  useEffect(() => {
    init();
  }, []);

  //! Render
  return (
    <LayoutSendReceive
      header={
        <UX.TextHeader text="Create account" onBackClick={handleGoBack} />
      }
      body={
        <UX.Box style={{width: '100%'}}>
          <UX.Input
            value={newAccountName}
            placeholder={defaultName}
            onChange={e => setNewAccountName(e.target.value)}
          />
        </UX.Box>
      }
      footer={
        <UX.Box
          layout="column"
          spacing="xl"
          style={{
            padding: '10px 0',
          }}>
          <UX.Button
            styleType="primary"
            title="Create a account"
            onClick={handleSubmit}
          />
        </UX.Box>
      }
    />
  );
};

export default CreateAccount;
