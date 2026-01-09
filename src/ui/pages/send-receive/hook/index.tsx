import {useCallback, useMemo} from 'react';
import {
  satoshisToBTC,
  sleep,
  useAppDispatch,
  useAppSelector,
} from '@/src/ui/utils';
import {TransactionSelector} from '@/src/ui/redux/reducer/transaction/selector';
import {TransactionsActions} from '@/src/ui/redux/reducer/transaction/slice';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {WalletSelector} from '@/src/ui/redux/reducer/wallet/selector';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';
import {isEmpty} from 'lodash';
import {ToAddressInfo, UnspentOutput, RawTxInfo, Network} from '@/src/wallet-instance';
import {AccountActions} from '@/src/ui/redux/reducer/account/slice';
import {bitcoin, deriveAddressFromPublicKey} from '@/src/background/utils';
import {satoshisToAmount} from '@/src/shared/utils/btc-helper';

export function useSafeBalance() {
  const utxos = useAppSelector(TransactionSelector.btcUtxos);

  return useMemo(() => {
    if (!utxos?.length) {
      return 0;
    }
    const satoshi = utxos?.reduce((pre, cur) => pre + cur.satoshi, 0);
    return satoshisToBTC(satoshi);
  }, [utxos]);
}

export function usePrepareSendBTCCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWalletProvider();
  const utxos = useAppSelector(TransactionSelector.btcUtxos);
  const spendUnavailableUtxos = useAppSelector(
    TransactionSelector.spendUnavailableUtxos,
  );
  const fetchUtxos = useFetchUtxosCallback();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  return useCallback(
    async ({
      toAddressInfo,
      toAmount,
      feeRate,
      enableRBF,
    }: {
      toAddressInfo: ToAddressInfo;
      toAmount: number;
      feeRate?: number;
      enableRBF: boolean;
    }) => {
      let _utxos: UnspentOutput[] = []
      _utxos = await fetchUtxos();
      const safeBalance = _utxos.reduce((pre, cur) => pre + cur.satoshi, 0);
      if (safeBalance < toAmount) {
        throw new Error(
          `Insufficient balance. Non-Inscription balance(${satoshisToAmount(
            safeBalance,
          )} BTC) is lower than ${satoshisToAmount(toAmount)} BTC `,
        );
      }
      if (!feeRate) {
        const recommendFee = await wallet.getRecommendFee();
        feeRate = recommendFee.halfHourFee?.feeRate || 1;
      }

      const {psbtHex, outputs, inputs, inputForSigns} = await wallet.sendBTC({
        to: toAddressInfo.address,
        amount: toAmount,
        btcUtxos: _utxos,
        enableRBF,
        feeRate,
      });

      const psbt = bitcoin.Psbt.fromHex(psbtHex);
      const activeWallet = await wallet.getActiveWallet();
      const isHardwareWallet = activeWallet?.type === 'Hardware Wallet';

      let rawtx = '';
      let fee = 0;

      if (!isHardwareWallet) {
        // Soft wallets: legacy behaviour (no try/catch)
        rawtx = psbt.extractTransaction(true).toHex();
        fee = psbt.getFee();
      } else {
        // Hardware wallets: PSBT may not be signed/finalized yet
        try {
          rawtx = psbt.extractTransaction(true).toHex();
        } catch (error) {
          // PSBT is not signed yet - will be signed in confirm screen
          rawtx = '';
        }

        try {
          fee = psbt.getFee();
        } catch (error) {
          // PSBT not finalized - calculate fee from inputs and outputs
          const inputValue = inputs.reduce((sum, input) => {
            // Get value from utxo.satoshi or witnessUtxo.value
            const value =
              input.utxo?.satoshi || input.data?.witnessUtxo?.value || 0;
            return sum + value;
          }, 0);
          const outputValue = outputs.reduce(
            (sum, output) => sum + (output.value || 0),
            0,
          );
          fee = inputValue - outputValue;
        }
      }
      dispatch(
        TransactionsActions.updateBitcoinTx({
          rawtx,
          psbtHex,
          fromAddress: activeAccount.address,
          feeRate,
          enableRBF,
        }),
      );
      const rawTxInfo: RawTxInfo = {
        psbtHex,
        rawtx,
        toAddressInfo,
        fee,
        inputs,
        outputs,
        inputForSigns,
        feeRate,
        enableRBF,
      };
      return rawTxInfo;
    },
    [
      dispatch,
      wallet,
      activeAccount.address,
      utxos,
      fetchUtxos,
      spendUnavailableUtxos,
    ],
  );
}

