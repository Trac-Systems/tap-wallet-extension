import {UX} from '@/src/ui/component';
import {Inscription} from '@/src/wallet-instance';
import {InscriptionListChildren} from './Inscription-children';
import {useEffect, useState} from 'react';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {useAppDispatch, useAppSelector} from '@/src/ui/utils';
import {
  AccountActions,
  DmtCollectible,
  DmtDeployInfo,
} from '@/src/ui/redux/reducer/account/slice';
import DmtCollection from '@/src/ui/pages/home-flow/components/dmt-collection';
import {number} from 'bitcoinjs-lib/src/script';
interface IProps {
  setOpenDrawer: (data: boolean) => void;
  spendableInscriptionsMap: {[key: string]: Inscription};
  setSpendableInscriptionMap: (data: {[key: string]: Inscription}) => void;
}

const InscriptionList = (props: IProps) => {
  const walletProvider = useWalletProvider();
  const dispatch = useAppDispatch();

  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const dmtCollectibleMap = useAppSelector(AccountSelector.dmtCollectibleMap);

  // group dmt mint by deployment
  const [dmtDeployMap, setDmtDeployMap] = useState<{
    [key: string]: {
      mintInsId: string;
      block: number;
      inscriptionNumber: number;
    }[];
  }>({});
  const [loading, setLoading] = useState(false);
  const [allInscriptions, setAllInscriptions] = useState<Inscription[]>([]);

  useEffect(() => {
    const fetchAllInscriptions = async () => {
      setLoading(true);
      if (!activeAccount?.address) return;
      try {
        const inscriptions = await walletProvider.getAllInscriptions(
          activeAccount.address,
        );
        setAllInscriptions(inscriptions);
      } catch (error) {
        console.error('Failed to fetch all inscriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllInscriptions();
  }, [activeAccount.address]);

  useEffect(() => {
    const fetch = async () => {
      try {
        // all inscription hadn't been fetch before
        if (!allInscriptions.length) {
          return; // do nothing
        }

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
            // get inscription content
            const insContent =
              await walletProvider.getInscriptionContent(insId);
            if (insContent?.dep) {
              const dmtMintRenderData = {
                mintInsId: insId,
                block: insContent.blk,
                inscriptionNumber: allInscriptionMap[insId].inscriptionNumber,
              };
              // push all dmt same ticker to a group
              _dmtDeployMap[insContent.dep] = _dmtDeployMap[insContent.dep]
                ? _dmtDeployMap[insContent.dep].push(dmtMintRenderData)
                : [dmtMintRenderData];
            }
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
  }, [activeAccount.address, allInscriptions]);

  useEffect(() => {
    const fetchDmtRenderContent = async () => {
      const dmtColMapsByTicker: {[key: string]: DmtCollectible} = {};
      const dmtGroupMaps: {[key: string]: DmtDeployInfo} = {};
      for (const [k, v] of Object.entries(dmtDeployMap)) {
        const {contentInsId, ticker} = await walletProvider.getDmtContentId(k);
        dmtGroupMaps[contentInsId] = {ticker, dmtInscriptionIds: []};
        for (const mintData of v) {
          dmtColMapsByTicker[mintData.mintInsId] = {
            contentInscriptionId: contentInsId,
            block: mintData?.block,
            ticker,
            inscriptionNumber: mintData?.inscriptionNumber,
          };

          dmtGroupMaps[contentInsId].dmtInscriptionIds.push(mintData.mintInsId);
        }
      }
      dispatch(AccountActions.setManyDmtCollectiblesMap(dmtColMapsByTicker));
      dispatch(AccountActions.setDmtGroupMap(dmtGroupMaps));
    };
    fetchDmtRenderContent();
  }, [dmtDeployMap]);

  if (loading) {
    return <UX.Loading />;
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
