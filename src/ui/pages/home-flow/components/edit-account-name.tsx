import {UX} from '@/src/ui/component';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {AccountActions} from '@/src/ui/redux/reducer/account/slice';
import {useAppDispatch} from '@/src/ui/utils';
import {isEmpty} from 'lodash';
import {useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useReloadAccounts} from '../hook';
import {useCustomToast} from '@/src/ui/component/toast-custom';

const EditAccountName = () => {
  //! State
  const navigate = useNavigate();
  const reloadAccounts = useReloadAccounts();
  const location = useLocation();
  const {state} = location;
  const {showToast} = useCustomToast();
  const dispatch = useAppDispatch();
  const wallet = useWalletProvider();
  const [accountName, setAccountName] = useState<string>(state.name);

  const validName = useMemo(() => {
    return isEmpty(accountName) || accountName === state.name;
  }, [accountName]);

  //! Function
  const handleGoBack = () => {
    navigate('/home');
  };

  const handleSubmit = async () => {
    const newAccount = await wallet.setAccountName(state, accountName);
    dispatch(AccountActions.updateAccountName(newAccount));
    reloadAccounts();
    showToast({
      title: 'Account name updated successfully',
      type: 'success',
    });
    navigate('/home');
  };

  //! Render
  return (
    <LayoutSendReceive
      header={
        <UX.TextHeader text="Edit account name" onBackClick={handleGoBack} />
      }
      body={
        <UX.Box style={{width: '100%'}}>
          <UX.Input
            placeholder="Account name"
            onChange={e => setAccountName(e.target.value)}
            value={accountName}
          />
        </UX.Box>
      }
      footer={
        <UX.Box
          layout="column"
          spacing="xl"
          style={{
            padding: '10px 0',
          }}>
          <UX.Button
            styleType="primary"
            isDisable={validName}
            title="Save change"
            onClick={handleSubmit}
          />
        </UX.Box>
      }
    />
  );
};

export default EditAccountName;
