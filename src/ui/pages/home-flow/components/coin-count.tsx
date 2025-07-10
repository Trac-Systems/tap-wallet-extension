import {UX} from '@/src/ui/component';
import { truncateMiddle } from '@/src/ui/utils';

interface ICoinCountProps {
  ticker: string;
  balance?: string;
  inscriptionNumber: number;
  timestamp?: number;
  type?: string;
  selected?: boolean;
  selectable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}
const CoinCount = (props: ICoinCountProps) => {
  //! State
  const {ticker, balance, type, selected, inscriptionNumber, onClick} = props;

  //! Function
  //! Render
  return (
    <UX.Box
      onClick={() => onClick()}
      style={{
        cursor: 'pointer',
        width: '80px',
        position: 'relative',
        borderRadius: '7px',
        overflow: 'hidden',
        border: selected ? '1px solid white' : '1px solid #545454',
      }}>

      <UX.Box
        layout="column_center"
        style={{
          height: '80px',
          width: '100%',
          // background: '#D16B7C',
        }}>
        <UX.Text
          title={type === 'DEPLOY' ? 'Deploy' : truncateMiddle(balance || '')}
          styleType="body_14_bold"
          customStyles={{color: 'white'}}
        />
      </UX.Box>
      <UX.Text
        title={`#${inscriptionNumber}`}
        styleType="body_14_normal"
        customStyles={{
          color: 'white',
          width: '100%',
          background: '#545454',
          padding: '4px 0',
          textAlign: 'center',
          position: 'relative',
        }}
      />
    </UX.Box>
  );
};

export default CoinCount;