export function usePushBitcoinTxCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWalletProvider();
  return useCallback(
    async (rawtx: string, spendUtxos?: UnspentOutput[]) => {
      const ret = {
        success: false,
        txid: '',
        error: '',
      };
      try {
        const txid = await wallet.pushTx(rawtx, spendUtxos);
        await sleep(3); // Wait for transaction synchronization
        dispatch(TransactionsActions.updateBitcoinTx({txid}));
        dispatch(AccountActions.expireBalance());
        setTimeout(() => {
          dispatch(AccountActions.expireBalance());
        }, 2000);
        setTimeout(() => {
          dispatch(AccountActions.expireBalance());
        }, 5000);

        ret.success = true;
        ret.txid = txid;
      } catch (e) {
        ret.error = (e as Error).message;
      }
      return ret;
    },
    [dispatch, wallet],
  );
}

export function usePrepareSendOrdinalsInscriptionCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWalletProvider();
  const utxos = useAppSelector(TransactionSelector.btcUtxos);
  const fetchUtxos = useFetchUtxosCallback();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  return useCallback(
    async ({
      toAddressInfo,
      inscriptionId,
      assetAmount,
      ticker,
      feeRate,
      outputValue,
      enableRBF,
      dta
    }: {
      toAddressInfo: ToAddressInfo;
      inscriptionId: string;
      assetAmount?: string;
      ticker?: string;
      feeRate?: number;
      outputValue?: number;
      enableRBF?: boolean;
      dta?: string;
    }) => {
      if (!feeRate) {
        const recommendFee = await wallet.getRecommendFee();
        feeRate = recommendFee.halfHourFee?.feeRate || 1;
      }

      let btcUtxos = utxos;
      if (!utxos) {
        btcUtxos = await fetchUtxos();
      }

      const {psbtHex, inputs, outputs, inputForSigns} =
        await wallet.sendOrdinalsInscription({
          to: toAddressInfo.address,
          inscriptionId,
          feeRate,
          outputValue,
          enableRBF,
          btcUtxos,
        });
      const psbt = bitcoin.Psbt.fromHex(psbtHex);
      const activeWallet = await wallet.getActiveWallet();
      const isHardwareWallet = activeWallet?.type === 'Hardware Wallet';

      let fee = 0;
      let rawtx = '';

      if (!isHardwareWallet) {
        // Soft wallets: keep legacy behaviour exactly
        fee = psbt.getFee();
        rawtx = psbt.extractTransaction(true).toHex();
      } else {
        // Hardware wallets: PSBT may not be finalized/signed yet
        try {
          fee = psbt.getFee();
        } catch (error) {
          const inputValue = inputs.reduce((sum, input) => {
            const value =
              input.utxo?.satoshi || input.data?.witnessUtxo?.value || 0;
            return sum + value;
          }, 0);
          const outputValue = outputs.reduce(
            (sum, output) => sum + (output.value || 0),
            0,
          );
          fee = inputValue - outputValue;
        }

        try {
          rawtx = psbt.extractTransaction(true).toHex();
        } catch (error) {
          rawtx = '';
        }
      }
      dispatch(
        TransactionsActions.updateOrdinalsTx({
          rawtx,
          psbtHex,
          fromAddress: activeAccount.address,
          fee,
          feeRate,
          outputValue,
          enableRBF,
        }),
      );
      const rawTxInfo: RawTxInfo = {
        psbtHex,
        rawtx,
        toAddressInfo,
        fee,
        feeRate,
        outputs,
        inputs,
        inputForSigns,
        assetAmount,
        ticker,
        enableRBF,
        dta
      };
      return rawTxInfo;
    },

    [dispatch, wallet, activeAccount.address, utxos],
  );
}

export function usePrepareSendOrdinalsInscriptionsCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWalletProvider();
  const fetchUtxos = useFetchUtxosCallback();
  const utxos = useAppSelector(TransactionSelector.btcUtxos);

  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  return useCallback(
    async ({
      toAddressInfo,
      inscriptionIds,
      assetAmount,
      ticker,
      feeRate,
      enableRBF,
      dta,
    }: {
      toAddressInfo: ToAddressInfo;
      inscriptionIds: string[];
      assetAmount: string;
      ticker: string;
      feeRate?: number;
      enableRBF?: boolean;
      dta?: string
    }) => {
      if (!feeRate) {
        const summary = await wallet.getRecommendFee();
        feeRate = summary.list[1].feeRate || 1;
      }

      let btcUtxos = utxos;
      if (isEmpty(btcUtxos)) {
        btcUtxos = await fetchUtxos();
      }
      const {psbtHex, inputs, outputs, inputForSigns} =
        await wallet.sendOrdinalsInscriptions({
          to: toAddressInfo.address,
          inscriptionIds,
          feeRate,
          enableRBF,
          btcUtxos,
        });
      const psbt = bitcoin.Psbt.fromHex(psbtHex);
      const activeWallet = await wallet.getActiveWallet();
      const isHardwareWallet = activeWallet?.type === 'Hardware Wallet';

      let fee = 0;
      let rawtx = '';

      if (!isHardwareWallet) {
        // Soft wallets: legacy behaviour
        fee = psbt.getFee();
        rawtx = psbt.extractTransaction(true).toHex();
      } else {
        // Hardware wallets: PSBT may not be finalized/signed yet
        try {
          fee = psbt.getFee();
        } catch (error) {
          const inputValue = inputs.reduce((sum, input) => {
            const value =
              input.utxo?.satoshi || input.data?.witnessUtxo?.value || 0;
            return sum + value;
          }, 0);
          const outputValue = outputs.reduce(
            (sum, output) => sum + (output.value || 0),
            0,
          );
          fee = inputValue - outputValue;
        }

        try {
          rawtx = psbt.extractTransaction(true).toHex();
        } catch (error) {
          rawtx = '';
        }
      }
      dispatch(
        TransactionsActions.updateOrdinalsTx({
          rawtx,
          psbtHex,
          fee,
          fromAddress: activeAccount.address,
          feeRate,
          enableRBF,
        }),
      );
      const rawTxInfo: RawTxInfo = {
        psbtHex,
        rawtx,
        toAddressInfo,
        feeRate,
        fee,
        outputs,
        inputs,
        inputForSigns,
        assetAmount,
        ticker,
        enableRBF,
        dta
      };
      return rawTxInfo;
    },
    [dispatch, wallet, activeAccount.address, utxos],
  );
}

