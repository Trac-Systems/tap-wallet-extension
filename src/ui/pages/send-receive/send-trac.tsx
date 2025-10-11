import {UX} from '@/src/ui/component/index';
import LayoutSendReceive from '@/src/ui/layouts/send-receive';
import {colors} from '@/src/ui/themes/color';
import {SVG} from '@/src/ui/svg';
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useCustomToast} from '../../component/toast-custom';
import {useActiveTracAddress, useTracBalances} from '../home-flow/hook';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {TracApi} from '../../../background/requests/trac-api';
import {TracApiService} from '../../../background/service/trac-api.service';

const SendTrac = () => {
  //! State
  const navigate = useNavigate();
  const tracAddress = useActiveTracAddress();
  const {total, confirmed, unconfirmed, loading: balancesLoading} = useTracBalances(tracAddress);
  const [disabled, setDisabled] = useState(true);
  const [toInfo, setToInfo] = useState({address: ''});
  const [addressError, setAddressError] = useState('');
  const {showToast} = useCustomToast();
  const [tracSendNumberValue, setTracSendNumberValue] = useState('');
  const wallet = useWalletProvider();

  const onAddressChange = (address: string) => {
    setToInfo({address: address});
    
    // Validate address with detailed error messages
    if (address.trim() === '') {
      setAddressError('');
      return;
    }
    
    const validation = TracApiService.validateTracAddress(address);
    if (!validation.valid) {
      setAddressError('Invalid TRAC address format');
    } else {
      setAddressError('');
    }
  };

  const onTracAmountChange = (input: string) => {
    const cleanText = input.replace(/[^0-9.]/g, '');
    const dotCount = (cleanText.match(/\./g) || []).length;
    if (dotCount > 1) {
      return;
    }
    setTracSendNumberValue(cleanText);
  };

  const isTracAddress = (addr: string) => {
    return TracApiService.isValidTracAddress(addr);
  };

  // Check if form is valid
  const isFormValid = isTracAddress(toInfo.address) && 
    tracSendNumberValue.trim() !== '' && 
    parseFloat(tracSendNumberValue) > 0 &&
    parseFloat(tracSendNumberValue) <= parseFloat(confirmed || '0') &&
    !addressError;

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleNavigate = async () => {
    try {
      // Check if user has enough confirmed balance
      const sendAmount = parseFloat(tracSendNumberValue);
      const confirmedAmount = parseFloat(confirmed || '0');
      
      if (sendAmount > confirmedAmount) {
        showToast({
          title: `Insufficient confirmed balance. Available: ${confirmed || '0'} TNK`,
          type: 'error'
        });
        return;
      }

      const tracCrypto = TracApiService.getTracCryptoInstance();
      if (!tracCrypto) {
        showToast({title: 'TracCryptoApi not available', type: 'error'});
        return;
      }
      
      // Fetch fee and validity
      const [feeHex, validityHex] = await Promise.all([
        TracApi.fetchTransactionFee(),
        TracApi.fetchTransactionValidity()
      ]);
      
      // Convert input amount to hex using service
      const amountHex = TracApiService.amountToHex(sendAmount);

      const summaryData = {
        to: toInfo.address,
        amountHex,
        validityHex,
        amount: tracSendNumberValue,
        fee: feeHex
      };

      navigate('/home/send-trac-summary', { state: { summaryData } });
    } catch (e) {
      const err = e as Error;
      showToast({title: err.message || 'Failed to prepare transaction', type: 'error'});
    }
  };


  //! Render
  return (
    <LayoutSendReceive
      header={<UX.TextHeader text="Send TNK" onBackClick={handleGoBack} />}
      body={
        <UX.Box spacing="xxl" style={{width: '100%'}}>
          <UX.Box layout="column" style={{width: '100%'}} spacing="xss">
            <UX.Box layout="row_between" style={{alignItems: 'baseline'}}>
              <UX.Text
                styleType="heading_16"
                customStyles={{color: 'white'}}
                title="Send"
              />
              <UX.Box layout="column" style={{alignItems: 'flex-end', marginLeft: '25px' }}>
                <UX.Box layout="row_between" style={{width: '100%', alignItems: 'flex-start'}}>
                    <UX.Text title="Confirmed:" styleType="body_14_bold" />
                    <UX.Text
                    title={`${confirmed || '0'} TNK`}
                    styleType="body_14_bold"
                    customStyles={{
                      marginLeft: '6px',
                      color: colors.green_500, 
                      textAlign: 'right',
                      wordBreak: 'break-word',
                    }}
                    />
                </UX.Box>
                
              </UX.Box>
            </UX.Box>
          
            <UX.Box
              layout="row_between"
              style={{
                background: 'transparent',
                borderRadius: '12px',
                border: '1px solid #3F3F3F',
                padding: '12px 14px',
              }}
            >
              <input
                type="text"
                value={tracSendNumberValue}
                onChange={e => onTracAmountChange(e.target.value)}
                placeholder="0"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'white',
                  fontSize: '20px',
                  lineHeight: '28px',
                }}
              />
              <UX.Box
                layout="row_center"
                spacing="xs"
                style={{
                  background: 'transparent',
                  border: '1px solid #3F3F3F',
                  borderRadius: '8px',
                  padding: '6px 10px',
                }}
              >
                <SVG.TracIcon width={22} height={22} />
                <UX.Text title="TNK" styleType="body_14_bold" customStyles={{color: 'white'}} />
              </UX.Box>
            </UX.Box>
            <UX.Box layout="column" style={{width: '100%', alignItems: 'flex-end'}}>
                <UX.Box layout="row_between" style={{width: '100%', alignItems: 'flex-start'}}>
                    <UX.Text title="Unconfirmed:" styleType="body_14_bold" />
                    <UX.Text
                    title={`${unconfirmed || '0'} TNK`}
                    styleType="body_14_bold"
                    customStyles={{
                      color: colors.green_500, 
                      textAlign: 'right',
                      wordBreak: 'break-all',
                      maxWidth: '60%'
                    }}
                    />
                </UX.Box>
                
            </UX.Box>
            <UX.Box layout="column" style={{width: '100%', alignItems: 'flex-end'}}>
            <UX.Box layout="row_between" style={{width: '100%', alignItems: 'flex-start'}}>
                <UX.Text title="Total:" styleType="body_14_bold" />
                <UX.Text
                  title={`${total || '0'} TNK`}
                  styleType="body_14_bold"
                  customStyles={{
                    color: colors.green_500,
                    textAlign: 'right',
                    wordBreak: 'break-all',
                    maxWidth: '60%'
                  }}
                />
            </UX.Box>
            </UX.Box>
          </UX.Box>
          <UX.Box spacing="xss">
            <UX.Text
              styleType="heading_16"
              customStyles={{color: 'white'}}
              title="Receiver"
            />
            <UX.Box
              layout="row"
              style={{
                borderRadius: 10,
                padding: '12px 14px',
                border: `1px solid ${addressError ? '#D16B7C' : '#545454'}`,
                backgroundColor: '#2727276b',
              }}
            >
              <input
                placeholder={'trac address'}
                type={'text'}
                onChange={e => onAddressChange(e.target.value)}
                style={{
                  fontSize: '16px',
                  border: 'none',
                  background: 'transparent',
                  width: '100%',
                  outline: 'none',
                  color: 'white',
                }}
                defaultValue={toInfo.address}
                autoFocus={true}
              />
            </UX.Box>
            {addressError && (
              <UX.Text
                title={addressError}
                styleType="body_12_normal"
                customStyles={{
                  color: '#D16B7C',
                  marginTop: '4px',
                  marginLeft: '4px'
                }}
              />
            )}
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
            isDisable={!isFormValid}
            title="Confirm"
            onClick={handleNavigate}
          />
        </UX.Box>
      }
    />
  );
};

export default SendTrac;
