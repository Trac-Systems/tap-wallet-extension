import {useEffect, useState} from 'react';
import {UX} from '../../component';
import LayoutScreenHome from '../../layouts/home';
import {SVG} from '../../svg';
import ListWallets from './components/list-wallet';
import Navbar from './components/navbar-navigate';
import {InscriptionList} from './components/Inscription';
import {useNavigate} from 'react-router-dom';
import TapList from './components/tap-list';
import {PAGE_SIZE, useAppSelector} from '../../utils';
import {AccountSelector} from '../../redux/reducer/account/selector';
import {useInscriptionHook} from './hook';
import {InscriptionSelector} from '@/src/ui/redux/reducer/inscription/selector';
import {Inscription} from '@/src/wallet-instance';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';

const Home = () => {
  //! Hooks
  const navigate = useNavigate();
  const {getTapList, getInscriptionList} = useInscriptionHook();
  const inscriptions = useAppSelector(InscriptionSelector.listInscription);
  const totalInscription = useAppSelector(InscriptionSelector.totalInscription);
  const walletProvider = useWalletProvider();

  //! State
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openDrawerInscription, setOpenDrawerInscription] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{
    [key: string]: Inscription;
  }>({});
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: PAGE_SIZE,
  });

  const tabItems = [
    {label: 'Tokens', content: <TapList />},
    {
      label: 'Inscriptions',
      content: <InscriptionList setOpenDrawer={setOpenDrawerInscription} />,
    },
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

  const handleCheckboxChange = (id: string) => {
    setCheckedItems(prevState => {
      const isCurrentlyChecked = !!prevState[id];
      const newState = {...prevState};

      if (isCurrentlyChecked) {
        delete newState[id]; // Remove from checkedItems if unchecked
      } else {
        newState[id] = inscriptions.find(ins => ins.inscriptionId === id); // Add the inscription to checkedItems
      }

      return newState;
    });
  };

  const handleConfirm = async () => {
    setOpenDrawerInscription(false);
    await walletProvider.setAccountSpendableInscriptions(
      activeAccount,
      Object.values(checkedItems),
    );
    fetchSpendableInscriptions();
  };

  const fetchSpendableInscriptions = async () => {
    const inscriptions =
      await walletProvider.getAccountSpendableInscriptions(activeAccount);
    const selectedInsMap = Object.fromEntries(
      inscriptions.map(inscription => [inscription.inscriptionId, inscription]),
    );
    setCheckedItems(selectedInsMap);
  };

  useEffect(() => {
    fetchSpendableInscriptions();
  }, [activeAccount]);

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
          <UX.DrawerCustom
            className="filter-inscription-spendable"
            open={openDrawerInscription}
            onClose={() => setOpenDrawerInscription(false)}>
            <UX.Box
              style={{
                padding: '16px',
                height: '65vh',
              }}>
              <UX.Text
                title="Mark inscriptions as spendable"
                styleType="body_20_extra_bold"
              />
              <UX.Box style={{justifyContent: 'space-between', flex: 1}}>
                <UX.Box spacing="xs" className="card-spendable">
                  {inscriptions.map((item, index) => {
                    return (
                      <UX.Box layout="box_border" key={index}>
                        <UX.Box
                          layout="row"
                          spacing="xs"
                          style={{alignItems: 'center'}}>
                          <UX.InscriptionPreview
                            key={item.inscriptionId}
                            data={item}
                            asLogo
                            preset="asLogo"
                          />
                          <UX.Text
                            title={`#${item.inscriptionNumber}`}
                            styleType="body_16_normal"
                          />
                        </UX.Box>
                        <UX.CheckBox
                          checked={
                            checkedItems[item.inscriptionId] ? true : false
                          }
                          onChange={() =>
                            handleCheckboxChange(String(item.inscriptionId))
                          }
                        />
                      </UX.Box>
                    );
                  })}
                  <UX.Pagination
                    pagination={pagination}
                    total={totalInscription}
                    onChange={pagination => {
                      getInscriptionList(
                        (pagination.currentPage - 1) * pagination.pageSize,
                      );
                      setPagination(pagination);
                    }}
                  />
                </UX.Box>
                <UX.Button
                  title="Confirm"
                  styleType="primary"
                  onClick={handleConfirm}
                />
              </UX.Box>
            </UX.Box>
          </UX.DrawerCustom>
        </>
      }
      navbar={<Navbar isActive="home" />}
    />
  );
};

export default Home;
