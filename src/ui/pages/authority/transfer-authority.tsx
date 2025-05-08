import { formatAmountNumber } from '@/src/shared/utils/btc-helper';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UX } from '../../component';
import LayoutSendReceive from '../../layouts/send-receive';
import { SVG } from '../../svg';
import { colors } from '../../themes/color';
import { FeeRateBar } from '../send-receive/component/fee-rate-bar';
import { useAppSelector } from '../../utils';
import { InscriptionSelector } from '../../redux/reducer/inscription/selector';
import { set } from 'lodash';

const TransferAuthority = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const ticker = state?.ticker;
  const [feeRate, setFeeRate] = useState('');
  const [tokenSections, setTokenSections] = useState([
    { id: Date.now(), selected: ticker, amount: 0, address: '' },
  ]);
  const [listTapList, setListTapList] = useState([]);
  const rawTxInfo = '';
  const tapList = useAppSelector(InscriptionSelector.listTapToken);

  useEffect(() => {
    const listTapList = tapList.map(item => ({
      label: item.ticker,
      value: item.ticker,
      amount: Number(item.overallBalance || 0) - Number(item.transferableBalance),
    }));
    setListTapList(listTapList);
  }, [tapList]);

 
  const handleConfirm = async () => {
    console.log('feeRate :>> ', feeRate);
    console.log('tokenSections :>> ', tokenSections);
  }

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleAddTokenSection = () => {
    setTokenSections(prev => [...prev, { id: Date.now(), selected: ticker, amount: 0, address: '' }]);
  };

  const onAmountChange = (id: number, amount: string) => {
    setTokenSections(prev => {
      const newSections = [...prev];
      return newSections.map(section => {
        if (section.id === id) {
          return { ...section, amount: Number(amount) };
        }
        return section;
      });
    }
    );
  };

  const onAddressChange = (id: number, address: string) => {
    setTokenSections(prev => {
      const newSections = [...prev];
      return newSections.map(section => {
        if (section.id === id) {
          return { ...section, address };
        }
        return section;
      });
    });
  };


  const handleNavigate = () => {
    navigate('/sign-authority', {
      state: { rawTxInfo },
    });
  };

  const renderTokenSection = (section, index) => {
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
          value={formatAmountNumber(section?.amount?.toString())}
          onAmountInputChange={amount => {
            const cleanText = amount.replace(/[^0-9.]/g, '');
            onAmountChange(section.id, cleanText);
          }}
        />
      </UX.Box>
      <UX.Box spacing="xss">
        <UX.Text
          title="Receiver"
          styleType="body_16_extra_bold"
          customStyles={{ color: 'white' }}
        />
        <UX.AddressInput
          style={{
            fontSize: '16px',
            border: 'none',
            background: 'transparent',
            width: '100%',
          }}
          addressInputData={{
            address: section.address,
          }}
          onAddressInputChange={val => {
            onAddressChange(section.id, val?.address);
          }}
        />
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
            // onClick={handleNavigate}
          />
        </UX.Box>
      }
    />
  );
};

export default TransferAuthority;
