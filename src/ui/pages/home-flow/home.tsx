import {useEffect, useState} from 'react';
import {UX} from '../../component';
import LayoutScreenHome from '../../layouts/home';
import {SVG} from '../../svg';
import ListWallets from './components/list-wallet';
import Navbar from './components/navbar-navigate';
import {InscriptionList} from './components/Inscription';
import {useNavigate} from 'react-router-dom';
import TapList from './components/tap-list';
import {useAppSelector} from '../../utils';
import {AccountSelector} from '../../redux/reducer/account/selector';
import {useInscriptionHook} from './hook';

const Home = () => {
  //! Hooks
  const navigate = useNavigate();
  const {getTapList, getInscriptionList} = useInscriptionHook();

  //! State
  const [openDrawer, setOpenDrawer] = useState(false);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const tabItems = [
    {label: 'Tokens', content: <TapList />},
    {label: 'Inscriptions', content: <InscriptionList />},
  ];

  useEffect(() => {
    getTapList(1);
    getInscriptionList(0);
  }, [activeAccount.address]);

  //! Function
  const handleCreateWallet = (check: string) => {
    if (check === 'isImport') {
      navigate('/restore-wallet-option');
      return;
    }
    navigate('/note-step');
  };

  //! Render
  return (
    <LayoutScreenHome
      body={
        <>
          <UX.Box layout="row_between" style={{padding: '18px 24px'}}>
            <UX.Text title="Your Wallets" styleType="heading_20" />
            <UX.Box onClick={() => setOpenDrawer(true)}>
              <SVG.AddIcon />
            </UX.Box>
          </UX.Box>
          <ListWallets />
          <UX.Box style={{padding: '0 24px'}} spacing="xlg">
            <UX.Tabs tabs={tabItems} />
          </UX.Box>
          <UX.DrawerCustom
            className="drawer-add-wallet"
            open={openDrawer}
            onClose={() => setOpenDrawer(false)}>
            <UX.Box style={{padding: '16px'}}>
              <UX.Button
                title="Create New Wallet"
                styleType="primary"
                customStyles={{marginBottom: '16px'}}
                onClick={() => handleCreateWallet('isCreateNew')}
              />
              <UX.Button
                title="Import Existing Wallet"
                styleType="dark"
                onClick={() => handleCreateWallet('isImport')}
              />
            </UX.Box>
          </UX.DrawerCustom>
        </>
      }
      navbar={<Navbar isActive="home" />}
    />
  );
};

export default Home;
