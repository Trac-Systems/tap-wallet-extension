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
          <UX.TextHeader textKey="tap.inscribeFailed" onBackClick={handleGoBack} />
        }
        body={
          <UX.Box layout="column" style={{marginTop: '7rem'}} spacing="xl">
            <UX.Box layout="column_center" spacing="xl">
              <SVG.SendFailIcon />
              <UX.Text
                titleKey="transaction.paymentFailed"
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
      header={<UX.TextHeader textKey="tap.inscribeSuccess" disableIconBack />}
      body={
        <UX.Box layout="column" style={{marginTop: '7rem'}} spacing="xl">
          <UX.Box layout="column_center" spacing="xl">
            <SVG.SendSuccessIcon />
            <UX.Text
              titleKey="transaction.paymentSent"
              styleType="heading_24"
              customStyles={{
                marginTop: '16px',
              }}
            />
            <UX.Text
              titleKey="transaction.sentDescription"
              styleType="body_16_normal"
              customStyles={{textAlign: 'center'}}
            />
          </UX.Box>
          <UX.Button
            styleType="text"
            titleKey="transaction.viewOnBlockExplorer"
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
          <UX.Button styleType="primary" titleKey="common.done" onClick={onClickDone} />
        </UX.Box>
      }
    />
  );
};

export default InscribeResultScreen;
