import {useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import {SVG} from '../../svg';
import Navbar from '../home-flow/components/navbar-navigate';
import LayoutScreenSettings from '../../layouts/settings';
import {
  getCurrentExtensionVersion,
  getStoredExtensionUpdateVersion,
  requestExtensionUpdateCheck,
  useAppDispatch,
  useAppSelector,
} from '../../utils';
import {GlobalSelector} from '../../redux/reducer/global/selector';
import {GlobalActions} from '../../redux/reducer/global/slice';
import {WalletSelector} from '../../redux/reducer/wallet/selector';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {ADDRESS_TYPES, Network, NETWORK_TYPES, WALLET_TYPE} from '@/src/wallet-instance';
import {AccountSelector} from '../../redux/reducer/account/selector';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {useIsTabOpen, useOpenInTab} from '../../browser';
import {useResetReduxState} from '../../hook/reset-redux-state';
import {ConnectedSite} from '@/src/background/service/permission.service';
import {useIsTracSingleWallet} from '../home-flow/hook';
import {useI18n, useTranslatedToast} from '../../i18n';

const SettingPage = () => {
  type SettingsItem = {
    id: string;
    title: string;
    desc?: string;
    link?: string;
    type?: string;
    onClick?: () => void | Promise<void>;
    loading?: boolean;
  };

  //! State
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {showTranslatedToast} = useTranslatedToast();
  const networkType = useAppSelector(GlobalSelector.networkType);
  const hasExtensionUpdate = useAppSelector(GlobalSelector.hasExtensionUpdate);
  const extensionUpdateVersion = useAppSelector(
    GlobalSelector.extensionUpdateVersion,
  );
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const currentAuthority = useAppSelector(AccountSelector.currentAuthority);
  const isTabOpen = useIsTabOpen();
  const openInTab = useOpenInTab();
  const [isExtensionInTab, setIsExtensionInTab] = useState(false);
  const [sitesConnected, setSitesConnected] = useState<ConnectedSite[]>([]);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const currentExtensionVersion = getCurrentExtensionVersion();
  const {language, languageLabels, t, tp} = useI18n();

  const getSites = async () => {
    const sites = await wallet.getConnectedSites();
    setSitesConnected(sites);
  };

  const checkIsSingleWallet = useMemo(() => {
    return activeWallet?.type?.includes('Single');
  }, [activeWallet]);
  const wallet = useWalletProvider();
  const resetReduxState = useResetReduxState();
  const isTracSingleWallet = useIsTracSingleWallet();

  useEffect(() => {
    const syncExtensionTabState = async () => {
      setIsExtensionInTab(await isTabOpen());
    };

    syncExtensionTabState();
  }, [isTabOpen]);

  useEffect(() => {
    getSites();
  }, []);

  const handleCheckForUpdates = useCallback(async () => {
    if (isCheckingUpdate) {
      return;
    }

    setIsCheckingUpdate(true);

    try {
      const storedVersion = await getStoredExtensionUpdateVersion();
      if (storedVersion) {
        dispatch(
          GlobalActions.update({
            hasExtensionUpdate: true,
            extensionUpdateVersion: storedVersion,
          }),
        );
        return;
      }

      const {status, version} = await requestExtensionUpdateCheck();
      if (status === 'update_available' && version) {
        dispatch(
          GlobalActions.update({
            hasExtensionUpdate: true,
            extensionUpdateVersion: version,
          }),
        );
        return;
      }

      showTranslatedToast({
        type: 'success',
        titleKey: 'settings.appVersion.latest',
      });
    } catch (error) {
      showTranslatedToast({
        type: 'error',
        titleKey: 'settings.appVersion.unableToCheck',
      });
    } finally {
      setIsCheckingUpdate(false);
    }
  }, [dispatch, isCheckingUpdate, showTranslatedToast]);

  //! Function
  const settingsFunction = useMemo<SettingsItem[]>(() => {
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
      showWebsiteConnected = tp('settings.connectedSites.connected', 1, {
        name: sitesConnected[0].name ?? t('settings.connectedSites.oneWebsite'),
      });
    } else if (sitesConnected.length > 1) {
      showWebsiteConnected = tp(
        'settings.connectedSites.connected',
        sitesConnected.length,
      );
    } else {
      showWebsiteConnected = t('settings.connectedSites.notConnected');
    }

    const functions = [
      {
        id: 'appVersion',
        title: t('settings.appVersion.title'),
        desc: isCheckingUpdate
          ? t('settings.appVersion.checking')
          : hasExtensionUpdate
            ? t('settings.appVersion.updateAvailable', {
                version: extensionUpdateVersion,
              })
            : t('settings.appVersion.installed', {
                version: currentExtensionVersion,
              }),
        onClick: handleCheckForUpdates,
        loading: isCheckingUpdate,
      },
      {
        id: 'language',
        title: t('settings.language.title'),
        desc: languageLabels[language],
        link: '/setting/language',
      },
      {
        id: 'bitcoinAddressType',
        title: t('settings.bitcoinAddressType.title'),
        desc: descAddress,
        link: '/setting/choose-address',
      },
      {
        id: 'advanced',
        title: t('settings.advanced.title'),
        desc: t('settings.advanced.desc'),
        link: '/setting/advanced',
      },
      {
        id: 'connectedSites',
        title: t('settings.connectedSites.title'),
        desc: showWebsiteConnected,
        link: '/setting/connect-site',
      },
      {
        id: 'network',
        title: t('settings.network.title'),
        desc:
          networkType === NETWORK_TYPES.MAINNET.label ? Network.MAINNET : networkType,
        link: '/setting/network-type',
      },
      {
        id: 'changePassword',
        title: t('settings.changePassword.title'),
        desc: t('settings.changePassword.desc'),
        link: '/change-password',
      },
      {
        id: 'showRecoveryPhrase',
        title: t('settings.security.showRecoveryPhrase'),
        type: 'recovery',
        link: '/setting/security',
      },
      {
        id: 'showPrivateKey',
        title: t('settings.security.showPrivateKey'),
        type: 'private',
        link: '/setting/security',
      },
      {
        id: 'manageAuthority',
        title: t('settings.manageAuthority'),
        link: '/authority-detail',
      },
    ];

    let settings = checkIsSingleWallet
      ? functions.filter(item => item.id !== 'showRecoveryPhrase')
      : functions;

    // Hide Bitcoin Address Type for TRAC single wallets
    if (isTracSingleWallet) {
      settings = settings.filter(item => item.id !== 'bitcoinAddressType');
    }

    return settings.filter(item => {
      if (item.id === 'manageAuthority') {
        return !!currentAuthority;
      }
      return true;
    });
  }, [
    networkType,
    checkIsSingleWallet,
    activeWallet,
    sitesConnected,
    currentAuthority,
    isTracSingleWallet,
    hasExtensionUpdate,
    extensionUpdateVersion,
    currentExtensionVersion,
    isCheckingUpdate,
    handleCheckForUpdates,
    language,
    languageLabels,
    t,
    tp,
  ]);

  const handleExpandView = async () => {
    if (!isExtensionInTab) {
      await openInTab();
      return;
    }
  };

  //! Render
  return (
    <LayoutScreenSettings
      header={<UX.TextHeader text={t('settings.title')} disableIconBack />}
      body={
        <UX.Box
          layout="column_center"
          spacing="xl"
          style={{margin: '0 24px 16px 24px'}}>
          <UX.Box style={{width: '100%'}} spacing="xl">
            {settingsFunction.map(item => {
              return (
                <UX.Box
                  key={item.id}
                  layout="box_border"
                  style={{
                    cursor: item.onClick || item.link ? 'pointer' : 'default',
                    opacity: item.loading ? 0.7 : 1,
                  }}
                  onClick={() => {
                    if (item.loading) {
                      return;
                    }
                    if (item.onClick) {
                      item.onClick();
                      return;
                    }
                    if (item.type) {
                      if (item.link) {
                        navigate(`${item.link}?type=${item.type}`);
                      }
                      return;
                    }
                    if (item.link) {
                      navigate(item.link);
                    }
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
                title={t('settings.expandView')}
                onClick={handleExpandView}
              />
            )}
            <UX.Button
              styleType="text"
              title={t('settings.lockImmediately')}
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
