import {useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import LayoutScreenSettings from '../../layouts/settings';
import Navbar from '../home-flow/components/navbar-navigate';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {useEffect, useState} from 'react';
import {ConnectedSite} from '@/src/background/service/permission.service';
import {SVG} from '../../svg';

const ConnectSite = () => {
  //! State
  const navigate = useNavigate();
  const wallet = useWalletProvider();
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
  //! Function

  //! Render
  return (
    <LayoutScreenSettings
      header={
        <UX.Box style={{padding: '0 24px'}}>
          <UX.TextHeader
            text="Connect Sites"
            onBackClick={() => navigate('/setting')}
          />
        </UX.Box>
      }
      body={
        sites.length > 0 ? (
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
        ) : (
          <UX.Text
            title="No connection"
            styleType="body_16_bold"
            customStyles={{margin: 'auto'}}
          />
        )
      }
      footer={<Navbar />}
    />
  );
};

export default ConnectSite;
