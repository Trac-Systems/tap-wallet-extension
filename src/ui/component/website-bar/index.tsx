import {UX} from '..';
import CardApproval from '../card-approval';

const WebsiteBar = ({
  session,
}: {
  session: {origin: string; icon: string; name: string};
}) => {
  return (
    <CardApproval preset="style2" selfItemsCenter>
      <UX.Box layout="row_center" spacing="sm">
        {session.icon && (
          <img src={session.icon} alt="logo" style={{width: 32, height: 32}} />
        )}
        <UX.Text
          title={session.origin}
          styleType="body_14_bold"
          customStyles={{color: 'white'}}
        />
      </UX.Box>
    </CardApproval>
  );
};

export default WebsiteBar;
