import {UX} from '@/src/ui/component';
import {Network} from '@/src/wallet-instance';
import {useApproval} from '../hook';
import WebsiteBar from '../../../component/website-bar';
import {useAppSelector} from '../../../utils';
import {GlobalSelector} from '../../../redux/reducer/global/selector';
import LayoutApprove from '../layouts';

interface Props {
  params: {
    data: {
      networkType: Network;
    };
    session: {
      origin: string;
      icon: string;
      name: string;
    };
  };
}

export default function SwitchNetwork({params: {data, session}}: Props) {
  const networkType = useAppSelector(GlobalSelector.networkType);
  const from = networkType;
  const to = data.networkType;

  const [, resolveApproval, rejectApproval] = useApproval();

  const handleCancel = () => {
    rejectApproval('User rejected the request.');
  };

  const handleConnect = async () => {
    resolveApproval();
  };

  return (
    <LayoutApprove
      header={<WebsiteBar session={session} />}
      body={
        <UX.Box spacing="xl">
          <UX.Text
            title="Allow this site to switch network?"
            customStyles={{textAlign: 'center'}}
            styleType="heading_14"
          />

          <UX.Box layout="row_between" style={{padding: '0 16px'}}>
            <UX.Box layout="box">
              <UX.Text
                title={from}
                styleType="body_16_bold"
                customStyles={{color: 'white'}}
              />
            </UX.Box>
            <UX.Text
              title=">"
              styleType="body_16_bold"
              customStyles={{color: 'white'}}
            />
            <UX.Box layout="box">
              <UX.Text
                title={to}
                styleType="body_16_bold"
                customStyles={{color: 'white'}}
              />
            </UX.Box>
          </UX.Box>
        </UX.Box>
      }
      footer={
        <UX.Box layout="row" spacing="sm">
          <UX.Button
            title="Cancel"
            styleType="dark"
            onClick={handleCancel}
            customStyles={{flex: 1}}
          />
          <UX.Button
            title="Switch Network"
            styleType="primary"
            onClick={handleConnect}
            customStyles={{flex: 1}}
          />
        </UX.Box>
      }
    />
  );
}
