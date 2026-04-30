import {useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import LayoutScreenSettings from '../../layouts/settings';
import Navbar from '../home-flow/components/navbar-navigate';
import {SVG} from '../../svg';
import {useAppSelector} from '../../utils';
import {GlobalSelector} from '../../redux/reducer/global/selector';
import {useReloadAccounts, useIsTracSingleWallet} from '../home-flow/hook';
import {Network} from '@/src/wallet-instance';
import {useChangeNetworkCallback} from './hooks';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {useI18n, useTranslatedToast} from '../../i18n';

const NetWorkType = () => {
  //! State
  const navigate = useNavigate();
  const networkType = useAppSelector(GlobalSelector.networkType);
  const changeNetworkType = useChangeNetworkCallback();
  const {showTranslatedToast} = useTranslatedToast();
  const reloadAccounts = useReloadAccounts();
  const walletProvider = useWalletProvider();
  const isTracSingleWallet = useIsTracSingleWallet();
  const {t} = useI18n();

  //! Function
  const handleChangeNetwork = async (network: Network) => {
    if (network === networkType) {
      return;
    }
    try {
      await changeNetworkType(network);
      reloadAccounts();

      const remainingWallets = await walletProvider.getWallets();

      showTranslatedToast({
        titleKey: 'settings.network.changedSuccessfully',
        type: 'success',
      });

      // If no wallets remain, navigate to start screen
      if (remainingWallets.length === 0) {
        navigate('/');
        return;
      }

      // Otherwise navigate to home
      navigate('/home');
    } catch {
      showTranslatedToast({
        titleKey: 'common.somethingWentWrong',
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
            text={t('settings.network.typeTitle')}
            onBackClick={() => navigate('/setting')}
          />
        </UX.Box>
      }
      body={
        <UX.Box spacing="xl" style={{padding: '0 24px'}}>
          <UX.Box
            layout="box_border"
            onClick={() => !isTracSingleWallet && handleChangeNetwork(Network.TESTNET)}
            style={isTracSingleWallet && networkType !== Network.TESTNET ? {opacity: 0.4, cursor: 'not-allowed'} : {}}>
            <UX.Text
              title={Network.TESTNET}
              styleType="body_16_bold"
              customStyles={{color: 'white'}}
            />
            {networkType === Network.TESTNET && <SVG.CheckIcon />}
          </UX.Box>
          <UX.Box
            layout="box_border"
            onClick={() => !isTracSingleWallet && handleChangeNetwork(Network.MAINNET)}
            style={isTracSingleWallet && networkType !== Network.MAINNET ? {opacity: 0.4, cursor: 'not-allowed'} : {}}>
            <UX.Text
              title={Network.MAINNET}
              styleType="body_16_bold"
              customStyles={{color: 'white'}}
            />
            {networkType === Network.MAINNET && <SVG.CheckIcon />}
          </UX.Box>
          {isTracSingleWallet && (
            <UX.Text
              title={t('settings.network.tracOnlyDisabled')}
              styleType="body_12_normal"
              customStyles={{color: '#888', textAlign: 'center'}}
            />
          )}
        </UX.Box>
      }
      footer={<Navbar />}
    />
  );
};

export default NetWorkType;
