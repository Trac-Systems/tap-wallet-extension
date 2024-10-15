import {useLocation} from 'react-router-dom';
import SignConfirm from '../../send-receive/component/sign-confirm';
import {
  InscribeOrder,
  RawTxInfo,
  TokenBalance,
  TxType,
} from '@/src/wallet-instance';

const InscribeSignScreen = () => {
  const location = useLocation();
  const {
    rawTxInfo,
    tokenBalance,
    order,
  }: {rawTxInfo: RawTxInfo; tokenBalance: TokenBalance; order: InscribeOrder} =
    location.state;
  return (
    <SignConfirm
      params={{
        data: {
          psbtHex: rawTxInfo.psbtHex,
          type: TxType.INSCRIBE_TAP,
          rawTxInfo,
        },
      }}
      tokenBalance={tokenBalance}
      order={order}
    />
  );
};

export default InscribeSignScreen;
