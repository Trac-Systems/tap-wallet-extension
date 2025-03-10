import {UX} from '@/src/ui/component';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';
import {
  useAppSelector,
  TOKEN_PAGE_SIZE,
  generateUniqueColors,
} from '@/src/ui/utils';
import {isEmpty} from 'lodash';
import {useEffect, useMemo, useRef, useState} from 'react';

const DmtCollection = () => {

  //! State
  const dmtGroupMap = useAppSelector(AccountSelector.dmtGroupMap);
  const randomColors = useAppSelector(GlobalSelector.randomColors);
  const [showDetailItemId, setShowDetailItemId] = useState(null);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  // const prevTapItemRef = useRef(tapItemTemp);


  const listRandomColor: string[] = useMemo(() => {
    if (!isEmpty(randomColors)) {
      return randomColors;
    } else {
      return generateUniqueColors(TOKEN_PAGE_SIZE);
    }
  }, [randomColors]);

  const handleClickOutside = (event: MouseEvent) => {
    if (showDetailItemId !== null) {
      const clickedOutside = !cardRefs.current[showDetailItemId]?.contains(
        event.target as Node,
      );
      if (clickedOutside) {
        setShowDetailItemId(null);
      }
    }
  };

  // const handleNavigate = (tokenBalance: TokenBalance) => {
  //   navigate('/home/list-tap-options', {
  //     state: {brcTokenBalance: tokenBalance},
  //   });
  // };

  //! Effect function
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetailItemId]);


  //! Render
  return (
    <UX.Box spacing="xl" style={{marginTop: '16px'}}>
      {Object.entries(dmtGroupMap).map(([k, v], index) => {
        const indexCheck = index < 20 ? index : index % 20;
        const tagColor = listRandomColor[indexCheck];
        return (
          <UX.TapDmtGroupItem
            ticker={v.ticker}
            contentInscriptionId={k}
            key={index}
            // handleNavigate={() => handleNavigate(v)}
            tagColor={tagColor}
          />
        );
      })}
    </UX.Box>
  );
};

export default DmtCollection;
