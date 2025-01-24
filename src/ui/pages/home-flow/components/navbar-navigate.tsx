import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {useNavigate} from 'react-router-dom';

interface INavbar {
  isActive?: 'home' | 'dapp' | 'setting';
}
const Navbar = (props: INavbar) => {
  const navigate = useNavigate();
  const {isActive} = props;

  return (
    <UX.Box layout="row_between" style={{justifyContent: 'space-around'}}>
      <UX.Box
        onClick={() => navigate('/home')}
        layout="column_center"
        spacing="xss_s"
        style={{cursor: 'pointer'}}>
        <SVG.HomeIcon fillColor={isActive === 'home' ? '#D16B7C' : 'white'} />
        <UX.Text
          title="Home"
          styleType="body_12_normal"
          customStyles={{
            color: isActive === 'home' ? colors.main_500 : colors.white,
          }}
        />
      </UX.Box>
      <UX.Box
        onClick={() => navigate('/dapp')}
        layout="column_center"
        spacing="xss_s"
        style={{cursor: 'pointer'}}>
        <SVG.DappIcon fillColor={isActive === 'dapp' ? '#D16B7C' : 'white'} />
        <UX.Text
          title="Dapps"
          styleType="body_12_normal"
          customStyles={{
            color: isActive === 'dapp' ? colors.main_500 : colors.white,
          }}
        />
      </UX.Box>
      <UX.Box
        onClick={() => navigate('/setting')}
        layout="column_center"
        spacing="xss_s"
        style={{cursor: 'pointer'}}>
        <SVG.SettingNavBar
          color={isActive === 'setting' ? '#D16B7C' : 'white'}
        />
        <UX.Text
          title="Settings"
          styleType="body_12_normal"
          customStyles={{
            color: isActive === 'setting' ? colors.main_500 : colors.white,
          }}
        />
      </UX.Box>
    </UX.Box>
  );
};

export default Navbar;
