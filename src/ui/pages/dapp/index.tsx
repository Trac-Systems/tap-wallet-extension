import {useNavigate} from 'react-router-dom';
import {UX} from '../../component';
import {SVG} from '../../svg';
import Navbar from '../home-flow/components/navbar-navigate';
import LayoutScreenSettings from '../../layouts/settings';
import {useAppSelector} from '../../utils';
import {GlobalSelector} from '../../redux/reducer/global/selector';
import {NETWORK_TYPES} from '@/src/wallet-instance';

const dappList = [
  {
    logo: './images/inscribe-logo.png',
    title: 'Inscribe',
    desc: 'TaparooInscriber',
    link: 'https://inscribe.taparooswap.com/',
  },
  {
    logo: './images/market-logo.png',
    title: 'Market',
    desc: 'TaparooMarket',
    link: 'https://market.taparooswap.com/',
  },
  {
    logo: './images/swap-logo.png',
    title: 'Swap',
    desc: 'TaparooSwap',
    link: 'https://swap.taparooswap.com/',
  },
  {
    logo: './images/bridge-logo.png',
    title: 'Bridge',
    desc: 'TaparooBridge',
    link: 'https://bridge.taparooswap.com/',
  },
  {
    logo: './images/tapalytics.png',
    title: 'Tapalytics',
    desc: 'Tapalytics',
    link: 'https://www.tapalytics.xyz/',
  },
];

const DappPage = () => {
  const navigate = useNavigate();
  const networkType = useAppSelector(GlobalSelector.networkType);
  const checkMainNetwork =
    networkType === NETWORK_TYPES.MAINNET.label ? true : false;

  return (
    <LayoutScreenSettings
      header={<UX.TextHeader text="Dapps" disableIconBack />}
      body={
        <UX.Box
          layout="column_center"
          spacing="xl"
          style={{margin: '0 24px 16px 24px'}}>
          <UX.Box style={{width: '100%'}} spacing="xl">
            {checkMainNetwork ? (
              dappList.map(item => {
                if (!item.title || !item.link) {
                  return;
                }

                return (
                  <UX.Box
                    key={item.title}
                    layout="box_border"
                    style={{cursor: 'pointer'}}
                    onClick={() => window.open(item.link, '_blank')}>
                    <UX.Box
                      style={{flexDirection: 'row', alignItems: 'center'}}>
                      <img
                        src={item.logo}
                        width={60}
                        height={60}
                        style={{
                          borderRadius: '30px',
                        }}
                      />
                      <UX.Box style={{paddingLeft: '10px'}}>
                        <UX.Text
                          title={item.title}
                          styleType="body_16_bold"
                          customStyles={{color: 'white'}}
                        />
                        {item.desc ? (
                          <UX.Text
                            title={item.desc}
                            styleType="body_12_normal"
                          />
                        ) : null}
                      </UX.Box>
                    </UX.Box>
                    <SVG.ArrowIconRight />
                  </UX.Box>
                );
              })
            ) : (
              <UX.Box>
                <UX.Text
                  title={'Please change network to LIVENET'}
                  styleType="body_16_bold"
                  customStyles={{color: 'white', marginBottom: '20px'}}
                />
                <UX.Button
                  styleType="text"
                  title="Go to network setting"
                  onClick={() => {
                    navigate('/setting/network-type');
                  }}
                />
              </UX.Box>
            )}
          </UX.Box>
        </UX.Box>
      }
      footer={<Navbar isActive="dapp" />}
    />
  );
};

export default DappPage;
