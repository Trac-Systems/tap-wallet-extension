import walletProvider from '../provider';
import {authService} from '../service/singleton';

const tabCheckin = ({
  data: {
    params: {origin, name, icon},
  },
  session,
}) => {
  session.setProp({origin, name, icon});
};

const getProviderState = async req => {
  const {
    session: {origin},
  } = req;

  const isUnlocked = authService.memStore.getState().isUnlocked;
  const accounts: string[] = [];
  if (isUnlocked) {
    const ActiveAccount = walletProvider.getActiveAccount();
    if (ActiveAccount) {
      accounts.push(ActiveAccount.address);
    }
  }
  return {
    network: walletProvider.getActiveNetwork(),
    isUnlocked,
    accounts,
  };
};

const keepAlive = () => {
  return 'ACK_KEEP_ALIVE_MESSAGE';
};

export default {
  tabCheckin,
  getProviderState,
  keepAlive,
};
