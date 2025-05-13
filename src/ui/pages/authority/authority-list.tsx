import { UX } from '@/src/ui/component';
import { colors } from '@/src/ui/themes/color';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccountSelector } from '@/src/ui/redux/reducer/account/selector';
import { useWalletProvider } from '@/src/ui/gateway/wallet-provider';
import { useAppSelector } from '@/src/ui/utils';

interface Props {
  setOpenDrawerInscription: (b: boolean) => void;
  urlPreview: string;
}

const AuthorityList: React.FC<Props> = ({
  setOpenDrawerInscription,
  urlPreview,
}) => {
  const navigate = useNavigate();
  const wallet = useWalletProvider();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);

  const [authorityList, setAuthorityList] = useState<any[]>([]);
  const [totalAuthority, setTotalAuthority] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });
  const handleGetListAuthority = async () => {
    try {
      const response = await wallet.getAuthorityList(
        activeAccount.address,
        (pagination.currentPage - 1) * pagination.pageSize,
        pagination.pageSize,
      );
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
    <UX.Box spacing="xs" className="card-spendable">
      {authorityList.map((item, index) => (
        <UX.Box
          layout="box_border"
          key={index}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setOpenDrawerInscription(false);
            navigate('/authority-detail', {
              state: { inscriptionId: item.ins,
                auth: item.auth,
               },
            });
          }}
        >
          <UX.Box layout="row_center" spacing="xs">
            <UX.InscriptionPreview
              key={item.ins}
              data={{
                ...item,
                inscriptionId: item.ins,
                outputValue: item.val,
                inscriptionNumber: item.num,
                preview: `${urlPreview}${item.ins}`,
              }}
              asLogo
              isModalSpendable
              preset="asLogo"
            />
            <UX.Box layout="column">
              <UX.Text title={`#${item.num}`} styleType="body_16_normal" />
              <UX.Text
                title={`${item.val} SATs`}
                styleType="body_16_normal"
                customStyles={{ color: colors.main_500 }}
              />
            </UX.Box>
          </UX.Box>
        </UX.Box>
      ))}

      {totalAuthority > 0 && (
        <div style={{ marginTop: '20px' }}>
          <UX.Box layout="row_center">
            <UX.Pagination
              pagination={pagination}
              total={totalAuthority}
              onChange={setPagination}
            />
          </UX.Box>
        </div>
      )}
    </UX.Box>
  );
};

export default AuthorityList;
