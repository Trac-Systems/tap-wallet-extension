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
import {fakeData} from './data';

const Home = () => {
  //! Hooks
  const navigate = useNavigate();
  const {getTapList, getInscriptionList} = useInscriptionHook();

  //! State
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openDrawerInscription, setOpenDrawerInscription] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{[key: string]: boolean}>(
    {},
  );
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
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
    setCheckedItems(prevState => ({
      ...prevState,
      [id]: !prevState[id],
    }));
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
                  {fakeData.map(item => {
                    return (
                      <UX.Box layout="box_border" key={item.id}>
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
                          checked={!!checkedItems[item.id]}
                          onChange={() => handleCheckboxChange(String(item.id))}
                        />
                      </UX.Box>
                    );
                  })}
                   {/* <UX.Pagination
                pagination={pagination}
                total={totalInscription}
                onChange={pagination => {
                  getInscriptionList(
                    (pagination.currentPage - 1) * pagination.pageSize,
                  );
                  setPagination(pagination);
                }}
              /> */}
                </UX.Box>
                <UX.Button
                  title="Confirm"
                  styleType="primary"
                  onClick={() => setOpenDrawerInscription(false)}
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
