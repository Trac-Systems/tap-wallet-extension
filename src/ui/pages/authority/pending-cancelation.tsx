import {UX} from '@/src/ui/component';
import {colors} from '@/src/ui/themes/color';
import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {useAppSelector} from '@/src/ui/utils';
import {
  InscribeOrder,
  InscriptionOrdClient,
  OrderType,
} from '@/src/wallet-instance/types';

interface Props {
  setOpenDrawerInscription: (b: boolean) => void;
  urlPreview: string;
}

const PendingCancellation: React.FC<Props> = ({
  setOpenDrawerInscription,
  urlPreview,
}) => {
  const navigate = useNavigate();
  const wallet = useWalletProvider();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);

  const [pendingCancellationList, setPendingCancellationList] = useState<
    {inscriptionInfo: InscriptionOrdClient; order: InscribeOrder}[]
  >([]);
  const handleGetListPendingCancellation = async () => {
    try {
      const response = await wallet.getOrderReadyToTap(
        activeAccount.address,
        OrderType.CANCEL_AUTHORITY,
      );
      const list = [];
      for (const item of response) {
        if (item.files.length > 0 && item.files[0].inscriptionId) {
          const inscriptionInfo = await wallet.getInscriptionInfoOrdClient(
            item.files[0].inscriptionId,
          );
          list.push({inscriptionInfo, order: item});
        }
      }
      setPendingCancellationList(list);
    } catch (error) {
      console.log('error :>> ', error);
    }
  };

  useEffect(() => {
    if (activeAccount.address) {
      handleGetListPendingCancellation();
    }
  }, [activeAccount]);

  return (
    <UX.Box spacing="xs" className="card-spendable">
      {pendingCancellationList.map((item, index) => (
        <UX.Box
          layout="box_border"
          key={index}
          style={{cursor: 'pointer'}}
          onClick={() => {
            setOpenDrawerInscription(false);
            navigate('/authority/authority-detail', {
              state: {
                inscriptionId: item.inscriptionInfo.id,
                order: item.order,
              },
            });
          }}>
          <UX.Box layout="row_center" spacing="xs">
            <UX.InscriptionPreview
              key={item.inscriptionInfo.id}
              data={{
                ...item.inscriptionInfo,
                inscriptionId: item.inscriptionInfo.id,
                outputValue: item.inscriptionInfo.value,
                inscriptionNumber: item.inscriptionInfo.number,
                preview: `${urlPreview}${item.inscriptionInfo.id}`,
              }}
              asLogo
              isModalSpendable
              preset="asLogo"
            />
            <UX.Box layout="column">
              <UX.Text
                title={`#${item.inscriptionInfo.number}`}
                styleType="body_16_normal"
              />
              <UX.Text
                title={`${item.inscriptionInfo.value} SATs`}
                styleType="body_16_normal"
                customStyles={{color: colors.main_500}}
              />
            </UX.Box>
          </UX.Box>
        </UX.Box>
      ))}
    </UX.Box>
  );
};

export default PendingCancellation;
