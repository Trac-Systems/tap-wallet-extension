import {createContext, ReactNode, useContext} from 'react';
import {IDerivationPathOption} from '../../background/provider';
import {IResponseAddressBalance} from '../../background/requests/paid-api';
import {IWallet} from '../../background/service/wallet.service';
import {
  WalletDisplay,
  IDisplayAccount,
  AddressType,
  Network,
  TxInput,
  TxOutput,
  AddressTokenSummary,
  InscribeOrder,
  InscribeOrderTransfer,
  TokenTransfer,
  UnspentOutput,
  InputForSigning,
  ExtractPsbt,
  TransactionSigningOptions,
  TokenBalance,
} from '../../wallet-instance';
import {Inscription} from '../interfaces';
import {ConnectedSite} from '../../background/service/permission.service';
import {bitcoin} from '../../background/utils';

export interface IWalletProvider {
  unlockApp(pin: string): Promise<void>;
  isUnlocked(): Promise<boolean>;
  lockWallet(): Promise<void>;
  register(pin: string): Promise<any>;
  isRegister(): Promise<boolean>;
  hasWallet(): Promise<boolean>;
  isReady(): Promise<boolean>;
  getActiveAccount(): Promise<IDisplayAccount>;
  setActiveWallet(wallet: WalletDisplay, accountIndex?: number): Promise<void>;
  generateMnemonic(): Promise<string>;
  createWalletFromMnemonic(
    mnemonic: string,
    derivationPath: string,
    passphrase: string,
    addressType: AddressType,
    accountNum: number,
  ): Promise<IWallet>;
  previewAllAddressesFromMnemonics(
    mnemonic: string,
    passphrase: string,
    derivationPathOptions: IDerivationPathOption[],
    customHdPath: string,
    accountCount: number,
  ): Promise<WalletDisplay[]>;
  createWalletFromPrivateKey(
    privateKey: string,
    addressType: AddressType,
  ): Promise<void>;
  previewAddressFromPrivateKey(
    privateKey: string,
    addressType: AddressType,
  ): Promise<WalletDisplay>;
  getAddressBalance(address: string): Promise<IResponseAddressBalance>;
  getAddressCacheBalance(address: string): Promise<IResponseAddressBalance>;
  getAddressesBalance(addresses: string[]): Promise<IResponseAddressBalance[]>;
  getActiveAccount(): Promise<IDisplayAccount>;
  getAccounts(): Promise<IDisplayAccount[]>;
  setAccountName(
    account: IDisplayAccount,
    name: string,
  ): Promise<IDisplayAccount>;
  getActiveNetwork(): Promise<Network>;
  setActiveNetwork(network: Network): Promise<void>;
  activeWallet(wallet: WalletDisplay, accountIndex?: number): Promise<void>;
  removeWallet(wallet: WalletDisplay): Promise<WalletDisplay>;
  getWallets(): Promise<WalletDisplay[]>;
  changeWallet(keyring: WalletDisplay, accountIndex?: number): Promise<void>;
  getActiveWallet(): Promise<WalletDisplay>;
  setWalletName(wallet: WalletDisplay, name: string): Promise<WalletDisplay>;
  getAllAddresses(
    wallet: WalletDisplay,
    index: number,
  ): Promise<{[key: string]: {addressType: AddressType}}>;
  changeAddressType(addressType: AddressType): Promise<void>;
  getRecommendFee(): Promise<any>;
  pushTx(rawTx: string, spendUtxos?: UnspentOutput[]): Promise<any>;
  getBTCUtxos(
    address: string,
    ignoreAssetUtxos?: string[],
  ): Promise<UnspentOutput[]>;

