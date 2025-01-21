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
import {isEmpty} from 'lodash';
import {ToAddressInfo, UnspentOutput, RawTxInfo} from '@/src/wallet-instance';
import {AccountActions} from '@/src/ui/redux/reducer/account/slice';
import {bitcoin} from '@/src/background/utils';
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
      let _utxos: UnspentOutput[] = (
        spendUnavailableUtxos.map(v => {
          return Object.assign({}, v, {inscriptions: [], atomicals: []});
        }) as any
      ).concat(utxos);
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
      const rawtx = psbt.extractTransaction(true).toHex();
      const fee = psbt.getFee();
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
    }: {
      toAddressInfo: ToAddressInfo;
      inscriptionId: string;
      assetAmount?: string;
      ticker?: string;
      feeRate?: number;
      outputValue?: number;
      enableRBF: boolean;
    }) => {
      if (!feeRate) {
        const recommendFee = await wallet.getRecommendFee();
        feeRate = recommendFee.halfHourFee?.feeRate || 1;
      }

      let btcUtxos = utxos;
      btcUtxos = await fetchUtxos();

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
      const fee = psbt.getFee();
      const rawtx = psbt.extractTransaction(true).toHex();
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
    }: {
      toAddressInfo: ToAddressInfo;
      inscriptionIds: string[];
      assetAmount: string;
      ticker: string;
      feeRate?: number;
      enableRBF: boolean;
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
      const fee = psbt.getFee();

      const rawtx = psbt.extractTransaction(true).toHex();
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
  return useCallback(async () => {
    const activeAccount = await wallet.getActiveAccount();
    const data = await wallet.getBTCUtxos(activeAccount.address);
    dispatch(TransactionsActions.setBtcUtxos(data));
    return data;
  }, [wallet]);
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
