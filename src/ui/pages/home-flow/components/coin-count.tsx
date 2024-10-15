import {UX} from '@/src/ui/component';

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
  const {
    ticker,
    balance,
    type,
    selected,
    inscriptionNumber,
    onClick,
  } = props;

  //! Function
  //! Render
  return (
    <UX.Box
      onClick={() => onClick()}
      style={{
        position: 'relative',
        width: '80px',
        borderRadius: '7px',
        overflow: 'hidden',
        border: selected ? '1px solid white' : '1px solid black',
      }}>
      <UX.Text
        title={ticker}
        styleType="body_14_bold"
        customStyles={{
          color: '#D16B7C',
          padding: '2px',
          position: 'absolute',
          left: 0,
          top: 0,
          background: '#545454',
          width: '70px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      />
      <UX.Box
        layout="column_center"
        style={{
          height: '80px',
          width: '100%',
          background: '#D16B7C',
        }}>
        <UX.Text
          title={type === 'DEPLOY' ? 'Deploy' : balance}
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
        }}
      />
    </UX.Box>
  );
};

export default CoinCount;
