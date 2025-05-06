import {useLocation} from 'react-router-dom';
import {RawTxInfo, TxType} from '../../../wallet-instance';
import SignConfirm from '../send-receive/component/sign-confirm';

const SignAuthority = () => {
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

export default SignAuthority;
