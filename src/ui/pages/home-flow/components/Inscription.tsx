import {UX} from '@/src/ui/component';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';
import {GlobalActions} from '@/src/ui/redux/reducer/global/slice';
import {InscriptionSelector} from '@/src/ui/redux/reducer/inscription/selector';
import {SVG} from '@/src/ui/svg';
import {PAGE_SIZE, useAppDispatch, useAppSelector} from '@/src/ui/utils';
import {Inscription} from '@/src/wallet-instance';
import {isEmpty} from 'lodash';
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useInscriptionHook} from '../hook';

interface IProps {
  setOpenDrawer: (data: boolean) => void;
  spendableInscriptionsMap: {[key: string]: Inscription};
  setSpendableInscriptionMap: (data: {[key: string]: Inscription}) => void;
}
export function InscriptionList(props: IProps) {
  const {setOpenDrawer, setSpendableInscriptionMap, spendableInscriptionsMap} =
    props;
  const navigate = useNavigate();
  const {getInscriptionList} = useInscriptionHook();
  const dispatch = useAppDispatch();
  const walletProvider = useWalletProvider();

  //! State
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const inscriptions = useAppSelector(InscriptionSelector.listInscription);
  const totalInscription = useAppSelector(InscriptionSelector.totalInscription);
  // const spendableInscriptionsMap = useAppSelector(
  //   InscriptionSelector.spendableInscriptionsMap,
  // );

  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: PAGE_SIZE,
  });
  const showSpendableList = useAppSelector(GlobalSelector.showSpendableList);

  const fetchSpendableInscriptions = async () => {
    const inscriptions =
      await walletProvider.getAccountSpendableInscriptions(activeAccount);
    const selectedInsMap = Object.fromEntries(
      inscriptions.map(inscription => [inscription.inscriptionId, inscription]),
    );
    setSpendableInscriptionMap(selectedInsMap);
    // dispatch(InscriptionActions.setSpendableInscriptionsMap(selectedInsMap));
  };

  //! Function
  useEffect(() => {
    getInscriptionList(0);
  }, [activeAccount.key]);

  useEffect(() => {
    fetchSpendableInscriptions();
  }, [activeAccount.key, showSpendableList]);

  //! Render
  if (isEmpty(inscriptions)) {
    return <UX.Empty />;
  }

  return (
    <UX.Box spacing="xl">
      <UX.Box layout="row_between" style={{alignItems: 'center'}}>
        <UX.Box layout="row" spacing="xs" style={{alignItems: 'center'}}>
          <UX.CheckBox
            checked={showSpendableList}
            onChange={() => {
              dispatch(
                GlobalActions.setShowSpendableList({
                  showSpendableList: !showSpendableList,
                }),
              );
            }}
          />
          <UX.Text
            title="Show spendable inscriptions only"
            styleType="body_14_normal"
          />
        </UX.Box>
        <UX.Box style={{cursor: 'pointer'}} onClick={() => setOpenDrawer(true)}>
          <SVG.FilterIcon />
        </UX.Box>
      </UX.Box>
      {showSpendableList ? (
        <>
          {Object.values(spendableInscriptionsMap).length === 0 ? (
            <UX.Box layout="column_center" style={{minHeight: '100px'}}>
              <UX.Text
                title="There is no spendable inscription."
                styleType="body_16_normal"
              />
            </UX.Box>
          ) : (
            <UX.Box
              layout="grid_column_2"
              spacing="sm"
              style={{flexWrap: 'wrap'}}>
              {Object.values(spendableInscriptionsMap).map(data => (
                <UX.InscriptionPreview
                  key={data.inscriptionId}
                  data={data}
                  preset="medium"
                  isSpendable={
                    spendableInscriptionsMap[data.inscriptionId] ? true : false
                  }
                  onClick={() =>
                    navigate('/home/inscription-detail', {
                      state: {
                        inscriptionId: data?.inscriptionId,
                      },
                    })
                  }
                />
              ))}
            </UX.Box>
          )}
        </>
      ) : (
        <>
          <UX.Box
            layout="grid_column_2"
            spacing="sm"
            style={{flexWrap: 'wrap'}}>
            {inscriptions.map(data => (
              <UX.InscriptionPreview
                key={data.inscriptionId}
                data={data}
                preset="medium"
                isSpendable={
                  spendableInscriptionsMap[data.inscriptionId] ? true : false
                }
                onClick={() =>
                  navigate('/home/inscription-detail', {
                    state: {
                      inscriptionId: data?.inscriptionId,
                    },
                  })
                }
              />
            ))}
          </UX.Box>
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
        </>
      )}
    </UX.Box>
  );
}
