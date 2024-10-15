import {useEffect} from 'react';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {useNavigate} from 'react-router-dom';
import {getUiType} from '@/src/ui/utils';

export const useApproval = () => {
  const wallet = useWalletProvider();
  const navigate = useNavigate();
  const getApproval = wallet.getApproval;

  const resolveApproval = async (
    data?: any,
    stay = false,
    forceReject = false,
  ) => {
    const approval = await getApproval();
    if (approval) {
      wallet.resolveApproval(data, forceReject);
    }
    if (stay) {
      return;
    }
    setTimeout(() => {
      navigate('/');
    });
  };

  const rejectApproval = async (err?, stay = false, isInternal = false) => {
    const approval = await getApproval();
    if (approval) {
      await wallet.rejectApproval(err, stay, isInternal);
    }
    if (!stay) {
      navigate('/');
    }
  };

  useEffect(() => {
    if (!getUiType().isNotification) {
      return;
    }
    window.addEventListener('beforeunload', rejectApproval);

    return () => window.removeEventListener('beforeunload', rejectApproval);
  }, []);

  return [getApproval, resolveApproval, rejectApproval] as const;
};
