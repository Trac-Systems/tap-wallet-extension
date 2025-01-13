import SignConfirm from '@/src/ui/pages/send-receive/component/sign-confirm';
import { RawTxInfo, TxType } from '@/src/wallet-instance';
import {useLocation} from 'react-router-dom';

export default function SendInscriptionConfirm() {
  const location = useLocation();
  const {rawTxInfo}: {rawTxInfo: RawTxInfo} = location.state;
  return (
    <SignConfirm
      params={{
        data: {
          psbtHex: rawTxInfo.psbtHex,
          type: TxType.SEND_ORDINALS_INSCRIPTION,
          rawTxInfo,
        },
      }}
    />
  );
}
