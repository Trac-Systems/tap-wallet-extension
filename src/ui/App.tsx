import {useCallback, useEffect, useRef} from 'react';
import {useSelector} from 'react-redux';
import {HashRouter, Route, Routes} from 'react-router-dom';
import {useWalletProvider} from './gateway/wallet-provider';
import ApprovalScreen from './pages/approval/approval-screen';
import CreateAccount from './pages/home-flow/components/create-account';
import EditAccountName from './pages/home-flow/components/edit-account-name';
import InscriptionDetail from './pages/home-flow/components/inscription-detail';
import ConfirmTransaction from './pages/home-flow/components/tap-component/confirm-transaction';
import ListTapOptions from './pages/home-flow/components/tap-component/list-tap-options';
import TapTransfer from './pages/home-flow/components/tap-component/tap-transfer';
import TransferTap from './pages/home-flow/components/tap-component/transfer-tap';
import Home from './pages/home-flow/home';
import InscribeConfirmScreen from './pages/home-flow/inscribe/inscribe-confirm-screen';
import InscribeResultScreen from './pages/home-flow/inscribe/inscribe-result-screen';
import InscribeSignScreen from './pages/home-flow/inscribe/inscribe-sign-screen';
import InscribeTransferTapScreen from './pages/home-flow/inscribe/inscribe-transfer-tab-screen';
import CheckSeedPhrase from './pages/import-flow/check-seed-phrase-step';
import ChooseAddressPrivate from './pages/import-flow/choose-address-private';
import ChooseLedgerAddress from './pages/import-flow/choose-ledger-address';
import ChooseAddress from './pages/import-flow/choose-address-step';
import CreatePassWord from './pages/import-flow/create-password';
import NoteStep from './pages/import-flow/note-step';
import RestoreWallet from './pages/import-flow/restore-wallet';
import RestoreWalletOption from './pages/import-flow/restore-wallet-option';
import ShowSeedPhrase from './pages/import-flow/show-seed-phrase';
import StartScreen from './pages/import-flow/start-screen';
import SuccessAccount from './pages/import-flow/success-account';
import ConnectLedger from './pages/import-flow/connect-ledger';
import LoginPage from './pages/login-screen';
import NotFound from './pages/not-found-screen';
import Receive from './pages/send-receive/receive-screen';
import Security from './pages/send-receive/security-transaction-screen';
import SendBTC from './pages/send-receive/send-btc';
import SendBTCConfirm from './pages/send-receive/send-btc-confirm';
import SendTrac from './pages/send-receive/send-trac';
import SendTracSummary from './pages/send-receive/send-trac-summary';
import SendTracPin from './pages/send-receive/send-trac-pin';
import SendTracSuccess from './pages/send-receive/send-trac-success';
import FailScreen from './pages/send-receive/transaction-fail';
import SuccessScreen from './pages/send-receive/transaction-success-screen';
import DappPage from './pages/dapp';
import SettingPage from './pages/settings';
import ChooseAddressType from './pages/settings/choose-address-type';
import ConnectSite from './pages/settings/connect-site';
import NetWorkType from './pages/settings/network-type';
import SecuritySetting from './pages/settings/security';
import SettingAdvanced from './pages/settings/setting-advance';
import ShowKey from './pages/settings/show-key';
import TxSecurity from './pages/settings/tx-security';
import ChangePassword from './pages/settings/change-password';
import {AccountActions} from './redux/reducer/account/slice';
import {GlobalSelector} from './redux/reducer/global/selector';
import {GlobalActions} from './redux/reducer/global/slice';
import {generateUniqueColors, useAppDispatch} from './utils';
import SendInscription from '@/src/ui/pages/send-receive/send-inscription';
import SendInscriptionConfirm from '@/src/ui/pages/send-receive/send-inscription-confirm';
import DmtList from './pages/home-flow/components/dmt-list';
import TransferAuthority from './pages/authority/transfer-authority';
import AuthorityDetail from './pages/authority/authority-detail';
import HandleTapingConfirmScreen from '@/src/ui/pages/home-flow/inscribe/handle-taping-screen';
import HandleCancelAuthority from './pages/authority/handle/cancel';
import HandleCreateAuthority from './pages/authority/handle/create';
import HandleTappingAuthority from './pages/authority/handle/tapping';
import CancelAuthorityDetail from '@/src/ui/pages/authority/cancel-authority-detail';
import {AuthorityWarning} from '@/src/ui/pages/authority/authority-warning';
import LedgerSignModalHost from './component/ledger-sign-modal/host';

