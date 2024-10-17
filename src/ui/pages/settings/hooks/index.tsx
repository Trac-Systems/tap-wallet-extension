import { useWalletProvider } from '@/src/ui/gateway/wallet-provider';
import { GlobalSelector } from '@/src/ui/redux/reducer/global/selector';
import { GlobalActions } from '@/src/ui/redux/reducer/global/slice';
import { useAppDispatch, useAppSelector } from '@/src/ui/utils';
import { Network, NETWORK_TYPES } from '@/src/wallet-instance';
import { useCallback } from 'react';

export function useChangeNetworkCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWalletProvider();
  return useCallback(
    async (type: Network) => {
      wallet.setActiveNetwork(type);
      dispatch(
        GlobalActions.updateNetwork({
          networkType: type,
        }),
      );
    },
    [dispatch, wallet],
  );
}

export function useBlockStreamUrl(networkType) {  
  if (networkType === NETWORK_TYPES.MAINNET.label) {
    return 'https://mempool.space';
  } else {
    return 'https://mempool.space/testnet';
  }
}

export function useUnisatWebsite() {
  const networkType = useAppSelector(GlobalSelector.networkType);
  if (networkType === Network.MAINNET) {
    return 'https://unisat.io';
  } else {
    return 'https://testnet.unisat.io';
  }
}
