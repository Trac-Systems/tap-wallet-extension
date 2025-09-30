// src/pages/home/hooks/use-transfer-apps-logic.ts

import {useState, useCallback} from 'react';

export type SelectedApp = {name: string; address: string} | null;

export type ComponentState = {
  isExpanded: boolean;
  selectedApp: SelectedApp;
};

export const TRAC_APPS_BITCOIN_ADDRESSES = {
  hyperfun: 'bc1pg0raefujxhtzac9hnkvmextu023tntgu0ldduj9crsaf3s3vtyhsc2ht9r',
  hypermall: 'bc1p5s46uu63wllwe0vr7um3k23kgak2lgc0np42fh4pn9j8vtwqseqs7ddg5e',
};

export const useTracAppsLogic = () => {
  const [componentStates, setComponentStates] = useState<
    Record<number, ComponentState>
  >({});

  const onUpdateState = useCallback(
    (id: number, newState: Partial<ComponentState>) => {
      setComponentStates(prevState => {
        const currentState = prevState[id] || {
          selectedApp: null,
          isExpanded: false,
        };

        // if selectedApp is passed, overwrite entirely
        const nextState: ComponentState = {
          ...currentState,
          ...newState,
          selectedApp: newState.hasOwnProperty('selectedApp')
            ? newState.selectedApp ?? null
            : currentState.selectedApp,
        };

        return {
          ...prevState,
          [id]: nextState,
        };
      });
    },
    [],
  );

  const getComponentState = useCallback(
    (id: number): ComponentState =>
      componentStates[id] || {
        selectedApp: null,
        isExpanded: false,
      },
    [componentStates],
  );

  return {
    onUpdateState,
    getComponentState,
  };
};