function App() {
  const walletProvider = useWalletProvider();
  const isUnlocked = useSelector(GlobalSelector.isUnlocked);
  const dispatch = useAppDispatch();

  const selfRef = useRef({
    settingsLoaded: false,
    summaryLoaded: false,
    accountLoaded: false,
    configLoaded: false,
  });

  const self = selfRef.current;

  useEffect(() => {
    const uniqueColors = generateUniqueColors(20);
    dispatch(GlobalActions.setListRandomColor({listColor: uniqueColors}));
  }, []);

  const initRedux = useCallback(async () => {
    try {
      if (!self.accountLoaded) {
        const activeAccount = await walletProvider.getActiveAccount();
        if (activeAccount) {
          dispatch(AccountActions.setActiveAccount(activeAccount));

          const accounts = await walletProvider.getAccounts();
          dispatch(AccountActions.setAccounts(accounts));

          if (accounts.length > 0) {
            self.accountLoaded = true;
          }
        }
      }
      if (!self.settingsLoaded) {
        const networkType = await walletProvider.getActiveNetwork();
        dispatch(
          GlobalActions.updateNetwork({
            networkType,
          }),
        );
        self.settingsLoaded = true;
      }
      dispatch(GlobalActions.update({isReady: true}));
    } catch (e) {
      console.log('init error', e);
    }
  }, [self, dispatch, walletProvider, isUnlocked]);

  useEffect(() => {
    initRedux();
  }, [initRedux]);

  useEffect(() => {
    walletProvider.hasWallet().then(val => {
      if (val) {
        walletProvider.isUnlocked().then(isUnlocked => {
          dispatch(GlobalActions.update({isUnlocked}));
          if (!isUnlocked && !location.href.includes('login')) {
            const basePath = location.href.split('#')[0];
            location.href = `${basePath}#/login`;
          }
        });
      }
    });
  }, []);

  return (
    <HashRouter>
      <>
        <Routes>
        {/* Login */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/change-password" element={<ChangePassword />} />

        <Route path="/" element={<StartScreen />} />
        <Route path="/create-password" element={<CreatePassWord />} />
        {/* Import wallet */}
        <Route
          path="/restore-wallet-option"
          element={<RestoreWalletOption />}
        />
        <Route path="/restore-wallet" element={<RestoreWallet />} />
        {/* Connect Ledger */}
        <Route path="/connect-ledger" element={<ConnectLedger />} />

        {/* Create new wallet */}
        <Route path="/note-step" element={<NoteStep />} />
        <Route path="/show-seed-phrase" element={<ShowSeedPhrase />} />
        <Route path="/check-seed-phrase" element={<CheckSeedPhrase />} />

        <Route path="/choose-address" element={<ChooseAddress />} />
        <Route path="/choose-ledger-address" element={<ChooseLedgerAddress />} />
        <Route
          path="/choose-address-private"
          element={<ChooseAddressPrivate />}
        />

        <Route path="/success" element={<SuccessAccount />} />

        {/* Home */}
        <Route path="/home" element={<Home />} />

        {/* INscription */}
        <Route
          path="/home/inscription-detail"
          element={<InscriptionDetail />}
        />
        <Route path="/home/dmt-list/:id" element={<DmtList />} />
        {/* Tap */}
        <Route path="/home/list-tap-options/:id" element={<ListTapOptions />} />
        <Route path="/home/tap-transfer" element={<TapTransfer />} />
        <Route
          path="/home/inscribe-transfer-tap"
          element={<InscribeTransferTapScreen />}
        />
        <Route path="/home/transfer-tap" element={<TransferTap />} />
        <Route
          path="/home/confirm-transaction"
          element={<ConfirmTransaction />}
        />
        <Route path="/home/inscribe-sign" element={<InscribeSignScreen />} />

        <Route
          path="/home/inscribe-confirm"
          element={<InscribeConfirmScreen />}
        />

        <Route
          path="/home/inscribe-result"
          element={<InscribeResultScreen />}
        />

        {/* Receive */}
        <Route path="/home/receive" element={<Receive />} />

        {/* Send */}
        <Route path="/home/send" element={<SendBTC />} />
        <Route path="/home/send-btc-confirm" element={<SendBTCConfirm />} />
        <Route path="/home/send-trac" element={<SendTrac />} />
        <Route path="/home/send-trac-summary" element={<SendTracSummary />} />
        <Route path="/home/send-trac-pin" element={<SendTracPin />} />
        <Route path="/home/send-trac-success" element={<SendTracSuccess />} />

        {/* Send inscriptions */}
        <Route path="/home/send-inscription" element={<SendInscription />} />
        <Route
          path="/home/send-inscription-confirm"
          element={<SendInscriptionConfirm />}
        />

        {/* Security */}
        <Route path="/home/security" element={<Security />} />
        <Route path="/home/tx-security" element={<TxSecurity />} />

        {/* Result */}
        <Route path="/home/send-success" element={<SuccessScreen />} />
        <Route path="/home/send-fail" element={<FailScreen />} />

        {/* Account */}
        <Route path="/home/create-account" element={<CreateAccount />} />
        <Route path="/home/edit-account-name" element={<EditAccountName />} />

        <Route path="*" element={<NotFound />} />

        {/* Dapp */}
        <Route path="/dapp" element={<DappPage />} />

        {/* Setting */}
        <Route path="/setting" element={<SettingPage />} />

        <Route path="/setting/choose-address" element={<ChooseAddressType />} />
        <Route path="/setting/advanced" element={<SettingAdvanced />} />
        <Route path="/setting/connect-site" element={<ConnectSite />} />
        <Route path="/setting/network-type" element={<NetWorkType />} />
        <Route path="/setting/change-password" element={<SettingPage />} />
        <Route path="/setting/show-key" element={<ShowKey />} />
        <Route path="/setting/security" element={<SecuritySetting />} />

        {/* Approval */}
        <Route path="/approval" element={<ApprovalScreen />} />

        {/* Authority */}
        <Route path="/transfer-authority" element={<TransferAuthority />} />
        <Route path="/authority-detail" element={<AuthorityDetail />} />
        <Route
          path="/cancel-authority-detail"
          element={<CancelAuthorityDetail />}
        />
        <Route
          path="/handle-taping-confirm"
          element={<HandleTapingConfirmScreen />}
        />
        <Route
          path="/handle-cancel-authority"
          element={<HandleCancelAuthority />}
        />
        <Route
          path="/handle-tapping-authority"
          element={<HandleTappingAuthority />}
        />
        <Route
          path="/handle-create-authority"
          element={<HandleCreateAuthority />}
        />
        <Route path="/authority-warning" element={<AuthorityWarning />} />
      </Routes>
      <LedgerSignModalHost />
      </>
    </HashRouter>
  );
}

export default App;
