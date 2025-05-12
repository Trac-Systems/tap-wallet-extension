import {networkConfig} from '@/src/background/service/singleton';
import {Network} from '@/src/wallet-instance';
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import {useWalletProvider} from '../../gateway/wallet-provider';
import LayoutSendReceive from '../../layouts/send-receive';
import {AccountSelector} from '../../redux/reducer/account/selector';
import {useAppSelector} from '../../utils';

const ManageAuthority = () => {
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });
  const wallet = useWalletProvider();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const navigate = useNavigate();
  const [authorityList, setAuthorityList] = useState<any[]>([]);
  const [totalAuthority, setTotalAuthority] = useState(0);
  const network = networkConfig.getActiveNetwork();
  const urlPreview =
    network === Network.TESTNET
      ? 'https://static-testnet.unisat.io/preview/'
      : 'https://static.unisat.io/preview/';
  const handleGoBack = () => {
    navigate('/home');
  };

  const handleGetListAuthority = async () => {
    try {
      const response = await wallet.getAuthorityList(
        activeAccount.address,
        (pagination.currentPage - 1) * pagination.pageSize,
        pagination.pageSize,
      );
      console.log('response :>> ', response);
      setAuthorityList(response?.data || []);
      setTotalAuthority(response?.total || 0);
    } catch (error) {
      console.log('error :>> ', error);
    }
  };

  useEffect(() => {
    if (activeAccount.address) {
      handleGetListAuthority();
    }
  }, [pagination.currentPage, activeAccount]);

  return (
    <LayoutSendReceive
      header={
        <UX.TextHeader text="Manage Authority" onBackClick={handleGoBack} />
      }
      body={
        <UX.Box>
          <UX.Box
            style={{
              width: '100%',
              maxHeight: 'calc(100vh - 200px)',
              overflow: 'auto',
            }}
            spacing="xs"
            layout="grid_column_2">
            {authorityList.map((item, index) => {
              return (
                <UX.Box
                  key={item?.ins}
                  layout="column"
                  spacing="xs"
                  style={{
                    width: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                  }}>
                  <UX.InscriptionPreview
                    data={{
                      ...item,
                      inscriptionId: item?.ins,
                      outputValue: item?.val,
                      inscriptionNumber: item?.num,
                      preview: `${urlPreview}${item?.ins}`,
                    }}
                    preset="medium"
                    onClick={() =>
                      navigate('/authority/authority-detail', {
                        state: {
                          inscriptionId: item?.ins,
                          auth: item?.auth,
                        },
                      })
                    }
                  />
                </UX.Box>
              );
            })}
          </UX.Box>
          {totalAuthority > 0 && (
            <div style={{marginTop: '20px'}}>
              <UX.Box layout="row_center">
                <UX.Pagination
                  pagination={pagination}
                  total={totalAuthority}
                  onChange={pagination => {
                    setPagination(pagination);
                  }}
                />
              </UX.Box>
            </div>
          )}
        </UX.Box>
      }
      footer={
        <UX.Box
          layout="column"
          spacing="xl"
          style={{
            padding: '10px 0',
          }}>
          <UX.Button
            styleType="primary"
            title={'Crate Authority'}
            onClick={() =>
              navigate('/handle-create-authority', {
                state: {
                  type: 'create',
                },
              })
            }
          />
        </UX.Box>
      }
    />
  );
};

export default ManageAuthority;
