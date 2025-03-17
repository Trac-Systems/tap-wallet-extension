import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './styles/global.css';
import App from './App';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {WalletProvider} from './gateway/wallet-provider';

import PortMessage from '../gateway/message/port-message';
import {Provider} from 'react-redux';
import store, {persistor} from './redux/store';
import AccountUpdater from './hook/account-updater';
import eventBus from '../gateway/event-bus';
import {EVENTS} from '../wallet-instance';
import {AppDimensions} from './component/responsive';
import {PersistGate} from 'redux-persist/integration/react';

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
      <PersistGate loading={null} persistor={persistor}>
        <WalletProvider walletProvider={wallet as any}>
          <AppDimensions>
            <App />
            <AccountUpdater />
          </AppDimensions>
          <ToastContainer autoClose={600} />
        </WalletProvider>
      </PersistGate>
    </Provider>
  </StrictMode>,
);
