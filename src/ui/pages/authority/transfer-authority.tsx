import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UX } from '../../component';
import LayoutSendReceive from '../../layouts/send-receive';
import { SVG } from '../../svg';
import { colors } from '../../themes/color';
import { FeeRateBar } from '../send-receive/component/fee-rate-bar';
import { useAppSelector, validateBtcAddress } from '../../utils';
import { InscriptionSelector } from '../../redux/reducer/inscription/selector';
import Text from '../../component/text-custom';
import { GlobalSelector } from '../../redux/reducer/global/selector';
import { useWalletProvider } from '../../gateway/wallet-provider';
import { AccountSelector } from '../../redux/reducer/account/selector';
import { usePrepareSendBTCCallback } from '../send-receive/hook';
import { useCustomToast } from '../../component/toast-custom';
import { InscribeOrder, InscriptionOrdClient, OrderType, TappingStatus } from '@/src/wallet-instance/types';
import CloseIcon from '../../svg/CloseIcon';
import { calculateAmount } from '@/src/shared/utils/btc-helper';
import { useTokenInfo } from '../home-flow/hook';
import TransferApps from './component/trac-apps'
import { useTracAppsLogic } from './hook/use-trac-apps-logic'

export const TRAC_APPS_BITCOIN_ADDRESSES = {
  hyperfun: 'bc1pg0raefujxhtzac9hnkvmextu023tntgu0ldduj9crsaf3s3vtyhsc2ht9r',
  hypermall: 'bc1p5s46uu63wllwe0vr7um3k23kgak2lgc0np42fh4pn9j8vtwqseqs7ddg5e',
};

const TokenSection = ({ 
  section, 
  listTapList, 
  getTokenInfoAndStore, 
  setTokenSections, 
  onAmountChange, 
  onAddressChange, 
  onUpdateState, 
  getComponentState,
  validateSection,
  updateTokenSectionErrors,
  isSubmitted, // <--- NEW PROP
}) => {
  const selectedOption = listTapList.find(
    option => option.value === section.selected,
  );
  const amount = selectedOption?.amount || 0;

  useEffect(() => {
    if (section.selected) {
      getTokenInfoAndStore(section.selected);
    }
  }, [section.selected, getTokenInfoAndStore]);

  const {isExpanded, selectedApp} = getComponentState(section.id);
  
  // Effect to 'listen' to TransferApp state changes and run validation
  useEffect(() => {
    const errors = validateSection(section);
    updateTokenSectionErrors(section.id, errors);
  }, [isExpanded, selectedApp, validateSection, updateTokenSectionErrors, section]);
  

  return (
    <UX.Box spacing="xl" style={{ width: '100%' }} key={section.id}>
      <UX.Box spacing="xss">
        <UX.Text
          title="Token name"
          styleType="body_16_extra_bold"
          customStyles={{ color: 'white' }}
        />
        <UX.Dropdown
          options={listTapList}
          value={section.selected}
          onChange={val => {
            setTokenSections(prev => {
              const newSections = [...prev];
              return newSections.map(item => {
                if (item.id === section.id) {
                  return {
                    ...section,
                    selected: val,
                    amount: '',
                    errorAmount: '',
                    errorAddress: '',
                    address: '',
                  };
                }
                return item;
              });
            });
          }}
        />
        {section.selected && (
          <UX.Box layout="row_between">
            <UX.Text title="Available:" styleType="body_14_bold" />
            <UX.Text
              title={`${amount} ${section.selected}`}
              styleType="body_14_bold"
              customStyles={{ color: colors.green_500 }}
            />
          </UX.Box>
        )}
      </UX.Box>
      <UX.Box spacing="xss">
        <UX.Text
          title="Amount"
          styleType="body_16_extra_bold"
          customStyles={{ color: 'white' }}
        />
        <UX.AmountInput
          style={{
            fontSize: '20px',
            lineHeight: '28px',
            background: 'transparent',
          }}
          disableCoinSvg
          onChange={e => {
            const val = e?.target?.value;
            const cleanText = val?.toString()?.replace(/[,a-zA-Z]/g, '');
            onAmountChange(section, cleanText);
          }}
          value={section?.amount?.toString()}
          onAmountInputChange={() => {}}
        />
        {/* ONLY DISPLAY ERROR IF THE FORM HAS BEEN SUBMITTED */}
        {section.errorAmount && isSubmitted && (
          <Text
            title={section.errorAmount}
            styleType="body_14_bold"
            customStyles={{ color: colors.red_500, marginTop: '4px' }}
          />
        )}
      </UX.Box>

      {!isExpanded && (
        <UX.Box spacing="xss">
          <UX.Text
            title="Receiver"
            styleType="body_16_extra_bold"
            customStyles={{ color: 'white' }}
          />
          <UX.Input
            placeholder="Receiver address"
            style={{
              fontSize: '16px',
              border: 'none',
              padding: '9px 16px',
              background: 'transparent',
            }}
            value={section?.address}
            onChange={e => {
              onAddressChange(section.id, e?.target?.value);
            }}
          />
        </UX.Box>
      )}

      <TransferApps 
        id={section.id} isExpanded={isExpanded} 
        onUpdateState={onUpdateState} 
        selectedApp={selectedApp} 
        token={section.selected}  />

      {/* ONLY DISPLAY ERROR IF THE FORM HAS BEEN SUBMITTED */}
      {section.errorAddress && isSubmitted && (
        <Text
          title={section.errorAddress}
          styleType="body_14_bold"
          customStyles={{ color: colors.red_500, marginTop: '4px' }}
        />
      )}
    </UX.Box>
  );
};

