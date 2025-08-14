import { useEffect, useMemo, useState } from 'react';
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

  const handleConfirm = async () => {
    const isValid = isValidForm();
    if (!isValid) {
      return;
    }
    setLoading(true);
    const message = {
      items: tokenSections.map(item => ({
        tick: item.selected,
        amt: item.amount?.toString(),
        address: item.address,
      })),
      auth,
      data: '',
    };
    try {
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
            singleTxTransfer: tokenSections.map(item => ({
              tick: item.selected,
              amt: item.amount?.toString(),
              address: item.address,
            })),
          },
        },
      });
      console.log('order :>> ', order);
    } catch (error) {
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
    const latestToken = tokenSections.filter(item => !!item.selected);
    console.log('latestToken :>> ', latestToken);
    setTokenSections(prev => [
      ...prev,
      {
        id: prev.length + 1,
        selected: latestToken[latestToken.length - 1]?.selected,
        amount: '',
        address: '',
        errorAmount: '',
        errorAddress: '',
      },
    ]);
  };

  const onAmountChange = (section, amount: string) => {
    const selectedOption = listTapList.find(
      option => option.value === section.selected,
    );
    const optionAmount = selectedOption?.amount || 0;
    const filterTokenSections = tokenSections.filter(
      item => item.id !== section.id,
    );
    const selectedAmount = filterTokenSections.reduce((acc, item) => {
      if (item.selected === section.selected && !item.errorAmount) {
        return acc + Number(item.amount || 0);
      }
      return acc;
    }, 0);
    const availableAmount =
      Number(optionAmount || 0) - Number(selectedAmount || 0);
    let errorAmount = '';
    if (!amount) {
      errorAmount = 'Amount is required';
    } else if (Number(amount) > Number(availableAmount)) {
      errorAmount = 'Amount exceeds your available balance';
    } else {
      errorAmount = '';
    }

    const newSections = tokenSections.map(item => {
      if (item.id === section.id) {
        return { ...item, amount, errorAmount };
      }
      return item;
    });
    setTokenSections(newSections as any);
  };

  const onAddressChange = (id: number, address: string) => {
    let errorAddress = '';

    if (!address) {
      errorAddress = 'Receiver address is required';
    } else {
      const isValid = validateBtcAddress(address, networkType);
      if (!isValid) {
        errorAddress = 'Receiver address is invalid';
      } else {
        errorAddress = '';
      }
    }

    setTokenSections(prev => {
      const newSections = [...prev];
      return newSections.map(section => {
        if (section.id === id) {
          return { ...section, address, errorAddress };
        }
        return section;
      });
    });
  };

  const isValidForm = () => {
    const newSections = tokenSections.map(section => {
      // amount error
      let errorAmount = '';
      if (!section.amount) {
        errorAmount = 'Amount is required';
      } else {
        errorAmount = '';
      }

      // address error
      let errorAddress = '';
      if (!section.address) {
        errorAddress = 'Receiver address is required';
      } else {
        errorAddress = '';
      }
      return { ...section, errorAmount, errorAddress };
    });
    const isValid = newSections.every(section => {
      return !section.errorAmount && !section.errorAddress;
    });
    setTokenSections(newSections as any);
    return isValid;
  };

  const isDisabledForm = tokenSections.some(section => {
    return section.errorAmount || section.errorAddress;
  });

  const renderTokenSection = (section, index) => {
    const selectedOption = listTapList.find(
      option => option.value === section.selected,
    );
    const amount = selectedOption?.amount || 0;
    useEffect(() => {
      if (section.selected) {
        getTokenInfoAndStore(section.selected);
      }
    }, [section.selected]);

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
            onAmountInputChange={amount => { }}
          />
          {section.errorAmount && (
            <Text
              title={section.errorAmount}
              styleType="body_14_bold"
              customStyles={{ color: colors.red_500, marginTop: '4px' }}
            />
          )}
        </UX.Box>
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
          {section.errorAddress && (
            <Text
              title={section.errorAddress}
              styleType="body_14_bold"
              customStyles={{ color: colors.red_500, marginTop: '4px' }}
            />
          )}
        </UX.Box>
      </UX.Box>
    );
  };

  //! Render
  return (
    <LayoutSendReceive
      header={<UX.TextHeader text="1-TX Transfer" onBackClick={handleGoBack} />}
      body={
        <UX.Box style={{ width: '100%', paddingBottom: isWaitingCancel ? '80px' : 0 }} spacing="xl">
          {tokenSections.map((section, index) =>
            renderTokenSection(section, index),
          )}

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
              styleType="body_16_extra_bold"
              customStyles={{ color: 'white' }}
              title="Fee rate"
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
