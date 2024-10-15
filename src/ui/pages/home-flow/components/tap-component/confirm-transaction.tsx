import {RawTxInfo, TxType} from '@/src/wallet-instance';
import {useLocation} from 'react-router-dom';
import SignConfirm from '../../../send-receive/component/sign-confirm';

const ConfirmTransaction = () => {
  const location = useLocation();
  const {rawTxInfo}: {rawTxInfo: RawTxInfo} = location.state;
  return (
    <SignConfirm
      params={{
        data: {
          psbtHex: rawTxInfo.psbtHex,
          type: TxType.SIGN_TX,
          rawTxInfo,
        },
      }}
    />
  );
};

export default ConfirmTransaction;
