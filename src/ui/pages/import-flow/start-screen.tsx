import {colors} from '../../themes/color';
import {UX} from '../../component/index';
import LayoutScreenImport from '../../layouts/import-export';
import {useNavigate} from 'react-router-dom';
import {useEffect, useState} from 'react';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {useIsTabOpen, useOpenInTab} from '../../browser';
import {getUiType} from '../../utils';
import {useApproval} from '../approval/hook';

const StartScreen = () => {
  //! State
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const wallet = useWalletProvider();
  const isTabOpen = useIsTabOpen();
  const openInTab = useOpenInTab();
  const [getApproval, , rejectApproval] = useApproval();

  const initLoadView = async () => {
    const hasWallet = await wallet.hasWallet();
    const isUnlocked = await wallet.isUnlocked();
    const uiType = getUiType();
    const isInNotification = uiType.isNotification;
    const _isTabOpen = await isTabOpen();

    let approval = await getApproval();
    if (isInNotification && !approval) {
      window.close();
      return;
    }
    if (!isInNotification) {
      await rejectApproval();
      approval = undefined;
    }
    if (!hasWallet) {
      // if app don't have any wallet open in new tab
      if (!_isTabOpen) {
        await openInTab();
        return;
      }
      return;
    }

    if (isUnlocked && !isInNotification) {
      navigate('/home');
      return;
    }
    if (hasWallet && !isUnlocked) {
      navigate('/login');
      return;
    }
    if (approval) {
      navigate('/approval');
      return;
    }
  };

  useEffect(() => {
    // setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
      initLoadView();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  //! Function
  const handleCreateWallet = (check: string) => {
    navigate(`/create-password?check=${check}`);
  };

  //! Render
  if (loading) {
    return <UX.Loading />;
  }
  return (
    <LayoutScreenImport
      body={
        <UX.Box layout="column_center" spacing="xl">
          <img src="./images/logo2.png" width={272} height={56} />
          <UX.Text
            title=" TAP wallet allows you to make fast and secure blockchain-based
            payments without intermediaries."
            styleType="body_16_normal"
            customStyles={{textAlign: 'center', marginTop: '16px'}}
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
            title="Create New Wallet"
            onClick={() => handleCreateWallet('isCreateNew')}
          />
          <UX.Button
            styleType="dark"
            title="Restore Existing Wallet"
            onClick={() => handleCreateWallet('isImport')}
          />
        </UX.Box>
      }
    />
  );
};

export default StartScreen;
