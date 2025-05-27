import {UX} from '@/src/ui/component';
import LayoutTap from '@/src/ui/layouts/tap';
import { useBlockStreamUrl } from '@/src/ui/pages/settings/hooks';
import { GlobalSelector } from '@/src/ui/redux/reducer/global/selector';
import {SVG} from '@/src/ui/svg';
import { useAppSelector } from '@/src/ui/utils';
import {isEmpty} from 'lodash';
import {useLocation, useNavigate} from 'react-router-dom';

const InscribeResultScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const networkType = useAppSelector(GlobalSelector.networkType);
  const blockStreamURL = useBlockStreamUrl(networkType);
  // const {showToast} = useCustomToast();
  // const {onConfirmInscribeTransfer, getInscribeResult} =
  //   useTapInscribeTransferHook();
  const {state} = location;

  const {txid, order, error} = state;

  const handleGoBack = () => {
    return navigate('/home');
  };

  const onClickDone = () => {
    navigate('/home');
  };

  if (!isEmpty(error) || isEmpty(order)) {
    return (
      <LayoutTap
        header={
          <UX.TextHeader text={'INSCRIBE FAILED'} onBackClick={handleGoBack} />
        }
        body={
          <UX.Box layout="column" style={{marginTop: '7rem'}} spacing="xl">
            <UX.Box layout="column_center" spacing="xl">
              <SVG.SendFailIcon />
              <UX.Text
                title="Payment Failed"
                styleType="heading_24"
                customStyles={{
                  marginTop: '16px',
                }}
              />
              <UX.Text
                title={error}
                styleType="body_16_normal"
                customStyles={{textAlign: 'center'}}
              />
            </UX.Box>
          </UX.Box>
        }
      />
    );
  }

  return (
    <LayoutTap
      header={<UX.TextHeader text={'INSCRIBE SUCCESS'} disableIconBack />}
      body={
        <UX.Box layout="column" style={{marginTop: '7rem'}} spacing="xl">
          <UX.Box layout="column_center" spacing="xl">
            <SVG.SendSuccessIcon />
            <UX.Text
              title="Payment Sent"
              styleType="heading_24"
              customStyles={{
                marginTop: '16px',
              }}
            />
            <UX.Text
              title={'Your transaction has been successfully sent'}
              styleType="body_16_normal"
              customStyles={{textAlign: 'center'}}
            />
          </UX.Box>
          <UX.Button
            styleType="text"
            title="View on block explorer"
            onClick={() => {
              const txLink = `${blockStreamURL}/tx/${txid}`;
              window.open(`${txLink}`);
            }}
          />
        </UX.Box>
      }
      footer={
        <UX.Box
          layout="column"
          spacing="xl"
          style={{
            padding: '10px 0',
          }}>
          <UX.Button styleType="primary" title={'Done'} onClick={onClickDone} />
        </UX.Box>
      }
    />
  );
};

export default InscribeResultScreen;
