import {useEffect, useState} from 'react';

import {UX} from '@/src/ui/component';
import {useWalletProvider} from '@/src/ui/gateway/wallet-provider';
import {ConnectedSite} from '@/src/background/service/permission.service';
import {useNavigate} from 'react-router-dom';
import LayoutApprove from './layouts';
import {SVG} from '../../svg';

export default function ConnectedSitesScreen() {
  const wallet = useWalletProvider();
  const navigate = useNavigate();
  const [sites, setSites] = useState<ConnectedSite[]>([]);

  const getSites = async () => {
    const sites = await wallet.getConnectedSites();
    setSites(sites);
  };

  useEffect(() => {
    getSites();
  }, []);

  const handleRemove = async (origin: string) => {
    await wallet.removeConnectedSite(origin);
    getSites();
  };

  return (
    <LayoutApprove
      header={
        <UX.TextHeader
          onBackClick={() => {
            navigate(-1);
          }}
          text="Connected Sites"
        />
      }
      body={
        <UX.Box spacing="xl">
          {sites.length > 0 ? (
            sites.map(item => {
              return (
                <UX.Box
                  layout="box_border"
                  key={item.origin}
                  style={{margin: '0 24px'}}>
                  <UX.Box layout="row_between" style={{flex: 1}}>
                    <UX.Box layout="row_center" spacing="sm">
                      <img src={item.icon} width={30} />
                      <UX.Text
                        title={item.origin}
                        styleType="body_14_bold"
                        customStyles={{
                          color: 'white',
                        }}
                      />
                    </UX.Box>
                    <UX.Box
                      layout="column_center"
                      style={{cursor: 'pointer'}}
                      onClick={() => {
                        handleRemove(item.origin);
                      }}>
                      <SVG.CloseIcon color="#fff" />
                    </UX.Box>
                  </UX.Box>
                </UX.Box>
              );
            })
          ) : (
            <></>
          )}
        </UX.Box>
      }
    />
  );
}