export function usePushOrdinalsTxCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWalletProvider();
  return useCallback(
    async (rawtx: string, spendUtxos?: UnspentOutput[]) => {
      const ret = {
        success: false,
        txid: '',
        error: '',
      };
      try {
        const txid = await wallet.pushTx(rawtx, spendUtxos);
        await sleep(3); // Wait for transaction synchronization
        dispatch(TransactionsActions.updateOrdinalsTx({txid}));

        dispatch(AccountActions.expireBalance());
        setTimeout(() => {
          dispatch(AccountActions.expireBalance());
        }, 2000);
        setTimeout(() => {
          dispatch(AccountActions.expireBalance());
        }, 5000);

        ret.success = true;
        ret.txid = txid;
      } catch (e) {
        console.log(e);
        ret.error = (e as Error).message;
      }

      return ret;
    },
    [dispatch, wallet],
  );
}

export function useFetchUtxosCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWalletProvider();
  // const activeAccount = useAppSelector(AccountSelector.activeAccount);
  return useCallback(
    async (ignoreAssets?: string[]) => {
      const activeAccount = await wallet.getActiveAccount();
      const data = await wallet.getBTCUtxos(
        activeAccount.address,
        ignoreAssets,
      );
      dispatch(TransactionsActions.setBtcUtxos(data));
      return data;
    },
    [wallet],
  );
}

export function useUpdateTxStateInfo() {
  const dispatch = useAppDispatch();
  return ({
    toInfo,
    inputAmount,
    enableRBF,
    feeRate,
  }: {
    toInfo?: {address: string; domain?: string};
    inputAmount?: string;
    enableRBF?: boolean;
    feeRate?: number;
  }) => {
    dispatch(
      TransactionsActions.setTxStateInfo({
        toInfo: toInfo ? {...toInfo, domain: toInfo.domain || ''} : undefined,
        inputAmount,
        enableRBF,
        feeRate,
      }),
    );
  };
}

/**
 * Hook to check if hardware wallet is mismatched with current network
 * Returns true if hardware wallet address was derived from a different network
 */
export function useHardwareWalletMismatch(): {
  isMismatched: boolean;
  expectedNetwork: Network | null;
} {
  const activeWallet = useAppSelector(WalletSelector.activeWallet);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const networkType = useAppSelector(GlobalSelector.networkType);

  return useMemo(() => {
    // Only check for hardware wallets
    if (!activeAccount?.pubkey || !activeAccount?.address) {
      return {isMismatched: false, expectedNetwork: null};
    }

    if (activeWallet?.type !== 'Hardware Wallet') {
      return {isMismatched: false, expectedNetwork: null};
    }

    try {
      const addressMainnet = deriveAddressFromPublicKey(
        activeAccount.pubkey,
        activeWallet.addressType,
        Network.MAINNET,
      );
      const addressTestnet = deriveAddressFromPublicKey(
        activeAccount.pubkey,
        activeWallet.addressType,
        Network.TESTNET,
      );

      let expectedNetwork: Network | null = null;
      if (addressMainnet === activeAccount.address) {
        expectedNetwork = Network.MAINNET;
      } else if (addressTestnet === activeAccount.address) {
        expectedNetwork = Network.TESTNET;
      }

      // Derive address with current network
      const addressWithCurrentNetwork = deriveAddressFromPublicKey(
        activeAccount.pubkey,
        activeWallet.addressType,
        networkType,
      );

      const isMismatched =
        Boolean(addressWithCurrentNetwork) &&
        addressWithCurrentNetwork !== activeAccount.address;

      return {isMismatched, expectedNetwork};
    } catch (error) {
      console.error('Error checking hardware wallet mismatch:', error);
      return {isMismatched: false, expectedNetwork: null};
    }
  }, [activeWallet, activeAccount, networkType]);
}
