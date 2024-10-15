import {useCallback} from 'react';
import {AccountActions} from '../redux/reducer/account/slice';
import {WalletActions} from '../redux/reducer/wallet/slice';
import {useAppDispatch} from '../utils';
import {GlobalActions} from '../redux/reducer/global/slice';

export const useResetReduxState = () => {
  const dispatch = useAppDispatch();
  return useCallback(() => {
    dispatch(WalletActions.reset());
    dispatch(AccountActions.reset());
    dispatch(GlobalActions.update({isUnlocked: false}));
  }, [dispatch]);
};
