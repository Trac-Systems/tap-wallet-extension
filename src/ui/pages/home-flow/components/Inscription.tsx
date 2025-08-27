import {UX} from '@/src/ui/component';
import {Inscription} from '@/src/wallet-instance';
import {InscriptionListChildren} from './Inscription-children';
import {useCallback, useEffect, useRef, useState} from 'react';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {PAGE_SIZE, useAppDispatch, useAppSelector} from '@/src/ui/utils';
import {
  AccountActions,
  DmtCollectible,
  DmtDeployInfo,
} from '@/src/ui/redux/reducer/account/slice';
import DmtCollection from '@/src/ui/pages/home-flow/components/dmt-collection';
import {isArray} from 'lodash';
import {useInscriptionHook} from '@/src/ui/pages/home-flow/hook';
import {InscriptionSelector} from '@/src/ui/redux/reducer/inscription/selector';
interface IProps {
  setOpenDrawer: (data: boolean) => void;
  spendableInscriptionsMap: {[key: string]: Inscription};
  setSpendableInscriptionMap: (data: {[key: string]: Inscription}) => void;
  allInscriptions?: Inscription[];
  pagination: {currentPage: number; pageSize: number};
  setPagination: (data: {currentPage: number; pageSize: number}) => void;
}

const InscriptionList = (props: IProps) => {
  const walletProvider = useWalletProvider();
  const dispatch = useAppDispatch();
  const {getInscriptionList} = useInscriptionHook();

  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const dmtCollectibleMap = useAppSelector(AccountSelector.dmtCollectibleMap);
  const inscriptions = useAppSelector(InscriptionSelector.listInscription);
  const totalInscription = useAppSelector(InscriptionSelector.totalInscription);

  // group dmt mint by deployment
  const [dmtDeployMap, setDmtDeployMap] = useState<{
    [key: string]: {
      mintInsId: string;
      block: number;
      inscriptionNumber: number;
      outputValue: number;
    }[];
  }>({});
  const [loading, setLoading] = useState(false);
  const [allInscriptions, setAllInscriptions] = useState<Inscription[]>(
    props.allInscriptions || [],
  );
  const prevInscriptionsRef = useRef<Inscription[]>([]);
  const prevAddressRef = useRef(activeAccount.address);

  // fetch inscription list at page 1
  useEffect(() => {
    // if (prevAddressRef.current !== activeAccount.address) {
    //   getInscriptionList(0);
    //   prevAddressRef.current = activeAccount.address;
    // }
  }, [activeAccount.address, getInscriptionList]);

  // Remove duplicate fetchAllInscriptions - use data from props instead
  // const fetchAllInscriptions = useCallback(async () => {
  //   if (!activeAccount?.address) return;
  //   setLoading(true);
  //   try {
  //     const inscriptions = await walletProvider.getAllInscriptions(activeAccount.address);
  //     setAllInscriptions(prev => {
  //       return JSON.stringify(prev) !== JSON.stringify(inscriptions)
  //         ? inscriptions
  //         : prev;
  //     });
  //   } catch (error) {
  //     console.error('Failed to fetch all inscriptions:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [activeAccount.address]);

  // Use data from props (Home component) instead of fetching again
  useEffect(() => {
    if (props.allInscriptions && props.allInscriptions.length > 0) {
      setAllInscriptions(props.allInscriptions);
    }
  }, [props.allInscriptions]);

  // Remove the complex logic that was causing duplicate API calls
  // useEffect(() => {
  //   if (inscriptions.length && inscriptions.length < totalInscription) {
  //     fetchAllInscriptions();
  //   } else if (inscriptions.length >= totalInscription) {
  //     setAllInscriptions(prev => {
  //       return JSON.stringify(prev) !== JSON.stringify(inscriptions)
  //         ? inscriptions
  //         : prev;
  //     });
  //   }
  // }, [inscriptions, totalInscription, fetchAllInscriptions]);

  useEffect(() => {
    const fetch = async () => {
      try {
        // all inscription hadn't been fetch before
        if (!allInscriptions.length) {
          return; // do nothing
        }
        if (
          JSON.stringify(prevInscriptionsRef.current) ===
          JSON.stringify(allInscriptions)
        ) {
          return; // Skip if data is the same
        }
        prevInscriptionsRef.current = allInscriptions; // Update ref
        // to check inscription had been spend or not
        const allInscriptionMap: {[key: string]: Inscription} =
          allInscriptions.reduce((acc, ins) => {
            acc[ins.inscriptionId] = ins;
            return acc;
          }, {});

        setLoading(true);
        const data = await walletProvider.getAllAddressDmtMintList(
          activeAccount.address,
        );
        const _dmtDeployMap = {};

        // group dmt mint same deployment
        for (const insId of data) {
          // skip if dmt existed on dmtCollectibleMap or this one had been spend before
          if (!dmtCollectibleMap[insId] && allInscriptionMap[insId]) {
            try {
              // get inscription content
              const insContent =
                await walletProvider.getInscriptionContent(insId);
              if (insContent?.dep) {
                const dmtMintRenderData = {
                  mintInsId: insId,
                  block: insContent.blk,
                  inscriptionNumber: allInscriptionMap[insId].inscriptionNumber,
                  outputValue: allInscriptionMap[insId].outputValue,
                };
                // push all dmt same ticker to a group
                _dmtDeployMap[insContent.dep] = isArray(
                  _dmtDeployMap[insContent.dep],
                )
                  ? [..._dmtDeployMap[insContent.dep], dmtMintRenderData]
                  : [dmtMintRenderData];
              }
            } catch (error) {
              console.log({error});
            }
          }
          // remove dmt inscription from dmt collectible map
          // and dmt group map if this inscription had been spend before
          if (dmtCollectibleMap[insId] && !allInscriptionMap[insId]) {
            dispatch(
              AccountActions.removeDmtInscriptionFromCollectibleAndGroup(insId),
            );
          }
        }
        setDmtDeployMap(_dmtDeployMap);
      } catch (error) {
        console.log({error});
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [activeAccount.address, allInscriptions, dmtCollectibleMap, walletProvider, dispatch]);

  useEffect(() => {
    const fetchDmtRenderContent = async () => {
      if (!dmtDeployMap || Object.keys(dmtDeployMap).length === 0) {
        return;
      }
      
      const dmtColMapsByTicker: {[key: string]: DmtCollectible} = {};
      const dmtGroupMaps: {[key: string]: DmtDeployInfo} = {};
      
      for (const [k, v] of Object.entries(dmtDeployMap)) {
        const {scriptInsId, ticker, unat} =
          await walletProvider.getDmtScriptId(k);
        dmtGroupMaps[k] = {ticker, dmtInscriptionIds: []};
        for (const mintData of v) {
          // Skip this mintData if it's already in the map, but don't exit the function
          if (dmtColMapsByTicker[mintData.mintInsId]) {
            continue;
          }

          dmtColMapsByTicker[mintData.mintInsId] = {
            contentInscriptionId: scriptInsId,
            block: mintData?.block,
            ticker,
            unat,
            inscriptionNumber: mintData?.inscriptionNumber,
            outputValue: mintData?.outputValue,
          };

          dmtGroupMaps[k].dmtInscriptionIds.push(mintData.mintInsId);
        }
      }
      dispatch(AccountActions.setManyDmtCollectiblesMap(dmtColMapsByTicker));
      dispatch(AccountActions.setDmtGroupMap(dmtGroupMaps));
    };
    fetchDmtRenderContent();
  }, [dmtDeployMap, walletProvider, dispatch]);

  if (loading) {
    return <></>;
  }

  const tabItems = [
    {label: 'All', content: <InscriptionListChildren {...props} />},
    {
      label: 'DMT',
      content: <DmtCollection />,
    },
  ];

  return <UX.Tabs tabs={tabItems} isChildren parentIndex={1} />;
};

export default InscriptionList;
