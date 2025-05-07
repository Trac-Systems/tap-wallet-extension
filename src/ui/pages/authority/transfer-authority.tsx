import { formatAmountNumber } from '@/src/shared/utils/btc-helper';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UX } from '../../component';
import LayoutSendReceive from '../../layouts/send-receive';
import { SVG } from '../../svg';
import { colors } from '../../themes/color';
import { FeeRateBar } from '../send-receive/component/fee-rate-bar';

const TransferAuthority = () => {
  //! State
  const navigate = useNavigate();
  // const location = useLocation();
  // const {state} = location;
  const ticker = 'thuy';
  const amount = '0.12367124';
  const [tokenSections, setTokenSections] = useState([
    {id: Date.now(), selected: 'option1'},
  ]);
  const rawTxInfo = '';

  const options = [
    {label: 'Option 1', value: 'option1'},
    {label: 'Option 2', value: 'option2'},
    {label: 'Option 3', value: 'option3'},
  ];

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleAddTokenSection = () => {
    setTokenSections(prev => [...prev, {id: Date.now(), selected: 'option1'}]);
  };

  const handleNavigate = () => {
    navigate('/sign-authority', {
      state: {rawTxInfo},
    });
  };

  const renderTokenSection = (section, index) => (
    <UX.Box spacing="xl" style={{width: '100%'}} key={section.id}>
      <UX.Box spacing="xss">
        <UX.Text
          title="Token name"
          styleType="body_16_extra_bold"
          customStyles={{color: 'white'}}
        />
        <UX.Dropdown
          options={options}
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
            customStyles={{color: colors.green_500}}
          />
        </UX.Box>
      </UX.Box>
      <UX.Box spacing="xss">
        <UX.Text
          title="Amount"
          styleType="body_16_extra_bold"
          customStyles={{color: 'white'}}
        />
        <UX.AmountInput
          style={{
            fontSize: '20px',
            lineHeight: '28px',
            background: 'transparent',
          }}
          disableCoinSvg
          value={formatAmountNumber(amount)}
          onAmountInputChange={amount => {
            // onBTCAmountChange(amount);
          }}
        />
      </UX.Box>
      <UX.Box spacing="xss">
        <UX.Text
          title="Receiver"
          styleType="body_16_extra_bold"
          customStyles={{color: 'white'}}
        />
        <UX.AddressInput
          style={{
            fontSize: '16px',
            border: 'none',
            background: 'transparent',
            width: '100%',
          }}
          addressInputData={{
            address: 'tbdv23bjkasg2d7812juc8sgha8jhzxyuus',
          }}
          onAddressInputChange={val => {
            // onAddressChange(val?.address);
          }}
        />
      </UX.Box>
    </UX.Box>
  );

  //! Render
  return (
    <LayoutSendReceive
      header={<UX.TextHeader text="1-TX Transfer" onBackClick={handleGoBack} />}
      body={
        <UX.Box style={{width: '100%'}} spacing="xl">
          {tokenSections.map((section, index) =>
            renderTokenSection(section, index),
          )}

          <UX.Box
            layout="row"
            spacing="xss"
            style={{cursor: 'pointer'}}
            onClick={handleAddTokenSection}>
            <SVG.AddIcon color="#D16B7C" width={20} height={20} />
            <UX.Text
              styleType="body_14_bold"
              title="Transfer more token"
              customStyles={{color: colors.main_500}}
            />
          </UX.Box>
          <UX.Box spacing="xss">
            <UX.Text
              styleType="body_16_extra_bold"
              customStyles={{color: 'white'}}
              title="Fee rate"
            />
            <FeeRateBar
              onChange={val => {
                // setFeeRate(val);
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
            onClick={handleNavigate}
          />
        </UX.Box>
      }
    />
  );
};

export default TransferAuthority;
