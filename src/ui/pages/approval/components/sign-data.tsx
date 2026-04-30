import {useEffect, useState} from 'react';
import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import {useApproval} from '../hook';
import {useWalletProvider} from '../../../gateway/wallet-provider';
import WebsiteBar from '../../../component/website-bar';
import {copyToClipboard} from '../../../helper';
import {useCustomToast} from '../../../component/toast-custom';
import LayoutApprove from '../layouts';
import {useI18n} from '@/src/ui/i18n';

interface Props {
  params: {
    data: {
      data: string;
    };
    session: {
      origin: string;
      icon: string;
      name: string;
    };
  };
}

export default function SignData({params: {data, session}}: Props) {
  const [getApproval, resolveApproval, rejectApproval] = useApproval();
  const {showToast} = useCustomToast();
  const {t} = useI18n();
  const agreementText = t('approval.signData.agreementText');

  const handleCancel = () => {
    rejectApproval();
  };

  const handleConfirm = () => {
    resolveApproval();
  };

  const wallet = useWalletProvider();
  const [ready, setReady] = useState(false);
  const [enableSignData, setEnableSignData] = useState(false);
  useEffect(() => {
    wallet
      .getEnableSignData()
      .then(enable => {
        setEnableSignData(enable);
      })
      .finally(() => {
        setReady(true);
      });
  }, []);

  const [inputValue, setInputValue] = useState('');
  const [understand, setUnderstand] = useState(false);
  useEffect(() => {
    if (inputValue === agreementText) {
      setUnderstand(true);
    } else {
      setUnderstand(false);
    }
  }, [inputValue, agreementText]);

  if (!ready) {
    return (
      <UX.Box layout="column_center" style={{height: '100vh'}}>
        <SVG.LoadingIcon />
      </UX.Box>
    );
  }

  if (!enableSignData) {
    return (
      <LayoutApprove
        header={<WebsiteBar session={session} />}
        body={
          <UX.Box spacing="sm" style={{flex: 1}}>
            <UX.Text
              titleKey="approval.signData.title"
              customStyles={{color: 'white', textAlign: 'center'}}
              styleType="body_14_bold"
            />

            <UX.Text
              titleKey="approval.signData.enableInSettings"
              customStyles={{textAlign: 'center'}}
              styleType="body_14_normal"
            />
          </UX.Box>
        }
        footer={
          <UX.Button titleKey="common.reject" styleType="dark" onClick={handleCancel} />
        }
      />
    );
  }

  return (
    <LayoutApprove
      header={<WebsiteBar session={session} />}
      body={
        <UX.Box spacing="sm" style={{flex: 1}}>
          <UX.Text
            titleKey="approval.signatureRequest.title"
            customStyles={{color: 'white', textAlign: 'center'}}
            styleType="body_14_bold"
          />

          <UX.Text
            titleKey="approval.signData.youAreSigningData"
            customStyles={{textAlign: 'center'}}
            styleType="body_14_normal"
          />

          <UX.Box
            layout="box"
            style={{justifyContent: 'center', alignItems: 'center'}}>
            <div
              style={{
                userSelect: 'text',
                maxHeight: 384,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                flexWrap: 'wrap',
              }}>
              {data.data}
            </div>
          </UX.Box>

          <UX.Text
            customStyles={{color: 'yellow', textAlign: 'center'}}
            styleType="body_12_bold"
            titleKey="approval.signData.riskWarning"
          />
          <UX.Box
            layout="box"
            onClick={() => {
              copyToClipboard(agreementText).then(() => {
                showToast({
                  type: 'copied',
                  titleKey: 'common.copied',
                });
              });
            }}>
            <UX.Text
              titleKey="approval.signData.enterAgreement"
              titleParams={{agreementText}}
              styleType="body_14_normal"
              customStyles={{color: 'white', textAlign: 'center'}}
            />
            <SVG.CopyPink color="#FFFFFFB0" />
          </UX.Box>
          <UX.Input
            autoFocus={true}
            onChange={e => {
              setInputValue(e.target.value);
            }}
          />
        </UX.Box>
      }
      footer={
        <UX.Box layout="row">
          <UX.Button
            titleKey="common.reject"
            customStyles={{flex: 1}}
            styleType="dark"
            onClick={handleCancel}
          />
          <UX.Button
            customStyles={{flex: 1}}
            titleKey="common.sign"
            styleType="primary"
            onClick={handleConfirm}
            isDisable={!understand}
          />
        </UX.Box>
      }
    />
  );
}
