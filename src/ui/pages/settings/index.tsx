import {useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import {SVG} from '../../svg';
import Navbar from '../home-flow/components/navbar-navigate';
import LayoutScreenSettings from '../../layouts/settings';
import {useAppSelector} from '../../utils';
import {GlobalSelector} from '../../redux/reducer/global/selector';
import {WalletSelector} from '../../redux/reducer/wallet/selector';
import {useEffect, useMemo, useState} from 'react';
import {ADDRESS_TYPES, NETWORK_TYPES, WALLET_TYPE} from '@/src/wallet-instance';
import {AccountSelector} from '../../redux/reducer/account/selector';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {useIsTabOpen, useOpenInTab} from '../../browser';
import {useResetReduxState} from '../../hook/reset-redux-state';
import {ConnectedSite} from '@/src/background/service/permission.service';

const SettingPage = () => {
  //! State
  const navigate = useNavigate();
  const networkType = useAppSelector(GlobalSelector.networkType);
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const isTabOpen = useIsTabOpen();
  const openInTab = useOpenInTab();
  const [isExtensionInTab, setIsExtensionInTab] = useState(false);
  const [sitesConnected, setSitesConnected] = useState<ConnectedSite[]>([]);

  const getSites = async () => {
    const sites = await wallet.getConnectedSites();
    setSitesConnected(sites);
  };

  const checkIsSingleWallet = useMemo(() => {
    return activeWallet?.type?.includes('Single');
  }, [activeWallet]);
  const wallet = useWalletProvider();
  const resetReduxState = useResetReduxState();

  useMemo(async () => {
    setIsExtensionInTab(await isTabOpen());
  }, [isTabOpen]);

  useEffect(() => {
    getSites();
  }, []);

  //! Function
  const settingsFunction = useMemo(() => {
    let descAddress: string;
    const item = ADDRESS_TYPES[activeWallet.addressType];
    const hdPath = activeWallet.derivationPath || item?.derivationPath;
    if (activeWallet.type === WALLET_TYPE.SingleWallet) {
      descAddress = `${item?.name}`;
    } else {
      descAddress = `${item?.name} (${hdPath}/${activeAccount.index})`;
    }

    let showWebsiteConnected: string;

    if (sitesConnected.length > 0 && sitesConnected.length === 1) {
      showWebsiteConnected = `${sitesConnected[0].name ?? 'One website'} is connected `;
    } else if (sitesConnected.length > 1) {
      showWebsiteConnected = `${sitesConnected.length} sites are connected `;
    } else {
      showWebsiteConnected = 'Not connected';
    }

    const functions = [
      {
        title: 'Address Type',
        desc: descAddress,
        link: '/setting/choose-address',
      },
      {
        title: 'Advanced',
        desc: 'Advanced Settings',
        link: '/setting/advanced',
      },
      {
        title: 'Connected Sites',
        desc: showWebsiteConnected,
        link: '/setting/connect-site',
      },
      {
        title: 'Network',
        desc:
          networkType === NETWORK_TYPES.MAINNET.label ? 'LIVENET' : networkType,
        link: '/setting/network-type',
      },
      {
        title: 'Show recovery phrase',
        type: 'recovery',
        link: '/setting/security',
      },
      {title: 'Show private key', type: 'private', link: '/setting/security'},
    ];

    return checkIsSingleWallet
      ? functions.filter(item => item.title !== 'Show recovery phrase')
      : functions;
  }, [networkType, checkIsSingleWallet, activeWallet, sitesConnected]);

  const handleExpandView = async () => {
    if (!isExtensionInTab) {
      await openInTab();
      return;
    }
  };

  //! Render
  return (
    <LayoutScreenSettings
      header={<UX.TextHeader text="Setting" disableIconBack />}
      body={
        <UX.Box
          layout="column_center"
          spacing="xl"
          style={{margin: '0 24px 16px 24px'}}>
          <UX.Box style={{width: '100%'}} spacing="xl">
            {settingsFunction.map(item => {
              return (
                <UX.Box
                  key={item.title}
                  layout="box_border"
                  style={{cursor: 'pointer'}}
                  onClick={() => {
                    if (item.type) {
                      navigate(`${item.link}?type=${item.type}`);
                    } else navigate(item.link);
                  }}>
                  <UX.Box>
                    <UX.Text
                      title={item.title}
                      styleType="body_16_bold"
                      customStyles={{color: 'white'}}
                    />
                    {item.desc ? (
                      <UX.Text title={item.desc} styleType="body_12_normal" />
                    ) : null}
                  </UX.Box>
                  <SVG.ArrowIconRight />
                </UX.Box>
              );
            })}
            {!isExtensionInTab && (
              <UX.Button
                styleType="text"
                title="Expand View"
                onClick={handleExpandView}
              />
            )}
            <UX.Button
              styleType="text"
              title="Lock Immediately"
              onClick={async () => {
                await wallet.lockWallet();
                resetReduxState();
                navigate('/login');
              }}
            />
          </UX.Box>
        </UX.Box>
      }
      footer={<Navbar isActive="setting" />}
    />
  );
};

export default SettingPage;
