import {useEffect, useMemo, useState} from 'react';
import {UX} from '../../component';
import LayoutScreenHome from '../../layouts/home';
import {SVG} from '../../svg';
import ListWallets from './components/list-wallet';
import Navbar from './components/navbar-navigate';
import {useNavigate} from 'react-router-dom';
import TapList from './components/tap-list';
import {PAGE_SIZE, useAppSelector} from '../../utils';
import {AccountSelector} from '../../redux/reducer/account/selector';
import {useInscriptionHook} from './hook';
import {InscriptionSelector} from '@/src/ui/redux/reducer/inscription/selector';
import {Inscription} from '@/src/wallet-instance';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';
import SpendableAssetAttentionModal from '@/src/ui/pages/home-flow/components/spendable-attention-modal';
import {colors} from '../../themes/color';
import SpendableContainRuneAttentionModal from '@/src/ui/pages/home-flow/components/spendable-cotain-rune-attention-modal';
import InscriptionList from './components/Inscription';

const Home = () => {
  //! Hooks
  const navigate = useNavigate();
  const {getTapList, getInscriptionList} = useInscriptionHook();
  const inscriptions = useAppSelector(InscriptionSelector.listInscription);
  const totalInscription = useAppSelector(InscriptionSelector.totalInscription);

  const showSpendableList = useAppSelector(GlobalSelector.showSpendableList);
  const runeUtxos = useAppSelector(AccountSelector.runeUtxos);
  const walletProvider = useWalletProvider();

  //! State
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openDrawerInscription, setOpenDrawerInscription] = useState(false);
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: PAGE_SIZE,
  });
  const [isSelectForSpendable, setIsSelectForSpendable] = useState(false);
  const [assetsPendingToHandle, setAssetsPendingToHandle] = useState<string[]>(
    [],
  );
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{
    [key: string]: Inscription;
  }>({});
  const [spendableMaps, setSpendableMaps] = useState<{
    [key: string]: Inscription;
  }>({});
  const [allInscriptions, setAllInscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [inscriptionContainRune, setInscriptionContainRune] = useState('');

  const runeUtxosSet = useMemo(() => {
    return runeUtxos?.length > 0
      ? new Set(runeUtxos.map(utxo => `${utxo.txid}:${utxo.vout}`))
      : null;
  }, [runeUtxos]);

  const handleCancelAssetModal = () => {
    setAssetsPendingToHandle([]);
  };

  const handleAcceptAssetModal = () => {
    const newState = {...checkedItems};

    assetsPendingToHandle.forEach(asset => {
      if (!isSelectForSpendable) {
        delete newState[asset]; // Remove from checkedItems if unchecked
      } else {
        let state = inscriptions.find(ins => ins.inscriptionId === asset);
        if (!state) {
          state = Object.values(spendableMaps).find(
            ins => ins.inscriptionId === asset,
          );
        }
        newState[asset] = state;
      }
    });

    setCheckedItems(newState);

    setAssetsPendingToHandle([]);
  };

  const handleOpenDrawerIns = async (bool: boolean) => {
    setOpenDrawerInscription(bool);
  };

  const tabItems = [
    {label: 'Tokens', content: <TapList />, parentIndex: 0},
    {
      label: 'Inscriptions',
      content: (
        <InscriptionList
          setOpenDrawer={handleOpenDrawerIns}
          setSpendableInscriptionMap={setSpendableMaps}
          spendableInscriptionsMap={spendableMaps}
        />
      ),
      parentIndex: 1,
    },
  ];
  useEffect(() => {
    const fetchAllInscriptions = async () => {
      setIsLoading(true);
      if (!activeAccount?.address) return;
      try {
        const inscriptions = await walletProvider.getAllInscriptions(
          activeAccount.address,
        );
        setAllInscriptions(inscriptions);
      } catch (error) {
        console.error('Failed to fetch all inscriptions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllInscriptions();
  }, [activeAccount.address, activeAccount.key]);

  useEffect(() => {
    setIsSelectAllChecked(
      Object.keys(checkedItems).length === allInscriptions.length,
    );
  }, [allInscriptions, checkedItems]);

  useEffect(() => {
    getTapList(1);
    getInscriptionList(0);
  }, [activeAccount.key, activeAccount.address]);

  //! Function
  const handleCreateWallet = (check: string) => {
    if (check === 'isImport') {
      navigate('/restore-wallet-option');
      return;
    }
    navigate('/note-step');
  };

  const handleSelectAll = () => {
    if (isSelectAllChecked) {
      setCheckedItems({});
    } else {
      const allChecked = allInscriptions.reduce(
        (acc, item) => {
          acc[item.inscriptionId] = item;
          return acc;
        },
        {} as {[key: string]: Inscription},
      );
      setCheckedItems(allChecked);
    }
    setIsSelectAllChecked(!isSelectAllChecked);
  };

  const handleCheckboxChange = (inscription: Inscription) => {
    const id = inscription.inscriptionId;
    const newState = {...checkedItems};

    const isCurrentlyChecked = checkedItems[id] ? true : false;
    if (inscription?.hasMoreInscriptions?.length > 1) {
      setAssetsPendingToHandle([...inscription.hasMoreInscriptions]);
      setIsSelectForSpendable(!isCurrentlyChecked);
      return;
    }
    if (isCurrentlyChecked) {
      delete newState[id]; // Remove from checkedItems if unchecked
    } else {
      newState[id] = inscriptions.find(ins => ins.inscriptionId === id); // Add the inscription to checkedItems
    }

    setCheckedItems(newState);
    setIsSelectAllChecked(
      Object.keys(newState).length === allInscriptions.length,
    );
  };

  const fetchSpendableInscriptions = async () => {
    const inscriptions =
      await walletProvider.getAccountSpendableInscriptions(activeAccount);
    const selectedInsMap = Object.fromEntries(
      inscriptions.map(inscription => [inscription.inscriptionId, inscription]),
    );
    setSpendableMaps(selectedInsMap);
    setCheckedItems(selectedInsMap);
    // dispatch(InscriptionActions.setSpendableInscriptionsMap(selectedInsMap));
  };

  const handleConfirm = async () => {
    for (const ins of Object.values(checkedItems)) {
      if (runeUtxosSet?.has(`${ins.utxoInfo?.txid}:${ins.utxoInfo?.vout}`)) {
        setInscriptionContainRune(`#${ins.inscriptionNumber}`);
        return;
      }
    }
    setOpenDrawerInscription(false);

    await walletProvider.setAccountSpendableInscriptions(
      activeAccount,
      Object.values(checkedItems),
    );
    fetchSpendableInscriptions();
  };

  const renderInscriptions = useMemo(() => {
    return showSpendableList ? Object.values(spendableMaps) : inscriptions;
  }, [checkedItems, inscriptions, showSpendableList]);

  //! Effect function
  useEffect(() => {
    fetchSpendableInscriptions();
  }, [activeAccount.key, showSpendableList, openDrawerInscription]);

  const renderCheckedList = () => {
    return (
      <UX.Box spacing="xs" className="card-spendable">
        {renderInscriptions.map((item, index) => {
          const isChecked = checkedItems[item.inscriptionId] ? true : false;
          return (
            <UX.Box layout="box_border" key={index}>
              <UX.Box layout="row_center" spacing="xs">
                <UX.InscriptionPreview
                  key={item.inscriptionId}
                  data={item}
                  asLogo
                  preset="asLogo"
                />
                <UX.Box layout="column">
                  <UX.Text
                    title={`#${item.inscriptionNumber}`}
                    styleType="body_16_normal"
                  />
                  <UX.Text
                    title={`${item.outputValue} SATs`}
                    styleType="body_16_normal"
                    customStyles={{color: colors.main_500}}
                  />
                </UX.Box>
              </UX.Box>
              <UX.CheckBox
                checked={isChecked}
                onChange={() => handleCheckboxChange(item)}
              />
            </UX.Box>
          );
        })}

        {!showSpendableList && (
          <UX.Box layout="row_center">
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
        )}
      </UX.Box>
    );
  };

  if (isLoading) {
    return <UX.Loading />;
  }

  //! Render
  return (
    <LayoutScreenHome
      body={
        <>
          <UX.Box layout="row_between" style={{padding: '18px 24px'}}>
            <UX.Text title="Your Wallets" styleType="heading_20" />
            <UX.Box
              onClick={() => setOpenDrawer(true)}
              style={{cursor: 'pointer'}}>
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
                height: '75vh',
              }}>
              <UX.Text
                title="Mark inscriptions as spendable"
                styleType="body_20_extra_bold"
              />

              <UX.Box
                layout="row_between"
                style={{paddingRight: '16px', margin: '8px 0'}}>
                <UX.Text styleType="body_16_bold" title="Select All" />
                <UX.CheckBox
                  checked={isSelectAllChecked}
                  onChange={handleSelectAll}
                />
              </UX.Box>

              <UX.Box
                style={{
                  justifyContent: 'space-between',
                  flex: 1,
                  maxHeight: '65vh',
                }}>
                {renderCheckedList()}
              </UX.Box>
              <UX.Box>
                <UX.Button
                  title="Confirm"
                  styleType="primary"
                  onClick={handleConfirm}
                />
              </UX.Box>
              <SpendableAssetAttentionModal
                visible={assetsPendingToHandle.length > 1}
                extraInscriptionsCount={assetsPendingToHandle.length - 1}
                isSpendable={isSelectForSpendable}
                onNext={handleAcceptAssetModal}
                onCancel={handleCancelAssetModal}
              />
              <SpendableContainRuneAttentionModal
                visible={Boolean(inscriptionContainRune)}
                inscriptionNum={inscriptionContainRune}
                onCancel={() => setInscriptionContainRune('')}
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
