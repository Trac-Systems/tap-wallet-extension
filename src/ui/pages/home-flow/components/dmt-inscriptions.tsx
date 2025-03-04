import {UX} from '@/src/ui/component';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {useAppSelector} from '@/src/ui/utils';
import {Inscription} from '@/src/wallet-instance';
import {isEmpty} from 'lodash';
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';

export function DmtInscriptionListChildren() {
  const navigate = useNavigate();
  const walletProvider = useWalletProvider();
  const [loading, setLoading] = useState(false);
  const [allInscriptions, setAllInscriptions] = useState<Inscription[]>([]);
  const [dmtInscription, setDmtInscriptions] = useState<Inscription[]>([]);
  const [dmtMintMap, setDmtMintMap] = useState<{[key:string]:boolean}>({});

  //! State
  const activeAccount = useAppSelector(AccountSelector.activeAccount);

  //! Function
  useEffect(() => {
    const fetch = async () => {
      const data = await walletProvider.getAllInscriptions(
        activeAccount.address,
      );
      setAllInscriptions(data);
    };
    fetch();
  }, [activeAccount.key, activeAccount.address]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await walletProvider.getAllAddressDmtMintList(
          activeAccount.address,
        );
        const _dmtMintsMap = data.reduce((acc, item) => {
          acc[item] = true;
          return acc;
        }, {});
        setDmtInscriptions(
          allInscriptions.filter(ins => _dmtMintsMap[ins.inscriptionId]),
        );
        setDmtMintMap(_dmtMintsMap)
      } catch (error) {
        console.log({error});
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [allInscriptions, activeAccount.address]);

  //! Render
  if (loading) {
    return <UX.Loading />;
  }

  if (isEmpty(allInscriptions)) {
    return <UX.Empty />;
  }

  return (
    <UX.Box spacing="xl" style={{marginTop: 16}}>
      <UX.Box layout="grid_column_2" spacing="sm" style={{flexWrap: 'wrap'}}>
        {dmtInscription.map((data: Inscription) => (
          <UX.InscriptionPreview
            isCollectibles
            key={data.inscriptionId}
            data={data}
            preset="medium"
            onClick={() =>
              navigate('/home/inscription-detail', {
                state: {
                  inscriptionId: data?.inscriptionId,
                  isCollectibles: Boolean(dmtMintMap[data?.inscriptionId]),
                },
              })
            }
          />
        ))}
      </UX.Box>
    </UX.Box>
  );
}
