// Buffer polyfill MUST be set before loading trac-crypto bundle
import { Buffer } from 'buffer';
if (!(window as any).Buffer) (window as any).Buffer = Buffer;
if (!(globalThis as any).Buffer) (globalThis as any).Buffer = Buffer;

// Minimal polyfill for writeUInt32BE used by trac-crypto-api browser build (via b4a)
try {
  const u8 = (Uint8Array.prototype as any) as Record<string, any>;
  if (typeof u8.writeUInt32BE !== 'function') {
    u8.writeUInt32BE = function (value: number, offset = 0) {
      const v = Number(value >>> 0);
      this[offset] = (v >>> 24) & 0xff;
      this[offset + 1] = (v >>> 16) & 0xff;
      this[offset + 2] = (v >>> 8) & 0xff;
      this[offset + 3] = v & 0xff;
      return offset + 4;
    };
  }
} catch {}

import './lib/trac-crypto-loader';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './styles/global.css';
import App from './App';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {WalletProvider} from './gateway/wallet-provider';

import PortMessage from '../gateway/message/port-message';
import {Provider} from 'react-redux';
import store from './redux/store';
import AccountUpdater from './hook/account-updater';
import eventBus from '../gateway/event-bus';
import {EVENTS} from '../wallet-instance';
import {AppDimensions} from './component/responsive';

const portMessageChannel = new PortMessage();

portMessageChannel.connect('popup');
portMessageChannel.listen(data => {
  if (data.type === 'broadcast') {
    eventBus.emit(data.method, data.params);
  }
});

eventBus.addEventListener(EVENTS.broadcastToBackground, data => {
  portMessageChannel.request({
    type: 'broadcast',
    method: data.method,
    params: data.data,
  });
});

const wallet: Record<string, any> = new Proxy(
  {},
  {
    get(_obj, key) {
      return function (...params: any) {
        return portMessageChannel.request({
          type: 'controller',
          method: key,
          params,
        });
      };
    },
  },
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
        <WalletProvider walletProvider={wallet as any}>
          <AppDimensions>
            <App />
            <AccountUpdater />
          </AppDimensions>
          <ToastContainer autoClose={600} />
        </WalletProvider>
    </Provider>
  </StrictMode>,
);
