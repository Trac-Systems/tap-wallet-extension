import {UX} from '@/src/ui/component';
import {BadgeProps} from '@/src/ui/component/badge';
import InscriptionPreview from '@/src/ui/component/inscription-preview';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {linkDetail} from '@/src/ui/helper';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {
  convertTimestampToDeviceTime,
  getInsUrl,
  getTxIdUrl,
  useAppSelector,
} from '@/src/ui/utils';
import {InscriptionOrdClient, Network} from '@/src/wallet-instance';
import {useEffect, useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';

const AuthorityStatus = {
  UNCONFIRMED: {
    title: 'Unconfirmed',
    status: 'default',
    btnDisable: true,
    btnTitle: 'Tap',
  },
  CONFIRMED: {
    title: 'Confirmed',
    status: 'success',
    btnDisable: false,
    btnTitle: 'Tap',
  },
  TAPPING: {
    title: 'Tapping',
    status: 'warning',
    btnDisable: true,
    btnTitle: 'Cancel',
  },
  TAPPED: {
    title: 'Tapped',
    status: 'error',
    btnDisable: false,
    btnTitle: 'Cancel',
  },
};

const AuthorityDetail = () => {
  const wallet = useWalletProvider();
  const navigate = useNavigate();
  const location = useLocation();
  const {state} = location;
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });
  const [authorityList, setAuthorityList] = useState<any[]>([]);
  const [totalAuthority, setTotalAuthority] = useState(0);

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

  const network = useAppSelector(GlobalSelector.networkType);
  const inscriptionId = state?.inscriptionId;
  const auth = state?.auth;

  const urlPreview = useMemo(() => {
    return network === Network.TESTNET
      ? 'http://trac.intern.ungueltig.com:55002/preview/'
      : 'https://ord-tw.tap-hosting.xyz/preview/';
  }, [network]);

  const [openDrawerInscription, setOpenDrawerInscription] = useState(false);
  const [inscriptionInfo, setInscriptionInfo] =
    useState<InscriptionOrdClient | null>(null);

  // get token info
  useEffect(() => {
    const getTokenInfo = async () => {
      const ins = await wallet.getInscriptionInfoOrdClient(inscriptionId);
      setInscriptionInfo(ins);
    };
    getTokenInfo();
  }, [inscriptionId]);

  const handleOnClick = () => {
    if (inscriptionStatus === 'CONFIRMED') {
      //TODO: Handle taping
      // navigate('/home/inscribe-confirm', {
      //   state: {inscriptionId},
      // });
      return;
    }

    if (inscriptionStatus === 'TAPPED') {
      //TODO: Handle cancel tap
      // navigate('/home/inscribe-confirm', {
      //   state: {inscriptionId},
      // });
      return;
    }
  };

  const inscriptionStatus = useMemo(() => {
    if (Array.isArray(auth)) {
      return 'TAPPED';
    }
    if (inscriptionInfo?.height === 0) {
      const satpointTxid = inscriptionInfo?.satpoint.split(':')[0];
      const inscriptionTxid = inscriptionId.split('i')[0];

      return satpointTxid === inscriptionTxid ? 'UNCONFIRMED' : 'TAPPING';
    }
    return 'CONFIRMED';
  }, [auth, inscriptionInfo]);

  const renderCheckedList = () => {
    return (
      <UX.Box spacing="xs" className="card-spendable">
        {authorityList.map((item, index) => {
          return (
            <UX.Box
              layout="box_border"
              key={index}
              style={{cursor: 'pointer'}}
              onClick={() => {
                navigate('/manage-authority/authority-detail', {
                  state: {
                    inscriptionId: item?.ins,
                    inscriptionInfo: item,
                    hash: location.hash.replace('#', ''),
                  },
                });
              }}>
              <UX.Box layout="row_center" spacing="xs">
                <UX.InscriptionPreview
                  key={item.ins}
                  data={{
                    ...item,
                    inscriptionId: item?.ins,
                    outputValue: item?.val,
                    inscriptionNumber: item?.num,
                    preview: `${urlPreview}${item?.ins}`,
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
          );
        })}

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
    );
  };

  return (
    <UX.Box className="inscription-detail">
      <UX.Box className="image-box">
        <UX.Box onClick={() => navigate(state?.hash)} className="circle">
          <SVG.ArrowBackIcon width={24} height={24} />
        </UX.Box>
        <InscriptionPreview
          data={{
            ...inscriptionInfo,
            inscriptionId: inscriptionInfo?.id,
            outputValue: inscriptionInfo?.value,
            inscriptionNumber: inscriptionInfo?.number,
            preview: `${urlPreview}${inscriptionInfo?.id}`,
          }}
          preset="large"
          asLogo
        />
      </UX.Box>
      <UX.Box className="image-box-section" style={{marginTop: '16px'}}>
        <UX.Box layout="row_between" spacing="xs">
          <UX.Text
            title={`Inscription ${inscriptionInfo?.number}`}
            styleType="heading_20"
            customStyles={{marginLeft: '16px'}}
          />
          <UX.Box
            style={{cursor: 'pointer'}}
            onClick={() => setOpenDrawerInscription(true)}>
            <SVG.FilterIcon />
          </UX.Box>
        </UX.Box>
        <UX.Text
          title={`${inscriptionInfo?.value} SATs`}
          styleType="body_14_bold"
          customStyles={{
            color: colors.main_500,
            marginTop: '8px',
            marginBottom: '16px',
            marginLeft: '16px',
          }}
        />
        <UX.Badge
          text={AuthorityStatus[inscriptionStatus].title}
          status={
            AuthorityStatus[inscriptionStatus].status as BadgeProps['status']
          }
          customStyles={{marginLeft: '16px'}}
        />
        <UX.Box layout="box" spacing="xl" style={{margin: '16px', gap: '8px'}}>
          {auth?.length > 0 ? (
            <>
              <UX.Text
                title={`Token List (${auth.length})`}
                styleType="body_14_normal"
              />
              {auth?.length > 0 && (
                <UX.Box
                  layout="row"
                  style={{
                    gap: '8px',
                  }}>
                  {auth.map((item, index) => (
                    <UX.Badge
                      key={index}
                      text={item}
                      status={'default'}
                      customStyles={{
                        borderRadius: '24px',
                        backgroundColor: 'transparent',
                        border: `1px solid ${colors.gray}`,
                        padding: '4px 8px',
                        color: colors.white,
                        fontSize: '12px',
                        lineHeight: '18px',
                      }}
                    />
                  ))}
                </UX.Box>
              )}
            </>
          ) : (
            <UX.Text
              title="Applied for all tokens"
              styleType="body_14_normal"
            />
          )}
        </UX.Box>
        <UX.Box layout="box" spacing="xl" style={{margin: '16px'}}>
          <UX.Section title="ID" value={inscriptionInfo?.id} />
          <UX.Section title="Address" value={inscriptionInfo?.address} />
          <UX.Section
            title="Output value"
            value={inscriptionInfo?.value?.toString()}
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
            <UX.Text title="List authorities" styleType="body_20_extra_bold" />

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
            title={AuthorityStatus[inscriptionStatus].btnTitle}
            isDisable={AuthorityStatus[inscriptionStatus].btnDisable}
            onClick={handleOnClick}
          />
        </UX.Box>
      </footer>
    </UX.Box>
  );
};

export default AuthorityDetail;
