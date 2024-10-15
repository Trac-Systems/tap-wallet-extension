import {useEffect, useState} from 'react';
import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import {useApproval} from '../hook';
import {useWalletProvider} from '../../../gateway/wallet-provider';
import WebsiteBar from '../../../component/website-bar';
import {copyToClipboard} from '../../../helper';
import {useCustomToast} from '../../../component/toast-custom';
import LayoutApprove from '../layouts';

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

const AGREEMENT_TEXT = 'I only sign what I understand';
export default function SignData({params: {data, session}}: Props) {
  const [getApproval, resolveApproval, rejectApproval] = useApproval();
  const {showToast} = useCustomToast();

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
    if (inputValue === AGREEMENT_TEXT) {
      setUnderstand(true);
    } else {
      setUnderstand(false);
    }
  }, [inputValue]);

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
              title="Sign Data request"
              customStyles={{color: 'white', textAlign: 'center'}}
              styleType="body_14_bold"
            />

            <UX.Text
              title={
                'You need to enable the signData request feature in Settings -> Advanced to continue.'
              }
              customStyles={{textAlign: 'center'}}
              styleType="body_14_normal"
            />
          </UX.Box>
        }
        footer={
          <UX.Button title="Reject" styleType="dark" onClick={handleCancel} />
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
            title="Signature request"
            customStyles={{color: 'white', textAlign: 'center'}}
            styleType="body_14_bold"
          />

          <UX.Text
            title="You are signing data:"
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
            title={
              'Only sign this message if you fully understand the content and trust the requesting site. Or you could be agreeing to give away your funds and NFTs.'
            }
          />
          <UX.Box
            layout="box"
            onClick={() => {
              copyToClipboard(AGREEMENT_TEXT).then(() => {
                showToast({
                  type: 'copied',
                  title: 'Copied',
                });
              });
            }}>
            <UX.Text
              title={`Enter “${AGREEMENT_TEXT}” to continue`}
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
            title="Reject"
            customStyles={{flex: 1}}
            styleType="dark"
            onClick={handleCancel}
          />
          <UX.Button
            customStyles={{flex: 1}}
            title="Sign"
            styleType="primary"
            onClick={handleConfirm}
            isDisable={!understand}
          />
        </UX.Box>
      }
    />
  );
}