const TransferAuthority = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const walletProvider = useWalletProvider();
  const { showToast } = useCustomToast();
  const { state } = location;
  const ticker = state?.ticker;
  const [feeRate, setFeeRate] = useState('');
  const [tokenSections, setTokenSections] = useState([
    {
      id: 1,
      selected: ticker,
      amount: '',
      address: '',
      errorAmount: '',
      errorAddress: '',
    },
  ]);
  const [listTapList, setListTapList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isWaitingCancel, setIsWaitingCancel] = useState(false);
  const [inscriptionInfo, setInscriptionInfo] =
    useState<InscriptionOrdClient | null>(null);

  const [isSubmitted, setIsSubmitted] = useState(false); // <--- NEW STATE

  const tapList = useAppSelector(InscriptionSelector.listTapToken);
  const tokenInfoMap = useAppSelector(state => state.inscriptionReducer.tokenInfoMap);
  const { getTokenInfoAndStore } = useTokenInfo();
  const networkType = useAppSelector(GlobalSelector.networkType);
  const currentAuthority = useAppSelector(AccountSelector.currentAuthority);
  const auth = currentAuthority?.ins;
  const activeAccount = useAppSelector(AccountSelector.activeAccount);
  const prepareSendBTC = usePrepareSendBTCCallback();
  const tokens = currentAuthority?.auth || [];
  const order = state?.order as InscribeOrder;

  const inscriptionId = state?.inscriptionId || currentAuthority?.ins;
  const inscriptionStatus = useMemo(() => {
    if (
      Array.isArray(auth) ||
      currentAuthority?.ins === inscriptionId ||
      inscriptionInfo?.id === currentAuthority?.ins
    ) {
      return 'TAPPED';
    }

    if (order?.tappingStatus === TappingStatus.TAPPING) {
      return 'TAPPING';
    }
    const satpointTxid = inscriptionInfo?.satpoint?.split(':')[0];
    const inscriptionTxid = inscriptionId?.split('i')[0];

    if (inscriptionInfo?.height === 0) {
      return satpointTxid === inscriptionTxid ? 'UNCONFIRMED' : 'TAPPING';
    } else {
      return satpointTxid === inscriptionTxid ? 'CONFIRMED' : 'TAPPING';
    }
  }, [auth, inscriptionInfo]);

  const {onUpdateState, getComponentState} = useTracAppsLogic()

  // get token info
  useEffect(() => {
    const getTokenInfo = async () => {
      const ins = await walletProvider.getInscriptionInfoOrdClient(inscriptionId);
      setInscriptionInfo(ins);
    };
    if (inscriptionId) {
      try {
        setLoading(true);
        getTokenInfo();
      } catch (error) {
        console.log('error :>> ', error);
      } finally {
        setLoading(false);
      }
    }
  }, [inscriptionId]);

  // get cancel authority order
  useEffect(() => {
    if (inscriptionStatus === 'TAPPED') {
      const getCancelAuthority = async () => {
        const order = await walletProvider.getCancelAuthority(inscriptionId);
        if (order) {
          setIsWaitingCancel(true);
        }
      };
      getCancelAuthority();
    }
  }, [inscriptionId, inscriptionStatus]);

  useEffect(() => {
    if(tapList?.length === 0) {
      return;
    }
    const listTapList = tapList.map(item => {
      const tokenInfo = tokenInfoMap[item.ticker];
      if(!tokenInfo) {
        return {
          label: item.ticker,
          value: item.ticker,
          amount: null,
        };
      }
      const overallBalance = calculateAmount(item.overallBalance, tokenInfo.dec);
      const transferableBalance = calculateAmount(item.transferableBalance, tokenInfo.dec);
      return {
        label: item.ticker,
        value: item.ticker,
        amount: Number(overallBalance || 0) - Number(transferableBalance || 0),
      };
    });

    if (!tokens.length) {
      setListTapList(listTapList);
    } else {
      const filteredTapList = listTapList.filter(item =>
        tokens?.includes(item.value),
      );
      setListTapList(filteredTapList);
    }
  }, [tapList, tokens, tokenInfoMap]);

  // Validation logic extracted and memoized
  const validateSection = useCallback((sectionToValidate) => {
    // 1. Amount error
    let errorAmount = '';
    
    // Check if a token is selected
    if (!sectionToValidate.selected) {
        errorAmount = 'Token name is required';
    } else if (!sectionToValidate.amount) {
      errorAmount = 'Amount is required';
    } else {
      // Check if amount exceeds available balance
      const selectedOption = listTapList.find(
        option => option.value === sectionToValidate.selected,
      );
      const optionAmount = selectedOption?.amount || 0;
      
      // Calculate amount used in other sections for the same token
      const selectedAmount = tokenSections.reduce((acc, item) => {
        if (item.id !== sectionToValidate.id && item.selected === sectionToValidate.selected && !isNaN(Number(item.amount))) {
          return acc + Number(item.amount || 0);
        }
        return acc;
      }, 0);
      
      const availableAmount = Number(optionAmount || 0) - Number(selectedAmount || 0);

      if (Number(sectionToValidate.amount) > Number(availableAmount)) {
        errorAmount = 'Amount exceeds your available balance';
      } else {
        errorAmount = ''; // Clear if checks pass
      }
    }

    // 2. Address error
    let errorAddress = '';
    const { isExpanded, selectedApp } = getComponentState(sectionToValidate.id);

    // A. Transfer App is selected (isExpanded is true)
    if (isExpanded) {
      if (!selectedApp?.address) {
        errorAddress = 'Transfer app is required';
      } else {
        errorAddress = ''; // CLEAR error
      }
    }
    // B. Manual Address is used (isExpanded is false)
    else {
      if (!sectionToValidate.address) {
        errorAddress = 'Receiver address is required';
      } else {
        const isValid = validateBtcAddress(sectionToValidate.address, networkType);
        if (!isValid) {
          errorAddress = 'Receiver address is invalid';
        } else {
          errorAddress = ''; // CLEAR error
        }
      }
    }
    
    return { errorAmount, errorAddress };
  }, [getComponentState, listTapList, networkType, tokenSections]); 
  
  // Function to update section errors from child component (memoized)
  const updateTokenSectionErrors = useCallback((id: number, newErrors: {errorAmount: string, errorAddress: string}) => {
     setTokenSections(prev => {
        return prev.map(section => {
            if (section.id === id) {
                return { ...section, ...newErrors };
            }
            return section;
        });
    });
  }, []); 

  const handleConfirm = async () => {
    // 1. Set the submission flag to true to start displaying errors
    setIsSubmitted(true);
    
    // 2. Run full validation. This updates the state with all final errors.
    const isValid = isValidForm(); 
    
    if (!isValid) {
      return;
    }
    setLoading(true);

    try {
      const items = tokenSections.map((item, index) => {
        const { isExpanded, selectedApp } = getComponentState(item.id);
        const baseItem = {
          tick: item.selected,
          amt: item.amount?.toString(),
        };

        if (isExpanded && selectedApp?.address) {
          // Hyperfun or Hypermall
          const dtaValue = `{"op": "deposit","addr": "${selectedApp.address}"}`;
          const hardcodedBitcoinAddress =
            TRAC_APPS_BITCOIN_ADDRESSES[selectedApp.name.toLowerCase()];

          return {
            ...baseItem,
            address: hardcodedBitcoinAddress,
            dta: dtaValue,
            appName: selectedApp.name,
          };
        } else {
          // Common transfers
          return {
            ...baseItem,
            address: item.address,
          };
        }
      });

      const message = { items, auth, data: '' };

      const _tokenAuth = await walletProvider.generateTokenAuth(
        message,
        'redeem',
      );

      const order = await walletProvider.createOrderRedeem(
        activeAccount.address,
        _tokenAuth.proto,
        Number(feeRate),
        546,
      );

      const rawTxInfo = await prepareSendBTC({
        toAddressInfo: { address: order?.payAddress, domain: '' },
        toAmount: Math.round(order?.totalFee || 0),
        feeRate: order?.feeRate || Number(feeRate),
        enableRBF: false,
      });

      navigate('/home/inscribe-confirm', {
        state: {
          contextDataParam: {
            rawTxInfo,
            order,
            type: OrderType.REDEEM,
            singleTxTransfer: items,
          },
        },
      });

    } catch (error: any) {
      console.log('error :>> ', error);
      showToast({
        title: error.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleAddTokenSection = () => {
    const newToken = {
      id: tokenSections.length + 1,
      selected: '',
      amount: '',
      address: '',
      errorAmount: '',
      errorAddress: '',
    };
    setTokenSections([...tokenSections, newToken]);
  };

  // onAmountChange: Runs validation to update isDisabledForm
  const onAmountChange = (section, amount: string) => {
    setTokenSections(prev => {
      return prev.map(item => {
        if (item.id === section.id) {
          const updatedSection = { ...item, amount };
          const { errorAmount, errorAddress } = validateSection(updatedSection);
          return { ...updatedSection, errorAmount, errorAddress };
        }
        return item;
      });
    });
  };

  // onAddressChange: Runs validation to update isDisabledForm
  const onAddressChange = (id: number, address: string) => {
    setTokenSections(prev => {
      const newSections = prev.map(section => {
        if (section.id === id) {
          const updatedSection = { ...section, address };
          const { errorAddress } = validateSection(updatedSection);
          return { ...updatedSection, errorAddress, errorAmount: section.errorAmount };
        }
        return section;
      });
      return newSections;
    });
  };

  const isValidForm = () => {
    // Run full validation and update the state for all sections
    const newSections = tokenSections.map(section => {
      const errors = validateSection(section);
      return { ...section, ...errors };
    });
    
    setTokenSections(newSections as any);
    
    const isValid = newSections.every(section => {
      return !section.errorAmount && !section.errorAddress;
    });
    return isValid;
  };

  // This check controls the button's enabled/disabled state (runs on every render)
  const isDisabledForm = tokenSections.some(section => {
    return section.errorAmount || section.errorAddress;
  });

  //! Render
  return (
    <LayoutSendReceive
      header={<UX.TextHeader text="1-TX Transfer" onBackClick={handleGoBack} />}
      body={
        <UX.Box style={{ width: '100%', paddingBottom: isWaitingCancel ? '80px' : 0 }} spacing="xl">
          {tokenSections.map(section => (
            <TokenSection
              key={section.id}
              section={section}
              listTapList={listTapList}
              getTokenInfoAndStore={getTokenInfoAndStore}
              setTokenSections={setTokenSections}
              onAmountChange={onAmountChange}
              onAddressChange={onAddressChange}
              onUpdateState={onUpdateState}
              getComponentState={getComponentState}
              validateSection={validateSection}
              updateTokenSectionErrors={updateTokenSectionErrors}
              isSubmitted={isSubmitted} // <--- PASS DOWN isSubmitted
            />
          ))}

          <UX.Box
            layout="row"
            spacing="xss"
            style={{ cursor: 'pointer' }}
            onClick={handleAddTokenSection}>
            <SVG.AddIcon color="#D16B7C" width={20} height={20} />
            <UX.Text
              styleType="body_14_bold"
              title="Transfer more token"
              customStyles={{ color: colors.main_500 }}
            />
          </UX.Box>
          <UX.Box spacing="xss">
            <UX.Text
              title="Fee rate"
              styleType="body_16_extra_bold"
              customStyles={{ color: 'white' }}
            />
            <FeeRateBar
              onChange={val => {
                const cleanText = val.toString().replace(/[,a-zA-Z]/g, '');
                setFeeRate(cleanText);
              }}
            />
          </UX.Box>
        </UX.Box>
      }
      footer={
        <UX.Box
          layout="column"
          spacing="xl"
          style={{
            padding: '10px 0',
          }}>
          {isWaitingCancel && (
            <UX.Box
              layout="box_border"
              spacing="sm"
              style={{
                background: colors.red_700,
                position: 'absolute',
                bottom: 80,
                left: 0,
                right: 0,
                zIndex: 2,
              }}>
                <CloseIcon style={{position: 'absolute', top: 5, right: 5, cursor: 'pointer', width: 16, height: 16}}
                onClick={() => setIsWaitingCancel(false)}
                />
              <SVG.WaringIcon />
              <UX.Text
                styleType="body_14_bold"
                customStyles={{ color: colors.white, maxWidth: '90%' }}
                title={
                  'To complete the cancellation of the authority, perform tapping with the inscription in the pending cancellation list.'
                }
              />
            </UX.Box>
          )}
          <UX.Button
            styleType="primary"
            title={'Next'}
            customStyles={{zIndex: 2}}
            onClick={handleConfirm}
            isDisable={isDisabledForm || loading}
          />
        </UX.Box>
      }
    />
  );
};

export default TransferAuthority;