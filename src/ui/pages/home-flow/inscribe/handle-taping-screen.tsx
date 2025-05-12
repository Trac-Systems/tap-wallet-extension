import SignConfirm from '@/src/ui/pages/send-receive/component/sign-confirm';
import { InscribeOrder, RawTxInfo, TxType } from '@/src/wallet-instance';
import {useLocation} from 'react-router-dom';

export default function HandleTapingScreen() {
  const location = useLocation();
  const {rawTxInfo, order}: {rawTxInfo: RawTxInfo; order: InscribeOrder} =
    location.state;
  return (
    <SignConfirm
      params={{
        data: {
          psbtHex: rawTxInfo.psbtHex,
          type: TxType.INSCRIBE_TAPPING,
          rawTxInfo,
        },
      }}
      order={order}
    />
  );
}
