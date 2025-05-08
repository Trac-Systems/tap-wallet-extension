import { formatAmountNumber } from '@/src/shared/utils/btc-helper';
import { useEffect, useState } from 'react';
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


const TransferAuthority = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const ticker = state?.ticker;
  const [feeRate, setFeeRate] = useState('');
  const [tokenSections, setTokenSections] = useState([
    { id: 1, selected: ticker, amount: '', address: '', errorAmount: '', errorAddress: '' },
  ]);
  const [listTapList, setListTapList] = useState([]);
  const rawTxInfo = '';
  const tapList = useAppSelector(InscriptionSelector.listTapToken);
  const networkType = useAppSelector(GlobalSelector.networkType);

  useEffect(() => {
    const listTapList = tapList.map(item => ({
      label: item.ticker,
      value: item.ticker,
      amount: Number(item.overallBalance || 0) - Number(item.transferableBalance),
    }));
    setListTapList(listTapList);
  }, [tapList]);


  const handleConfirm = async () => {
    const isValid = isValidForm();
    console.log('isValid :>> ', isValid);
    if (!isValid) {
      return;
    }
    console.log('feeRate :>> ', feeRate);
    console.log('tokenSections :>> ', tokenSections);
  }

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleAddTokenSection = () => {
    setTokenSections(prev => [...prev, { id: prev.length + 1, selected: ticker, amount: '', address: '', errorAmount: '', errorAddress: '' }]);
  };

  const onAmountChange = (section, amount: string) => {
    const selectedOption = listTapList.find(
      option => option.value === section.selected,
    );
    const optionAmount = selectedOption?.amount || 0;
    const filterTokenSections = tokenSections.filter(item => item.id !== section.id);
    const selectedAmount = filterTokenSections.reduce((acc, item) => {
      if (item.selected === section.selected && !item.errorAmount) {
        return acc + Number(item.amount || 0);
      }
      return acc;
    }, 0);
    const availableAmount = Number(optionAmount || 0) - Number(selectedAmount || 0);
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
        return { ...item, amount: amount ? Number(amount) : '', errorAmount };
      }
      return item;
    })
    setTokenSections(newSections as any);
  }

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
  }

  const isDisabledForm = tokenSections.some(section => {
    return section.errorAmount || section.errorAddress;
  });


  const handleNavigate = () => {
    navigate('/sign-authority', {
      state: { rawTxInfo },
    });
  };

  const renderTokenSection = (section, index) => {
    console.log('section :>> ', section);
    const selectedOption = listTapList.find(
      option => option.value === section.selected,
    );
    const amount = selectedOption?.amount || 0;

    return <UX.Box spacing="xl" style={{ width: '100%' }} key={section.id}>
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
            const newSections = [...tokenSections];
            newSections[index].selected = val;
            setTokenSections(newSections);
          }}
        />
        <UX.Box layout="row_between">
          <UX.Text title="Available:" styleType="body_14_bold" />
          <UX.Text
            title={`${amount} ${ticker}`}
            styleType="body_14_bold"
            customStyles={{ color: colors.green_500 }}
          />
        </UX.Box>
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
            console.log('321321 :>> ', 321321);
            const val = e?.target?.value;
            const cleanText = val?.toString()?.replace(/[^0-9.]/g, '');
            onAmountChange(section, cleanText);
          }
          }
          value={formatAmountNumber(section?.amount?.toString())}
          onAmountInputChange={amount => { }}
        />
        {section.errorAmount && <Text
          title={section.errorAmount}
          styleType="body_14_bold"
          customStyles={{ color: colors.red_500, marginTop: '4px' }}
        />}
      </UX.Box>
      <UX.Box spacing="xss">
        <UX.Text
          title="Receiver"
          styleType="body_16_extra_bold"
          customStyles={{ color: 'white' }}
        />
        <UX.Input
          placeholder='Receiver address'
          style={{
            fontSize: '16px',
            border: 'none',
            padding: '9px 16px',
            background: 'transparent',
          }}
          onChange={e => {
            onAddressChange(section.id, e?.target?.value);
          }}
        />
        {section.errorAddress && <Text
          title={section.errorAddress}
          styleType="body_14_bold"
          customStyles={{ color: colors.red_500, marginTop: '4px' }}
        />}
      </UX.Box>
    </UX.Box>
  };

  //! Render
  return (
    <LayoutSendReceive
      header={<UX.TextHeader text="1-TX Transfer" onBackClick={handleGoBack} />}
      body={
        <UX.Box style={{ width: '100%' }} spacing="xl">
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
                const cleanText = val.toString().replace(/[^0-9.]/g, '');
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
          <UX.Button
            styleType="primary"
            title={'Confirm'}
            onClick={handleConfirm}
            isDisable={isDisabledForm}
          />
        </UX.Box>
      }
    />
  );
};

export default TransferAuthority;
