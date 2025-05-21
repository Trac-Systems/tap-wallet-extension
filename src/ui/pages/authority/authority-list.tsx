import {UX} from '@/src/ui/component';
import {colors} from '@/src/ui/themes/color';
import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {useAppSelector} from '@/src/ui/utils';

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
  const [isLoading, setIsLoading] = useState(false);

  const handleGetListAuthority = async () => {
    try {
      setIsLoading(true);
      const response = await wallet.getAllAuthorityList(activeAccount.address);
      setAuthorityList(response || []);
    } catch (error) {
      console.log('error :>> ', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeAccount.address) {
      handleGetListAuthority();
    }
  }, [activeAccount]);

  return (
    <UX.Box spacing="xs" className="card-spendable">
      {isLoading ? (
        <UX.Loading />
      ) : (
        authorityList.map((item, index) => (
          <UX.Box
            layout="box_border"
            key={index}
            style={{cursor: 'pointer'}}
            onClick={() => {
              setOpenDrawerInscription(false);
              navigate('/authority-detail', {
                state: {inscriptionId: item.ins, auth: item.auth},
              });
            }}>
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
                  customStyles={{color: colors.main_500}}
                />
              </UX.Box>
            </UX.Box>
          </UX.Box>
        ))
      )}
    </UX.Box>
  );
};

export default AuthorityList;
