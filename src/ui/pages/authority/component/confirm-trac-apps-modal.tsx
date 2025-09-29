import React, {useState, useEffect, useCallback} from 'react';
import {UX} from '@/src/ui/component';
import {SVG} from '@/src/ui/svg';
import {colors} from '@/src/ui/themes/color';
import {isEmpty} from 'lodash';
import {useTracAppsData} from '../hook/use-trac-apps-data';
import {SelectedApp} from '../hook/use-trac-apps-logic';
import { validateTracAppsAddress } from '@/src/ui/utils'
import Text from '@/src/ui/component/text-custom'


interface ConfirmDeleteWalletModalProps {
  visible: boolean;
  onModalHide: () => void;
  modalInputValue: string;
  setModalInputValue: (value: string) => void;
  text: string;
  selectedApp: SelectedApp;
  handleConfirmation: any;
  token: string;
}

export const TRAC_APPS_PERMITTED_TOKENS = {
  hyperfun: ['tap'],
  hypermall: ['tap', 'dmt-nat', 'tap-usdt', 'gib'],
};

const ConfirmTracAppsModal = ({
  visible,
  onModalHide,
  modalInputValue,
  setModalInputValue,
  text,
  selectedApp,
  handleConfirmation,
  token,
}: ConfirmDeleteWalletModalProps) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const {tracApps} = useTracAppsData();

  useEffect(() => {
    if (
      selectedApp?.name?.toLowerCase() === 'hypermall' &&
      !isEmpty(token)
    ) {
      const showConfirmation =
        !TRAC_APPS_PERMITTED_TOKENS.hypermall.includes(token);
      return setShowPrompt(showConfirmation);
    }
    setShowPrompt(false);
  }, [token, selectedApp, setShowPrompt]);

  const handleYes = useCallback(() => {
    setShowPrompt(false);
    handleConfirmation(); // Assuming 'Yes' should also confirm the action
  }, [handleConfirmation]);

  const handleNo = useCallback(() => {
    onModalHide();
  }, [onModalHide]);

  const handleMainAction = useCallback(() => {
    handleConfirmation();
  }, [handleConfirmation]);

  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
      }}>
      {showPrompt ? (
        <UX.Box
          style={{
            flexDirection: 'column',
            padding: '24px',
            backgroundColor: colors.black,
            width: '90%',
            maxWidth: '400px',
            borderRadius: '16px',
            textAlign: 'center',
          }}>
          <UX.Text
            styleType="body_16_extra_bold"
            customStyles={{color: colors.white}}
            title="Are you sure?"
          />
          <UX.Box
            style={{
              backgroundColor: colors.red_500,
              width: '48px',
              height: '48px',
              borderRadius: '24px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '16px auto',
            }}>
            <SVG.WaringIcon width={24} height={24} color={colors.white} />
          </UX.Box>
          <UX.Box
            layout="row_between"
            style={{
              justifyContent: 'space-around',
              marginTop: '12px',
            }}>
            <UX.Button
              styleType="secondary"
              title="No"
              onClick={handleNo}
              customStyles={{flex: 1, marginRight: '8px'}}
            />
            <UX.Button
              styleType="primary"
              title="Yes"
              onClick={handleYes}
              customStyles={{flex: 1, marginLeft: '8px'}}
            />
          </UX.Box>
        </UX.Box>
      ) : (
        <UX.Box
          style={{
            flexDirection: 'column',
            padding: '24px',
            backgroundColor: colors.black,
            width: '90%',
            maxWidth: '400px',
            borderRadius: '16px',
            textAlign: 'center',
            position: 'relative',
          }}>
          <UX.Text
            styleType="body_16_extra_bold"
            customStyles={{color: colors.white}}
            title={text}
          />
          <UX.Box
            onClick={onModalHide}
            style={{
              position: 'absolute',
              top: '24px',
              right: '20px',
              cursor: 'pointer',
            }}>
            <SVG.CloseIcon width={24} height={24} />
          </UX.Box>
          {!isEmpty(selectedApp?.name) && (
          <UX.Box
            style={{
              backgroundColor: colors.gray,
              width: '48px',
              height: '48px',
              borderRadius: '24px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '16px auto',
            }}>
            {selectedApp?.name.toLocaleLowerCase() === 'hyperfun' ? 
              <SVG.HyperfunIcon /> : 
              <SVG.HypermallIcon />}
          </UX.Box>

          )}
          <UX.Input
            value={modalInputValue}
            onChange={e => setModalInputValue(e.target.value)}
            placeholder="Enter address"
          />
          
          <Text
              title="Invalid address"
              styleType="body_14_bold"
              customStyles={{ color: colors.red_500, marginTop: '4px', visibility: modalInputValue !== "" && !validateTracAppsAddress(modalInputValue) ? "visible" : "hidden"  }}
          />
          {(selectedApp?.name === 'Hyperfun' && !isEmpty(tracApps.hyperfunAddress)) ||
          (selectedApp?.name === 'Hypermall' && !isEmpty(tracApps.hypermallAddress)) ? (
            <UX.Box style={{marginTop: '6px'}}>
              <UX.Box
                onClick={() =>
                  setModalInputValue(
                    selectedApp?.name === 'Hyperfun'
                      ? tracApps.hyperfunAddress
                      : tracApps.hypermallAddress,
                  )
                }
                style={{
                  cursor: 'pointer',
                  textDecoration: "underline",
                }}>
                <UX.Text
                  styleType="body_14_bold"
                  customStyles={{color: colors.white}}
                  title="Use Saved Address"
                />
              </UX.Box>
            </UX.Box>
          ) : null}
          <UX.Button
            styleType="primary"
            title="Confirm"
            onClick={handleMainAction}
            isDisable={!validateTracAppsAddress(modalInputValue)}
            customStyles={{marginTop: '12px'}}
          />
        </UX.Box>
      )}
    </div>
  );
};

export default ConfirmTracAppsModal;