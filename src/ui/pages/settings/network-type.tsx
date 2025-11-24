import {useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import LayoutScreenSettings from '../../layouts/settings';
import Navbar from '../home-flow/components/navbar-navigate';
import {SVG} from '../../svg';
import {useAppSelector} from '../../utils';
import {GlobalSelector} from '../../redux/reducer/global/selector';
import {WalletSelector} from '../../redux/reducer/wallet/selector';
import {useCustomToast} from '../../component/toast-custom';
import {useReloadAccounts} from '../home-flow/hook';
import {Network} from '@/src/wallet-instance';
import {useChangeNetworkCallback} from './hooks';
import browser from 'webextension-polyfill';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';

const isExpectedLedgerApp = (appName: string | undefined, network: Network) => {
  if (!appName) return false;
  const normalized = appName.toLowerCase().trim();
  if (!normalized) return false;
  if (network === Network.TESTNET) {
    return normalized.includes('bitcoin') && normalized.includes('test');
  }
  return normalized === 'bitcoin';
};

const NetWorkType = () => {
  //! State
  const navigate = useNavigate();
  const networkType = useAppSelector(GlobalSelector.networkType);
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const changeNetworkType = useChangeNetworkCallback();
  const {showToast} = useCustomToast();
  const reloadAccounts = useReloadAccounts();
  const walletProvider = useWalletProvider();

  //! Function
  const handleChangeNetwork = async (network: Network) => {
    if (network === networkType) {
      return;
    }
    try {
      const wallets = await walletProvider.getWallets();
      const hardwareWallets = wallets.filter(
        wallet => wallet?.type === 'Hardware Wallet',
      );
      const isActiveHardwareWallet = activeWallet?.type === 'Hardware Wallet';
      
      // Remove all hardware wallets
      if (hardwareWallets.length > 0) {
        for (const wallet of hardwareWallets) {
          await walletProvider.removeWallet(wallet);
        }
        
        // Disconnect Ledger
        try {
          await browser.runtime.sendMessage({type: 'LEDGER_DISCONNECT'});
        } catch (error) {
          // Ignore disconnect errors
        }
      }
      
      await changeNetworkType(network);
      reloadAccounts();
      
      const remainingWallets = await walletProvider.getWallets();
      
      showToast({
        title: 'Network changed successfully',
        type: 'success',
      });
      
      // If active wallet was hardware, navigate to connect Ledger screen
      if (isActiveHardwareWallet) {
        navigate('/connect-ledger');
        return;
      }
      
      // If no wallets remain, navigate to start screen
      if (remainingWallets.length === 0) {
        navigate('/');
        return;
      }
      
      // Otherwise navigate to home
      navigate('/home');
    } catch {
      showToast({
        title: 'Something went wrong',
        type: 'error',
      });
    }
  };

  //! Render
  return (
    <LayoutScreenSettings
      header={
        <UX.Box style={{padding: '0 24px'}}>
          <UX.TextHeader
            text="NetWork Type"
            onBackClick={() => navigate('/setting')}
          />
        </UX.Box>
      }
      body={
        <UX.Box spacing="xl" style={{padding: '0 24px'}}>
          <UX.Box
            layout="box_border"
            onClick={() => handleChangeNetwork(Network.TESTNET)}>
            <UX.Text
              title="TESTNET"
              styleType="body_16_bold"
              customStyles={{color: 'white'}}
            />
            {networkType === Network.TESTNET && <SVG.CheckIcon />}
          </UX.Box>
          <UX.Box
            layout="box_border"
            onClick={() => handleChangeNetwork(Network.MAINNET)}>
            <UX.Text
              title="LIVENET"
              styleType="body_16_bold"
              customStyles={{color: 'white'}}
            />
            {networkType === Network.MAINNET && <SVG.CheckIcon />}
          </UX.Box>
        </UX.Box>
      }
      footer={<Navbar />}
    />
  );
};

export default NetWorkType;
