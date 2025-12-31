import {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {UX} from '../../component/index';
import LayoutScreenImport from '../../layouts/import-export';
import {SVG} from '../../svg';
import {useCustomToast} from '../../component/toast-custom';
import browser from 'webextension-polyfill';
import {useAppSelector, getUiType} from '../../utils';
import {GlobalSelector} from '../../redux/reducer/global/selector';
import {Network} from '@/src/wallet-instance';

const LEDGER_VENDOR_ID = 0x2c97;

const getExpectedAppName = (network: Network): string => {
  return network === Network.TESTNET ? 'Bitcoin Test' : 'Bitcoin';
};

const ConnectLedger = () => {
  //! State
  const navigate = useNavigate();
  const {showToast} = useCustomToast();
  const networkType = useAppSelector(GlobalSelector.networkType);
  const activeNetwork = networkType === 'TESTNET' ? Network.TESTNET : Network.MAINNET;
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{name?: string; version?: string} | null>(null);

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  // Check if we're in a popup window
  const isInPopup = () => {
    const uiType = getUiType();
    return uiType.isNotification || uiType.isPop;
  };

  const formatTransportError = (error: any): string => {
    const message = error?.message || String(error || '');
    if (message.includes('No device selected')) return 'You canceled device selection.';
    if (message.includes('The device is already open')) return 'The device is in use (Ledger Live may be running).';
    if (message.includes('SecurityError')) return 'Browser blocked USB access. Please check extension permissions.';
    return message || 'Unknown error';
  };

  const ensureUsbPermission = async () => {
    const navUsb = (navigator as any)?.usb;
    if (!navUsb) {
      // Browser may not support WebUSB (e.g., Firefox). Let background handle it.
      return true;
    }

    try {
      const device: {opened?: boolean; close?: () => Promise<void>} = await navUsb.requestDevice({
        filters: [{vendorId: LEDGER_VENDOR_ID}],
      });

      // Close device if it was automatically opened
      if (device?.opened && typeof device.close === 'function') {
        await device.close();
      }
      return true;
    } catch (error: any) {
      const message = error?.message || String(error || '');
      if (message.includes('No device selected')) {
        showToast({
          title: 'USB permission was cancelled. Please allow access to your Ledger device.',
          type: 'error',
        });
      } else {
        showToast({
          title: 'Unable to request USB permission. Please ensure you are using Chrome or a Chromium-based browser.',
          type: 'error',
        });
      }
      return false;
    }
  };

  // Internal connection logic (without popup check)
  const performConnection = async () => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      setIsConnecting(true);

      // Disconnect first to ensure fresh session
      try {
        await browser.runtime.sendMessage({type: 'LEDGER_DISCONNECT'});
      } catch (error) {
        // Ignore disconnect errors
      }

      // Wait a bit to ensure disconnect completes
      await new Promise(resolve => setTimeout(resolve, 300));

      // Background script will handle USB permission request
      const connectPromise = browser.runtime.sendMessage({
        type: 'LEDGER_CONNECT',
        method: 'auto',
      });
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          const appName = getExpectedAppName(activeNetwork);
          reject(new Error(`Connection timeout. Make sure your Ledger is plugged in, unlocked, and the ${appName} app is open.`));
        }, 5000);
      });
      const resp: any = await Promise.race([connectPromise, timeoutPromise]);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (!resp?.success) {
        throw new Error(resp?.error || 'Unable to connect to Ledger');
      }
      
      const {deviceInfo} = resp;
      setDeviceInfo(deviceInfo);
      setIsConnected(true);
    } catch (error: any) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      setIsConnected(false);
      setDeviceInfo(null);
      showToast({
        title: formatTransportError(error),
        type: 'error',
      });
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsConnecting(false);
    }
  };

  const handleConnect = async () => {
    const permissionGranted = await ensureUsbPermission();
    if (!permissionGranted) {
      return;
    }

    // If we're in a popup, open in a new tab to avoid popup closing during device selection
    if (isInPopup()) {
      try {
        // Store flag to auto-connect when tab opens
        await browser.storage.local.set({autoConnectLedger: true});
        const url = browser.runtime.getURL('index.html#/connect-ledger');
        await browser.tabs.create({url});
        window.close();
        return;
      } catch (error) {
        showToast({
          title: 'Failed to open in new tab. Please try again.',
          type: 'error',
        });
        return;
      }
    }

    await performConnection();
  };

  // Removed auto-connect logic - user must explicitly click Connect button
  // This ensures fresh session and USB permission popup is shown

  //! Render
  return (
    <LayoutScreenImport
      header={<UX.TextHeader text="Connect Ledger" onBackClick={handleGoBack} />}
      body={
        <UX.Box layout="column_center" spacing="xl" style={{width: '100%'}}>
          {isConnected ? (
            <>
              <SVG.SuccessIcon width={96} height={96} />
              <UX.Text
                title="Pairing successful"
                styleType="heading_20"
                customStyles={{textAlign: 'center', marginTop: '16px', color: 'white'}}
              />
              <UX.Text
                title="Your Ledger device has been successfully paired and connected!"
                styleType="body_14_normal"
                customStyles={{
                  textAlign: 'center',
                  color: '#aaa',
                  maxWidth: '280px',
                  marginTop: '8px',
                }}
              />
            </>
          ) : (
            <>
              <SVG.SeedPhraseIcon />
              <UX.Text
                title="Connect your Ledger hardware wallet"
                styleType="heading_20"
                customStyles={{textAlign: 'center', marginTop: '8px', color: 'white'}}
              />
            </>
          )}

          {/* Instructions - 3 Steps */}
          {!isConnected && (
            <UX.Box
              layout="column"
              spacing="xl"
              style={{
                width: '100%',
                marginTop: '32px',
                padding: '0 24px',
              }}>
              {/* Step 1 */}
              <UX.Box layout="row" spacing="sm" style={{alignItems: 'center'}}>
                <UX.Box
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    border: '1px solid #545454',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                  <UX.Text
                    title="1"
                    styleType="body_16_bold"
                    customStyles={{color: 'white'}}
                  />
                </UX.Box>
                <UX.Box layout="column" style={{flex: 1}}>
                  <UX.Text
                    title="Enable USB"
                    styleType="body_16_bold"
                    customStyles={{color: 'white', marginBottom: '4px'}}
                  />
                  <UX.Text
                    title="Allow permission to use USB"
                    styleType="body_14_normal"
                    customStyles={{color: '#aaa'}}
                  />
                </UX.Box>
              </UX.Box>

              {/* Step 2 */}
              <UX.Box layout="row" spacing="sm" style={{alignItems: 'center'}}>
                <UX.Box
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    border: '1px solid #545454',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                  <UX.Text
                    title="2"
                    styleType="body_16_bold"
                    customStyles={{color: 'white'}}
                  />
                </UX.Box>
                <UX.Box layout="column" style={{flex: 1}}>
                  <UX.Text
                    title="Connect your Ledger device"
                    styleType="body_16_bold"
                    customStyles={{color: 'white', marginBottom: '4px'}}
                  />
                  <UX.Text
                    title="Connect via USB cable"
                    styleType="body_14_normal"
                    customStyles={{color: '#aaa'}}
                  />
                </UX.Box>
              </UX.Box>

              {/* Step 3 */}
              <UX.Box layout="row" spacing="sm" style={{alignItems: 'center'}}>
                <UX.Box
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    border: '1px solid #545454',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                  <UX.Text
                    title="3"
                    styleType="body_16_bold"
                    customStyles={{color: 'white'}}
                  />
                </UX.Box>
                <UX.Box layout="column" style={{flex: 1}}>
                  <UX.Text
                    title={`Connect ${getExpectedAppName(activeNetwork)} App`}
                    styleType="body_16_bold"
                    customStyles={{color: 'white', marginBottom: '4px'}}
                  />
                  <UX.Text
                    title={`Select ${getExpectedAppName(activeNetwork)} App to complete connection.`}
                    styleType="body_14_normal"
                    customStyles={{color: '#aaa'}}
                  />
                </UX.Box>
              </UX.Box>
            </UX.Box>
          )}

        </UX.Box>
      }
      footer={
        <UX.Box
          layout="column"
          spacing="xl"
          style={{
            padding: '10px 0',
          }}>
          {!isConnected ? (
            <UX.Button
              styleType="primary"
              title={isConnecting ? 'Connecting...' : 'Connect'}
              onClick={handleConnect}
              isDisable={isConnecting}
            />
          ) : (
            <UX.Button
              styleType="primary"
              title="Continue"
              onClick={() => navigate('/choose-ledger-address')}
            />
          )}
        </UX.Box>
      }
    />
  );
};

export default ConnectLedger;

