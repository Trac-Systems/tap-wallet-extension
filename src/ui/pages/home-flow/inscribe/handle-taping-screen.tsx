import SignConfirm from '@/src/ui/pages/send-receive/component/sign-confirm';
import { InscribeOrder, RawTxInfo, TxType } from '@/src/wallet-instance';
import {useLocation} from 'react-router-dom';

export default function HandleTapingConfirmScreen() {
  const location = useLocation();
  const {rawTxInfo, order}: {rawTxInfo: RawTxInfo; order: InscribeOrder} =
    location.state;
  return (
    <SignConfirm
      params={{
        data: {
          psbtHex: rawTxInfo.psbtHex,
          type: TxType.TAPPING,
          rawTxInfo,
        },
      }}
      order={order}
    />
  );
}
