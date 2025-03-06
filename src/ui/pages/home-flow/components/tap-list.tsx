import {UX} from '@/src/ui/component';
import TapListChild from './tap-list-child';
import DmtCollection from './dmt-collection';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {useAppDispatch, useAppSelector} from '@/src/ui/utils';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {useEffect, useState} from 'react';
import {
  DmtCollectible,
  AccountActions,
} from '@/src/ui/redux/reducer/account/slice';

const TapList = () => {
  const walletProvider = useWalletProvider();
  const dispatch = useAppDispatch();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const dmtCollectibleMap = useAppSelector(AccountSelector.dmtCollectibleMap);

  // group dmt mint by deployment
  const [dmtDeployMap, setDmtDeployMap] = useState<{
    [key: string]: {mintInsId: string; block: number}[];
  }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await walletProvider.getAllAddressDmtMintList(
          activeAccount.address,
        );
        // map dmt info of specific dmt inscriptionId
        const _dmtDeployMap: {
          [key: string]: {mintInsId: string; block: number}[];
        } = {};

        // group dmt inscriptionId by deploy inscriptionId
        const _dmtGroupMap: {
          [key: string]: string[];
        } = {};

        // group dmt mint same deployment
        for (const insId of data) {
          if (!dmtCollectibleMap[insId]) {
            // get inscription content
            const insContent =
              await walletProvider.getInscriptionContent(insId);
            if (insContent?.dep) {
              if (_dmtGroupMap[insContent.dep]) {
                _dmtGroupMap[insContent.dep].push(insId);
              } else {
                _dmtGroupMap[insContent.dep] = [insId];
              }

              const dmtMintRenderData = {
                mintInsId: insId,
                block: insContent.blk,
              };
              if (_dmtDeployMap[insContent.dep]) {
                _dmtDeployMap[insContent.dep].push(dmtMintRenderData);
              } else {
                _dmtDeployMap[insContent.dep] = [dmtMintRenderData];
              }
            }
          }
        }
        setDmtDeployMap(_dmtDeployMap);
        dispatch(AccountActions.setDmtGroupMap(_dmtGroupMap));
      } catch (error) {
        console.log({error});
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [activeAccount.address]);

  useEffect(() => {
    const fetchDmtRenderContent = async () => {
      const dmtColMapsByTicker: {[key: string]: DmtCollectible} = {};
      for (const [k, v] of Object.entries(dmtDeployMap)) {
        try {
          const dmtRenderInsId = await walletProvider.getDmtContentId(k);
          for (const mintData of v) {
            dmtColMapsByTicker[mintData?.mintInsId] = {
              contentInscriptionId: dmtRenderInsId,
              block: mintData.block,
            };
          }
        } catch (error) {
          console.log('🚀 ~ fetchDmtRenderContent ~ error:', error);
        }
      }
      dispatch(AccountActions.setManyDmtCollectiblesMap(dmtColMapsByTicker));
    };
    fetchDmtRenderContent();
  }, [dmtDeployMap]);

  const tabItems = [
    {label: 'All', content: <TapListChild />},
    {
      label: 'DMT collections',
      content: <DmtCollection />,
    },
  ];

  if (loading) {
    return <UX.Loading />;
  }

  return <UX.Tabs tabs={tabItems} isChildren parentIndex={0} />;
};

export default TapList;
