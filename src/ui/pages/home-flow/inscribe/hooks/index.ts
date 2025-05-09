import {
  InscribeOrderTransfer,
  TokenBalance,
  TokenTransfer,
} from '@/src/wallet-instance';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {useAppSelector} from '@/src/ui/utils';
import {useNavigate} from 'react-router-dom';

export interface IInscribeTransferHook {
  onConfirmInscribeTransfer: (tokenBalance: TokenBalance, result: any) => void;
  getInscribeResult: (
    orderId: string,
  ) => Promise<TokenTransfer | InscribeOrderTransfer | undefined>;
}

export const useTapInscribeTransferHook = (): IInscribeTransferHook => {
  const wallet = useWalletProvider();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const navigate = useNavigate();
  const onConfirmInscribeTransfer = (
    tokenBalance: TokenBalance,
    _result: InscribeOrderTransfer,
  ) => {
    wallet.getTapSummary(activeAccount.address, tokenBalance.ticker).then(v => {
      navigate(-5)
    });
  };
  const getInscribeResult = async (orderId: string) => {
    try {
      const resultCheck = await wallet.getInscribeTapResult(orderId);
      if (!resultCheck?.files?.length || !resultCheck.files[0]?.inscriptionId) {
        return;
      }
      const inscription = await wallet.getInscriptionInfo(
        resultCheck.files[0]?.inscriptionId,
      );
      return {...resultCheck, inscription};
    } catch (error) {
      throw new Error((error as any).message);
    }
  };
  return {
    onConfirmInscribeTransfer,
    getInscribeResult,
  };
};
