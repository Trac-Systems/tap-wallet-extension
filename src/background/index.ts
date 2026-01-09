import walletProvider from '@/src/background/provider';
import {Buffer} from 'buffer';
import {
  loadAllStorage,
  sessionService,
  walletService,
} from '@/src/background/service/singleton';
import storage from '@/src/background/browser-api/storage';
import PortMessage from '@/src/gateway/message/port-message';
import eventBus from '@/src/gateway/event-bus';
import {EVENTS} from '../wallet-instance';
import {internalProvide} from './internal';
import {loadApi} from './requests';
import {createTabs} from './browser-api/browser';
import browser from 'webextension-polyfill';
import {accountConfig} from './service/singleton';
import {getLedgerService} from './service/ledger.service';

// Set Buffer globally
globalThis.Buffer = Buffer;

let isStorageLoaded = false;

loadAllStorage();

async function init() {
  const walletStorage = await storage.get('WALLET_STORAGE');
  walletService.init(walletStorage);
  walletService.store.subscribe(async value => {
    await storage.set('WALLET_STORAGE', value);
  });
  await loadAllStorage();
  await loadApi();
  isStorageLoaded = true;
}

init();

browser.runtime.onConnect.addListener(port => {
  if (
    port.name === 'popup' ||
    port.name === 'notification' ||
    port.name === 'tab'
  ) {
    // check if popup closed
    port.onDisconnect.addListener(async () => {
      // check list pending orders
      const account = accountConfig.getActiveAccount();
      if (account) {
        const pendingOrders = walletProvider.getAccountPendingOrders();
        console.log('pendingOrders', pendingOrders);

        // Check wallet type to decide if we should cancel orders
        const activeWallet = walletProvider.getActiveWallet();
        const isHardwareWallet = activeWallet?.type === 'Hardware Wallet';

        // cancel pending orders
        for (const orderId of pendingOrders) {
          try {
            if (isHardwareWallet) {
              // For Ledger: skip cancelOrder API call (would require wallet-auth signing)
              // Just remove from local pending list
              walletProvider.removeAccountPendingOrder(orderId);
              console.log('Skipped cancelOrder for Ledger wallet (orderId:', orderId, ')');
            } else {
              // For soft wallets: cancel normally
              await walletProvider.cancelOrder(orderId);
            }
          } catch (error) {
            console.log('cancel order error', error);
          }
        }
      }
    });

    const pm = new PortMessage(port);
    pm.listen(data => {
      if (data?.type) {
        switch (data.type) {
          case 'broadcast':
            eventBus.emit(data.method, data.params);
            break;
          case 'provider':
          default:
            if (data.method && walletProvider[data.method]) {
              return walletProvider[data.method].apply(null, data.params);
            } else {
              throw new Error(`Method not found: ${data.method}`);
            }
        }
      }
    });

    const broadcastCallback = (data: any) => {
      pm.request({
        type: 'broadcast',
        method: data.method,
        params: data.params,
      });
    };

    // if (port.name === 'popup') {
    //   preferenceService.setPopupOpen(true);

    //   port.onDisconnect.addListener(() => {
    //     preferenceService.setPopupOpen(false);
    //   });
    // }

    eventBus.addEventListener(EVENTS.broadcastToUI, broadcastCallback);
    port.onDisconnect.addListener(() => {
      eventBus.removeEventListener(EVENTS.broadcastToUI, broadcastCallback);
    });

    return;
  }
  const pm = new PortMessage(port);
  pm.listen(async (data: any) => {
    try {
      if (!isStorageLoaded) {
        // todo
      }
      const sessionId = port.sender?.tab?.id;
      const session = sessionService.getOrCreateSession(sessionId);

      const req: any = {data, session};
      // for background push to respective page
      req.session.pushMessage = (event, data) => {
        pm.send('message', {event, data});
      };

      return internalProvide(req);
    } catch (error) {
      console.log('🚀 ~ pm.listen ~ error:', error);
    }
  });
});
const openInNewTab = () => {
  if (isStorageLoaded) {
    const url = browser.runtime.getURL('index.html');
    createTabs({url});
    return;
  }

  setTimeout(() => {
    openInNewTab();
  }, 1000);
};
browser.runtime.onInstalled.addListener(params => {
  if (params.reason === 'install') {
    openInNewTab();
  }
});

// Ledger message handler
browser.runtime.onMessage.addListener(
  (message: any, sender: any, sendResponse: any) => {
    if (message?.type === 'LEDGER_CONNECT') {
      (async () => {
        try {
          const ledgerService = getLedgerService();
          const method = message?.method || 'auto'; // 'usb' | 'auto'
          const deviceInfo = await ledgerService.connect(method);
          sendResponse({success: true, deviceInfo});
        } catch (error: any) {
          sendResponse({
            success: false,
            error: error.message || 'Unable to connect to Ledger',
          });
        }
      })();
      return true; // Keep channel open for async response
    }

    if (message?.type === 'LEDGER_DISCONNECT') {
      (async () => {
        try {
          const ledgerService = getLedgerService();
          await ledgerService.disconnect();
          sendResponse({success: true});
        } catch (error: any) {
          sendResponse({success: false, error: error.message});
        }
      })();
      return true;
    }

    if (message?.type === 'LEDGER_GET_PUBLIC_KEY') {
      (async () => {
        try {
          const ledgerService = getLedgerService();
          const result = await ledgerService.getWalletPublicKey(
            message?.path || '',
            message?.options || {},
          );
          sendResponse({success: true, data: result});
        } catch (error: any) {
          sendResponse({success: false, error: error.message});
        }
      })();
      return true;
    }

    if (message?.type === 'LEDGER_STATUS') {
      (async () => {
        try {
          const ledgerService = getLedgerService();
          const status = await ledgerService.getStatus();
          sendResponse({success: true, status});
        } catch (error: any) {
          sendResponse({success: false, error: error.message});
        }
      })();
      return true;
    }
  },
);

const keepAlive = () => setInterval(browser.runtime.getPlatformInfo, 20e3);
browser.runtime.onStartup.addListener(keepAlive);
keepAlive();
