import { UX } from '@/src/ui/component';
import { BadgeProps } from '@/src/ui/component/badge';
import InscriptionPreview from '@/src/ui/component/inscription-preview';
import { useWalletProvider } from '@/src/ui/gateway/wallet-provider';
import { linkDetail } from '@/src/ui/helper';
import { AccountSelector } from '@/src/ui/redux/reducer/account/selector';
import { GlobalSelector } from '@/src/ui/redux/reducer/global/selector';
import { SVG } from '@/src/ui/svg';
import { colors } from '@/src/ui/themes/color';
import {
  convertTimestampToDeviceTime,
  getInsUrl,
  getTxIdUrl,
  useAppSelector,
} from '@/src/ui/utils';
import { Network } from '@/src/wallet-instance';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthorityStatus = {
  UNCONFIRMED: {
    text: 'Unconfirmed',
    status: 'default',
  },
  CONFIRMED: {
    text: 'Confirmed',
    status: 'success',
  },
  PENDING: {
    text: 'Pending',
    status: 'warning',
  },
  TAPPED: {
    text: 'Tapped',
    status: 'error',
  },
}

const AuthorityDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const wallet = useWalletProvider();
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });
  const [authorityList, setAuthorityList] = useState<any[]>([]);
  const [totalAuthority, setTotalAuthority] = useState(0);

  const handleGetListAuthority = async () => {
    try {
      const response = await wallet.getAuthorityList(activeAccount.address, (pagination.currentPage - 1) * pagination.pageSize, pagination.pageSize);
      console.log('response :>> ', response);
      setAuthorityList(response?.data || []);
      setTotalAuthority(response?.total || 0);
    } catch (error) {
      console.log('error :>> ', error);
    }
  }

  useEffect(() => {
    if (activeAccount.address) {
      handleGetListAuthority();
    }
  }, [pagination.currentPage, activeAccount])

  const network = useAppSelector(GlobalSelector.networkType);
  const inscriptionInfo = state?.inscriptionInfo;
  const isUnconfirmed = inscriptionInfo?.ts === 0;
  const urlPreview =
    network === Network.TESTNET
      ? 'https://static-testnet.unisat.io/preview/'
      : 'https://static.unisat.io/preview/';
  const [openDrawerInscription, setOpenDrawerInscription] = useState(false);


  console.log('inscriptionInfo :>> ', inscriptionInfo);
  const inscriptionStatus = 'UNCONFIRMED'
  const tokens = inscriptionInfo?.auth || [];

  const renderCheckedList = () => {
    return (
      <UX.Box spacing="xs" className="card-spendable">
        {authorityList.map((item, index) => {
          return (
            <UX.Box layout="box_border" key={index} style={{ cursor: 'pointer' }}
              onClick={() => {
                navigate('/manage-authority/authority-detail', {
                  state: {
                    inscriptionId: item?.ins,
                    inscriptionInfo: item,
                    hash: location.hash.replace('#', ''),
                  },
                });
              }}
            >
              <UX.Box layout="row_center" spacing="xs">
                <UX.InscriptionPreview
                  key={item.ins}
                  data={{ ...item, inscriptionId: item?.ins, outputValue: item?.val, inscriptionNumber: item?.num, preview: `${urlPreview}${item?.ins}` }}
                  asLogo
                  isModalSpendable
                  preset="asLogo"
                />
                <UX.Box layout="column">
                  <UX.Text
                    title={`#${item.num}`}
                    styleType="body_16_normal"
                  />
                  <UX.Text
                    title={`${item.val} SATs`}
                    styleType="body_16_normal"
                    customStyles={{ color: colors.main_500 }}
                  />
                </UX.Box>
              </UX.Box>
            </UX.Box>
          );
        })}

        {totalAuthority > 0 &&
          <div style={{ marginTop: '20px' }}>
            <UX.Box layout="row_center">
              <UX.Pagination
                pagination={pagination}
                total={totalAuthority}
                onChange={pagination => {
                  setPagination(pagination);
                }}
              />
            </UX.Box>
          </div>}
      </UX.Box>
    );
  };

  return (
    <UX.Box className="inscription-detail">
      <UX.Box className="image-box">
        <UX.Box onClick={() => navigate(state?.hash)} className="circle">
          <SVG.ArrowBackIcon width={24} height={24} />
        </UX.Box>
        <InscriptionPreview
          data={{ ...inscriptionInfo, inscriptionId: inscriptionInfo?.ins, outputValue: inscriptionInfo?.val, inscriptionNumber: inscriptionInfo?.num, preview: `${urlPreview}${inscriptionInfo?.ins}` }}
          preset="large"
          asLogo
        />
      </UX.Box>
      <UX.Box className="image-box-section" style={{ marginTop: '16px' }}>
        <UX.Box layout="row_between" spacing="xs">
          <UX.Text
            title={`Inscription ${inscriptionInfo?.num}`}
            styleType="heading_20"
            customStyles={{ marginLeft: '16px' }}
          />
          <UX.Box style={{ cursor: 'pointer' }} onClick={() => setOpenDrawerInscription(true)}>
            <SVG.FilterIcon />
          </UX.Box>
        </UX.Box>
        <UX.Text
          title={`${inscriptionInfo?.val} SATs`}
          styleType="body_14_bold"
          customStyles={{
            color: colors.main_500,
            marginTop: '8px',
            marginBottom: '16px',
            marginLeft: '16px',
          }}
        />
        <UX.Badge text={AuthorityStatus[inscriptionStatus].text} status={AuthorityStatus[inscriptionStatus].status as BadgeProps['status']} customStyles={{ marginLeft: '16px' }} />
        <UX.Box layout="box" spacing="xl" style={{ margin: '16px', gap: '8px' }}>
          {tokens?.length > 0 ?
            <>
              <UX.Text title={`Token List (${tokens.length})`} styleType="body_14_normal" />
              {tokens?.length > 0 && (
                <UX.Box
                  layout="row"
                  style={{
                    gap: '8px',
                  }}>
                  {tokens.map((item, index) => (
                    <UX.Badge
                      key={index}
                      text={item}
                      status={'default'}
                      customStyles={{ borderRadius: '24px', backgroundColor: 'transparent', border: `1px solid ${colors.gray}`, padding: '4px 8px', color: colors.white, fontSize: '12px', lineHeight: '18px' }}
                    />
                  ))}
                </UX.Box>
              )}
            </> :
            <UX.Text title='Applied for all tokens' styleType="body_14_normal" />
          }
        </UX.Box>
        <UX.Box layout="box" spacing="xl" style={{ margin: '16px' }}>
          <UX.Section title="ID" value={inscriptionInfo?.ins} />
          <UX.Section title="Address" value={inscriptionInfo?.addr} />
          <UX.Section
            title="Output value"
            value={inscriptionInfo?.val?.toString()}
          />
        </UX.Box>
        <UX.DrawerCustom
          className="filter-inscription-spendable"
          open={openDrawerInscription}
          onClose={() => setOpenDrawerInscription(false)}>
          <UX.Box
            style={{
              padding: '16px',
              height: '75vh',
            }}>
            <UX.Text
              title="List authorities"
              styleType="body_20_extra_bold"
            />

            <UX.Box
              style={{
                justifyContent: 'space-between',
                flex: 1,
                maxHeight: '65vh',
              }}>
              {renderCheckedList()}
            </UX.Box>
          </UX.Box>
        </UX.DrawerCustom>
      </UX.Box>

      <footer className="footer_sr">
        <UX.Box
          layout="column"
          spacing="xl"
          className="footer_sr"
          style={{
            padding: '10px 0',
          }}>
          <UX.Button
            styleType="primary"
            customStyles={{
              margin: '0 24px',
            }}
            title={'Tap'}
          />
        </UX.Box>
      </footer>
    </UX.Box>
  );
};

export default AuthorityDetail;
