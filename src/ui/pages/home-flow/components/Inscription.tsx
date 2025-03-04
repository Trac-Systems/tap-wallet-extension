import {UX} from '@/src/ui/component';
import {Inscription} from '@/src/wallet-instance';
import {InscriptionListChildren} from './Inscription-children';
import {DmtInscriptionListChildren} from '@/src/ui/pages/home-flow/components/dmt-inscriptions';
import {useEffect, useState} from 'react';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {useAppDispatch, useAppSelector} from '@/src/ui/utils';
import {
  AccountActions,
  DmtCollectible,
} from '@/src/ui/redux/reducer/account/slice';
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
        const _dmtDeployMap = {};

        // group dmt mint same deployment
        data.forEach(async (insId: string) => {
          if (!dmtCollectibleMap[insId]) {
            // get inscription content
            const insContent =
              await walletProvider.getInscriptionContent(insId);

            if (insContent?.dep) {
              const dmtMintRenderData = {
                mintInsId: insId,
                block: insContent.blk,
              };
              _dmtDeployMap[insContent.dep] = _dmtDeployMap[insContent.dep]
                ? _dmtDeployMap[insContent.dep].push(dmtMintRenderData)
                : [dmtMintRenderData];
            }
          }
        });
        setDmtDeployMap(_dmtDeployMap);
        // setDmtMintMap(_dmtMintsMap);
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
        const dmtRenderInsId = await walletProvider.getDmtContentId(k);
        for (const mintData of v) {
          dmtColMapsByTicker[mintData.mintInsId] = {
            contentInscriptionId: dmtRenderInsId,
            block: mintData.block,
          };
        }
      }
      dispatch(AccountActions.setManyDmtCollectiblesMap(dmtColMapsByTicker));
    };
    fetchDmtRenderContent();
  }, [dmtDeployMap]);

  if (loading) {
    return <UX.Loading />;
  }

  const tabItems = [
    {label: 'All', content: <InscriptionListChildren {...props} />},
    {
      label: 'DMT collectibles',
      content: <DmtInscriptionListChildren />,
    },
  ];

  return <UX.Tabs tabs={tabItems} isChildren parentIndex={1} />;
};

export default InscriptionList;
