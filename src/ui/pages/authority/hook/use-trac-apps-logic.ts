// src/pages/home/hooks/use-transfer-apps-logic.ts

import {useState, useCallback} from 'react';

export type SelectedApp = {name: string; address: string} | null;

export type ComponentState = {
  isExpanded: boolean;
  selectedApp: SelectedApp;
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