  getMnemonics(pin: string, wallet: WalletDisplay): Promise<any>;
  getPrivateKey(
    pin: string,
    {pubkey, type}: {pubkey: string; type: string},
  ): Promise<any>;
  verifyPassword(pin: string): Promise<any>;
  getEnableSignData(): Promise<boolean>;
  setEnableSignData(enable: boolean): Promise<void>;
  getNextAccountName(keyring: WalletDisplay): Promise<string>;
  createNewAccountFromMnemonic(
    wallet: WalletDisplay,
    newAccountName?: string,
  ): Promise<string[]>;
  getInscriptions(
    address: string,
    pageNumber: number,
    pageSize: number,
  ): Promise<{
    cursor: number;
    total: number;
    list: Inscription[];
  }>;
  getInscriptionInfo(inscriptionId: string): Promise<Inscription[]>;
  getInscriptionContent(inscriptionId: string): Promise<any>;
  getAllInscriptions(address: string): Promise<Inscription[]>;
  sendBTC({
    to,
    amount,
    feeRate,
    enableRBF,
    btcUtxos,
  }: {
    to: string;
    amount: number;
    feeRate: number;
    enableRBF: boolean;
    btcUtxos?: any[];
  }): Promise<{
    psbtHex: string;
    outputs: TxOutput[];
    inputs: TxInput[];
    inputForSigns: InputForSigning[];
  }>;
  getTapList(
    address: string,
    currentPage: number,
    pageSize: number,
  ): Promise<{
    currentPage: number;
    pageSize: number;
    total: number;
    list: any[];
  }>;
  getTapSummary(address: string, ticker: string): Promise<AddressTokenSummary>;
  getTapTransferAbleList(
    address: string,
    ticker: string,
    currentPage: number,
    pageSize: number,
  ): Promise<{total: number; list: TokenTransfer[]}>;
  getAccountAllMintsListByTicker(address: string, ticker: string): Promise<any>;
  getAllTapDmt(address: string): Promise<TokenBalance[]>;
  getAllAddressDmtMintList(address: string): Promise<any[]>;
  getDmtContentId(depInscriptionId: string): Promise<{contentInsId: string; ticker: string}>;
  createOrderTransfer(
    address: string,
    tick: string,
    amount: string,
    feeRate: number,
    outputValue: number,
  ): Promise<InscribeOrder>;
  getInscribeTapResult(orderId: string): Promise<InscribeOrderTransfer>;
  sendOrdinalsInscription(data: {
    to: string;
    inscriptionId: string;
    feeRate: number;
    outputValue?: number;
    enableRBF: boolean;
    btcUtxos: UnspentOutput[];
  }): Promise<{
    psbtHex: string;
    outputs: TxOutput[];
    inputs: TxInput[];
    inputForSigns: InputForSigning[];
  }>;
  sendOrdinalsInscriptions({
    to,
    inscriptionIds,
    feeRate,
    enableRBF,
    btcUtxos,
  }: {
    to: string;
    inscriptionIds: string[];
    feeRate: number;
    enableRBF: boolean;
    btcUtxos?: UnspentOutput[];
  }): Promise<{
    psbtHex: string;
    outputs: TxOutput[];
    inputs: TxInput[];
    inputForSigns: InputForSigning[];
  }>;
  extractTransactionFromPsbtHex(
    psbtHex: string,
    signed: boolean,
  ): Promise<ExtractPsbt>;
  formatOptionsInputForSignings(
    _psbt: string | bitcoin.Psbt,
    options?: TransactionSigningOptions,
  ): Promise<InputForSigning[]>;
  getApproval(): Promise<any>;
  resolveApproval(data?: any, data2?: any): Promise<void>;
  rejectApproval(data?: any, data2?: any, data3?: any): Promise<void>;
  getConnectedSites(): Promise<ConnectedSite[]>;
  removeConnectedSite(origin: string): Promise<void>;
  getCurrentConnectedSite(id: string): Promise<ConnectedSite>;
  getUSDPrice(bits: number): Promise<any>;
  setAccountSpendableInscriptions(
    account: IDisplayAccount,
    inscriptions: Inscription[],
  ): Promise<void>;
  getAccountSpendableInscriptions(
    account: IDisplayAccount,
  ): Promise<Inscription[]>;

  getAllRuneUtxos(address: string): Promise<UnspentOutput[]>;
}

const WalletContext = createContext<{
  walletProvider: IWalletProvider;
} | null>(null);

const WalletProvider = ({
  children,
  walletProvider,
}: {
  children?: ReactNode;
  walletProvider: IWalletProvider;
}) => (
  <WalletContext.Provider value={{walletProvider}}>
    {children}
  </WalletContext.Provider>
);

const useWalletProvider = () => {
  const {walletProvider} = useContext(WalletContext) as {
    walletProvider: IWalletProvider;
  };

  return walletProvider;
};

export {useWalletProvider, WalletProvider};
