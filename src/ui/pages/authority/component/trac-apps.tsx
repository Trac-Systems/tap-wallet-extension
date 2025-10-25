import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { colors } from '@/src/ui/themes/color';
import { useTracAppsData } from '../hook/use-trac-apps-data';
import {
  ComponentState,
  SelectedApp,
} from '../hook/use-trac-apps-logic';
import { UX } from '@/src/ui/component';
import { SVG } from '@/src/ui/svg';
import CollapsibleList from './collapsible-list';
import ConfirmTracAppsModal, { TRAC_APPS_PERMITTED_TOKENS } from './confirm-trac-apps-modal'

export type TracApp = {
  title: string;
  icon: any;
  color: string;
};

interface TransferAppsProps {
  id: number;
  onUpdateState: (id: number, newState: Partial<ComponentState>) => void;
  selectedApp: SelectedApp;
  isExpanded: boolean;
  token: string;
}

const apps: TracApp[] = [
  {
    title: 'Hyperfun',
    icon: SVG.HyperfunIcon,
    color: colors.main_500,
  },
  {
    title: 'Hypermall',
    icon: SVG.HypermallIcon,
    color: colors.red_500,
  },
];

const TransferApps = ({
  id,
  onUpdateState,
  selectedApp,
  isExpanded,
  token,
}: TransferAppsProps) => {
  const [modalInputValue, setModalInputValue] = useState('');
  const [show, setShow] = useState(false);
  const { tracApps, setTracApps } = useTracAppsData();

  const modalOpen = useMemo(
    () => !!(selectedApp && !selectedApp.address),
    [selectedApp],
  );

  const handleConfirmation = useCallback(() => {
    if (!modalInputValue || !selectedApp) return;
    const { name } = selectedApp;
    switch (name) {
      case 'Hyperfun':
        setTracApps({ ...tracApps, hyperfunAddress: modalInputValue });
        break;
      case 'Hypermall':
        setTracApps({ ...tracApps, hypermallAddress: modalInputValue });
        break;
      default:
        break;
    }
    onUpdateState(id, {
      selectedApp: { name, address: modalInputValue },
    });
  }, [modalInputValue, selectedApp, setTracApps, onUpdateState, id, tracApps]);

  const handleAppSelection = useCallback(
    (item: TracApp) => {
      if (selectedApp?.name === item.title) {
        onUpdateState(id, { selectedApp: null });
      } else {
        onUpdateState(id, { selectedApp: { name: item.title, address: '' } });
        setShow(true);
      }
    },
    [selectedApp, onUpdateState, id],
  );

  const handleToggle = useCallback(() => {
    if (isExpanded) {
      onUpdateState(id, { isExpanded: false, selectedApp: null });
    } else {
      onUpdateState(id, { isExpanded: true });
    }
  }, [isExpanded, onUpdateState, id]);

  const renderHeaderComponent = useCallback(() => {
    return (
      <UX.Text
        title="Send to Apps"
        styleType="body_16_extra_bold"
        customStyles={{ color: 'white' }}
      />
    );
  }, []);

  const renderAppItem = useCallback(
    ({ item }: { item: TracApp }) => {

      const isDisabled = !token || 
        (token && item.title === 'Hyperfun' && !TRAC_APPS_PERMITTED_TOKENS.hyperfun.includes(token)) || 
        (token && item.title === 'Hypermall' && !TRAC_APPS_PERMITTED_TOKENS.hypermall.includes(token));

      return (
        <UX.Box
          key={item.title}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.greyRgba42,
            padding: '10px',
            borderRadius: '12px',
            marginRight: '8px',
            width: '120px',
            height: '60px',
            border:
              selectedApp?.name === item.title
                ? `1px solid ${item.color}`
                : '1px solid transparent',
            opacity: isDisabled ? 0.5 : 1,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            gap: 3
          }}
          onClick={() => !isDisabled && handleAppSelection(item)}
        >
          <item.icon />
          <UX.Text
            title={item.title}
            styleType="body_16_extra_bold"
            customStyles={{ color: 'white' }}
          />
        </UX.Box>
      );
    },
    [handleAppSelection, selectedApp, token],
  );

  useEffect(() => {
    onUpdateState(id, { selectedApp: null });
  }, [token, onUpdateState, id]);

  useEffect(() => {
    if (modalOpen) {
      setModalInputValue('');
      setShow(true);
    } else {
      setShow(false);
    }
  }, [modalOpen]);

  return (
    <UX.Box spacing="xl">
      <CollapsibleList
        isExpanded={isExpanded}
        setIsExpanded={handleToggle}
        headerComponent={renderHeaderComponent()}
        expandedData={apps}
        renderListItem={renderAppItem as any}
        containerStyle={{
          backgroundColor: colors.black_2,
          borderRadius: '10px',
          marginTop: '12px',
        }}
        expandedContentStyle={{
          paddingBottom: '12px',
          paddingLeft: '12px',
          paddingRight: '12px',
        }}
      />
      <ConfirmTracAppsModal
        visible={modalOpen}
        onModalHide={
          !modalInputValue
            ? () => onUpdateState(id, { selectedApp: null })
            : () => {}
        }
        modalInputValue={modalInputValue}
        setModalInputValue={setModalInputValue}
        text={`Saved Address - ${selectedApp?.name ?? ''}`}
        selectedApp={selectedApp}
        handleConfirmation={handleConfirmation}
        token={token}
      />
    </UX.Box>
  );
};

export default TransferApps;