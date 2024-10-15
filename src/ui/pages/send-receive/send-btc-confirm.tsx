import {useLocation} from 'react-router-dom';
import {RawTxInfo, TxType} from '../../../wallet-instance';
import SignConfirm from './component/sign-confirm';

const SendBTCConfirm = () => {
  const location = useLocation();
  const {rawTxInfo}: {rawTxInfo: RawTxInfo} = location.state;
  return (
    <SignConfirm
      params={{
        data: {
          psbtHex: rawTxInfo.psbtHex,
          type: TxType.SEND_BITCOIN,
          rawTxInfo,
        },
      }}
    />
  );
};

export default SendBTCConfirm;
