import {UX} from '@/src/ui/component';
import {useNavigate} from 'react-router-dom';
import {PAGE_SIZE, useAppSelector} from '@/src/ui/utils';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {useEffect, useState} from 'react';
import {InscriptionSelector} from '@/src/ui/redux/reducer/inscription/selector';
import {useInscriptionHook} from '../hook';
import {isEmpty} from 'lodash';

export function InscriptionList() {
  const navigate = useNavigate();
  const {getInscriptionList} = useInscriptionHook();
  //! State
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const inscriptions = useAppSelector(InscriptionSelector.listInscription);
  const totalInscription = useAppSelector(InscriptionSelector.totalInscription);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: PAGE_SIZE,
  });

  //! Function
  useEffect(() => {
    getInscriptionList(0);
  }, [activeAccount.address]);

  //! Render
  if (isEmpty(inscriptions)) {
    return <UX.Empty />;
  }

  return (
    <UX.Box spacing="xl">
      <UX.Box layout="grid_column_2" spacing="sm" style={{flexWrap: 'wrap'}}>
        {inscriptions.map(data => (
          <UX.InscriptionPreview
            key={data.inscriptionId}
            data={data}
            preset="medium"
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
    </UX.Box>
  );
}
