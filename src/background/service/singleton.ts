import {AuthService} from './auth.service';
import {AccountConfigService} from './configuration/account';
import {AppConfigService} from './configuration/app';
import {NetworkConfigService} from './configuration/network';
import {WalletConfigService} from './configuration/wallet';
import permissionService from './permission.service';
import {WalletService} from './wallet.service';

export {default as sessionService} from './session.service';
export {default as notificationService} from './notification.service';
export {default as permissionService} from './permission.service';
export const authService = new AuthService();
export const walletService = new WalletService();
export const networkConfig = new NetworkConfigService();
export const walletConfig = new WalletConfigService();
export const accountConfig = new AccountConfigService();
export const appConfig = new AppConfigService();

export const loadAllStorage = async () => {
  await Promise.all([
    authService.init(),
    networkConfig.init(),
    walletConfig.init(),
    accountConfig.init(),
    appConfig.init(),
    permissionService.init(),
  ]);
};
