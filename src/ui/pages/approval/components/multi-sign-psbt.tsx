import React, {useCallback, useEffect, useState} from 'react';
import LayoutApprove from '../layouts';
import WebsiteBar from '@/src/ui/component/website-bar';
import {UX} from '@/src/ui/component';
import {shortAddress} from '@/src/ui/helper';
import {useApproval} from '@/src/ui/pages/approval/hook';
import {TransactionSigningOptions, TxType} from '@/src/wallet-instance';
import {SignPsbt} from '@/src/ui/pages/approval/components';

interface Props {
  params: {
    data: {
      psbtHexs: string[];
      options: TransactionSigningOptions[];
    };
    session?: {
      origin: string;
      icon: string;
      name: string;
    };
  };
}
enum SignState {
  PENDING,
  SUCCESS,
  FAILED,
}

interface TxInfo {
  psbtHexs: string[];
  txError: string;
  currentIndex: number;
}
const initTxInfo: TxInfo = {
  psbtHexs: [],
  txError: '',
  currentIndex: 0,
};

const MultiSignPsbt = ({
  params: {
    data: {psbtHexs, options},
    session,
  },
}: Props) => {
  const [, resolveApproval, rejectApproval] = useApproval();
  const [txInfo, setTxInfo] = useState<TxInfo>(initTxInfo);
  const [viewingPsbtIndex, setViewingPsbtIndex] = useState(-1);
  const [signStates, setSignStates] = useState<SignState[]>(
    new Array(psbtHexs.length).fill(SignState.PENDING),
  );

  useEffect(() => {
    setTxInfo({
      psbtHexs,
      txError: '',
      currentIndex: 0,
    });
  }, []);
  const updateTxInfo = useCallback(
    (params: {currentIndex?: number}) => {
      setTxInfo(Object.assign({}, txInfo, params));
    },
    [txInfo, setTxInfo],
  );
  const handleCancel = () => {
    if (txInfo.currentIndex > 0) {
      updateTxInfo({
        currentIndex: txInfo.currentIndex - 1,
      });
      return;
    }
    rejectApproval();
  };

  const handleConfirm = () => {
    resolveApproval({
      psbtHexs: txInfo.psbtHexs,
    });
  };

  if (viewingPsbtIndex >= 0 && txInfo.psbtHexs) {
    return (
      <>
        <SignPsbt
          params={{
            data: {
              psbtHex: txInfo.psbtHexs[viewingPsbtIndex],
              type: TxType.SIGN_TX,
              options: options
                ? options[viewingPsbtIndex]
                : {autoFinalized: false},
            },
            session,
            customHandleCancel: () => {
              setViewingPsbtIndex(-1);
              signStates[viewingPsbtIndex] = SignState.FAILED;
              setSignStates(signStates);
            },
            customHandleConfirm: () => {
              setViewingPsbtIndex(-1);
              signStates[viewingPsbtIndex] = SignState.SUCCESS;
              setSignStates(signStates);
            },
            onBackClick: () => {
              setViewingPsbtIndex(-1);
            },
          }}
        />
      </>
    );
  }

  const signedCount = signStates.filter(v => v === SignState.SUCCESS).length;
  const isAllSigned = signedCount === txInfo.psbtHexs.length;

  return (
    <LayoutApprove
      header={<WebsiteBar session={session} />}
      body={
        <UX.Box layout="column_center" spacing="xl">
          <UX.Text
            title="sign multiple transactions"
            styleType="heading_14"
            customStyles={{textTransform: 'capitalize'}}
          />
          <UX.Box
            layout="column"
            style={{padding: '0 16px', flex: 1, width: '100%'}}
            spacing="xl">
            {psbtHexs.map((item, index) => {
              const signState = signStates[index];

              let text = 'View';
              if (signState == SignState.PENDING) {
                text = 'View';
              } else if (signState == SignState.SUCCESS) {
                text = 'Signed';
              } else if (signState == SignState.FAILED) {
                text = 'Rejected';
              }
              return (
                <UX.Box layout="box_border" key={index}>
                  <UX.Box layout="column" style={{flex: 1}}>
                    <UX.Text
                      title={`Transaction ${index + 1}`}
                      styleType="body_14_bold"
                    />
                    <UX.Text
                      title={shortAddress(item)}
                      styleType="body_12_normal"
                    />
                  </UX.Box>
                  <UX.Button
                    title={text}
                    styleType="primary"
                    customStyles={{width: 'fit-content'}}
                    onClick={() => setViewingPsbtIndex(index)}
                  />
                </UX.Box>
              );
            })}
          </UX.Box>
        </UX.Box>
      }
      footer={
        <UX.Box layout="row_center" spacing="sm">
          <UX.Button
            title="Reject all"
            styleType="dark"
            customStyles={{flex: 1}}
            onClick={handleCancel}
          />
          <UX.Button
            title={
              isAllSigned
                ? 'Submit'
                : `(${signedCount}/${txInfo.psbtHexs.length}) Signed`
            }
            styleType="primary"
            customStyles={{flex: 1}}
            isDisable={!isAllSigned}
            onClick={handleConfirm}
          />
        </UX.Box>
      }
    />
  );
};

export default MultiSignPsbt;
