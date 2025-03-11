import {UX} from '@/src/ui/component';
import {AccountSelector} from '@/src/ui/redux/reducer/account/selector';
import {GlobalSelector} from '@/src/ui/redux/reducer/global/selector';
import {SVG} from '@/src/ui/svg';
import {
  useAppSelector,
  TOKEN_PAGE_SIZE,
  generateUniqueColors,
} from '@/src/ui/utils';
import {debounce, isEmpty} from 'lodash';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

const DmtCollection = () => {
  //! State
  const dmtGroupMap = useAppSelector(AccountSelector.dmtGroupMap);
  const randomColors = useAppSelector(GlobalSelector.randomColors);
  const [showDetailItemId, setShowDetailItemId] = useState(null);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [insValue, setInsValue] = useState('');
  const [dmtGroupMapList, setDmtGroupMapList] = useState(
    Object.entries(dmtGroupMap),
  );
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

  const debouncedFetch = useCallback(
    debounce((value: string) => {
      const filteredData = Object.entries(dmtGroupMap).filter(([_, data]) =>
        data.ticker.toLowerCase().includes(value.toLowerCase()),
      );
      setDmtGroupMapList(filteredData);
    }, 400),
    [],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInsValue(e.target.value);
    debouncedFetch(e.target.value);
  };

  //! Effect function
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetailItemId]);

  useEffect(() => {
    return () => {
      debouncedFetch.cancel();
    };
  }, []);

  //! Render
  return (
    <UX.Box spacing="xl" style={{marginTop: '16px'}}>
      <UX.Box layout="row" spacing="xs" className="search-box-token">
        <SVG.SearchIcon />
        <input
          placeholder="Search for DMT collection"
          className="search-box-token-input"
          onChange={handleChange}
          value={insValue}
        />
      </UX.Box>
      {dmtGroupMapList.map(([k, v], index) => {
        const indexCheck = index < 20 ? index : index % 20;
        const tagColor = listRandomColor[indexCheck];
        return (
          <UX.TapDmtGroupItem
            ticker={v.ticker}
            contentInscriptionId={k}
            key={index}
            tagColor={tagColor}
          />
        );
      })}
    </UX.Box>
  );
};

export default DmtCollection;
