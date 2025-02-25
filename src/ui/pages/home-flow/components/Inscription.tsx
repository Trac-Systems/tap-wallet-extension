import {UX} from '@/src/ui/component';
import {Inscription} from '@/src/wallet-instance';
import DmtCollection from './dmt-collection';
import {InscriptionListChildren} from './Inscription-children';
interface IProps {
  setOpenDrawer: (data: boolean) => void;
  spendableInscriptionsMap: {[key: string]: Inscription};
  setSpendableInscriptionMap: (data: {[key: string]: Inscription}) => void;
}

const InscriptionList = (props: IProps) => {
  const tabItems = [
    {label: 'All', content: <InscriptionListChildren {...props} />},
    {
      label: 'DMT collectibles',
      content: <DmtCollection />,
    },
  ];

  return <UX.Tabs tabs={tabItems} isChildren parentIndex={1} />;
};

export default InscriptionList;
