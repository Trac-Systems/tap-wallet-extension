import * as bip39 from 'bip39';
import {useContext, useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {UX} from '../../component/index';
import {useCustomToast} from '../../component/toast-custom';
import LayoutScreenImport from '../../layouts/import-export';
import {SVG} from '../../svg';
import {CreateWalletContext} from './services/wallet-service-create';
import {useWalletProvider} from '../../gateway/wallet-provider';
import {AddressType} from '@/src/wallet-instance';
import {useAppDispatch} from '../../utils';
import {WalletActions} from '../../redux/reducer/wallet/slice';
import {AccountActions} from '../../redux/reducer/account/slice';

const RestoreWallet = () => {
  //! State
  const navigate = useNavigate();
  const location = useLocation();
  const walletProvider = useWalletProvider();
  const CreateWalletContextHandler = useContext(CreateWalletContext);
  const {showToast} = useCustomToast();
  const dispatch = useAppDispatch();
  const [disabled, setDisabled] = useState(true);
  const [restoreInput, setRestoreInput] = useState('');
  const queryParams = new URLSearchParams(location.search);
  const restore = queryParams.get('restore');
  const isMnemonics = restore === 'mnemonics';
  const text = isMnemonics ? 'mnemonics' : 'Private key';
  const desc = isMnemonics
    ? 'wallet mnemonics phrase'
    : 'your single private key';
  const placeholder = isMnemonics
    ? 'wallet seed phrase'
    : 'your single private key';

  //! Function
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleNavigate = async () => {
    try {
      if (isMnemonics) {
        CreateWalletContextHandler.Handlers.mnemonic = restoreInput;
        navigate('/choose-address?type=isImport');
      } else {
        const inputText = restoreInput.trim();
        // Helper function to detect if input is likely a TRAC private key
        const isLikelyTracPrivateKey = (raw: string): boolean => {
          /**
           * SIMPLE LENGTH-BASED DETECTION:
           * - 64 chars → Bitcoin private key (32 bytes)
           * - 128 chars → TRAC private key (64 bytes)
           * - Other lengths → Default to Bitcoin
           */
          
          // Simple length check - fastest and most reliable
          return raw.length === 128;
        };

        // Helper function to normalize TRAC secret key (hex only)
        const normalizeSecretForTrac = (raw: string): Uint8Array | null => {
          // Only handle hex string format (128 characters = 64 bytes)
          const hexMatch = raw.match(/^[0-9a-fA-F]+$/);
          if (hexMatch) {
            const hexString = hexMatch[0];
            if (hexString.length === 128) {
              try {
                const bytes = new Uint8Array(hexString.length / 2);
                for (let i = 0; i < hexString.length; i += 2) {
                  bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
                }
                return bytes;
              } catch (error) {
                return null;
              }
            }
          }
          
          return null;
        };

        // Check if input is likely a TRAC private key first
        if (isLikelyTracPrivateKey(inputText)) {
          const secretBytes = normalizeSecretForTrac(inputText);
          const isTracSecretKey = !!secretBytes && secretBytes.length === 64;

          if (isTracSecretKey) {
          // 1) Derive TRAC address from provided secretKey first to check for duplicates
          let tracAddress = '';
          try {
            const api = (window as any).TracCryptoApi;
            if (api && api.address?.fromSecretKey) {
              const result = await api.address.fromSecretKey('trac', secretBytes);
              tracAddress = result?.address;
              if (!tracAddress) {
                throw new Error('Failed to derive TRAC address from secret key');
              }
            } else {
              throw new Error('TracCryptoApi not available');
            }
          } catch (error) {
            console.log('Error deriving TRAC address:', error);
            showToast({
              type: 'error',
              title: 'Failed to derive TRAC address from secret key',
            });
            return;
          }

          // 2) Check if TRAC address already exists with combined condition:
          // - It must exist in tracAddressMap with a key pattern like "wallet_{index}#accountIndex"
          // - AND there must be a BTC wallet in listWallets with type === 'Single Wallet' and key === `wallet_{index}`
          const tracAddressMap = await walletProvider.getTracAddressMap();
          const wallets = await walletProvider.getWallets();
          const singleWalletKeys = new Set(
            (wallets || [])
              .filter(w => w?.type === 'Single Wallet' && w?.key)
              .map(w => w.key),
          );

          let isDuplicate = false;
          for (const [mapKey, addr] of Object.entries(tracAddressMap || {})) {
            if (!addr || addr.trim() === '' || addr !== tracAddress) continue;
            const walletKey = mapKey.split('#')[0]; // e.g., 'wallet_2#0' -> 'wallet_2'
            if (singleWalletKeys.has(walletKey)) {
              isDuplicate = true;
              break;
            }
          }

          if (isDuplicate) {
            showToast({
              type: 'error',
              title: 'TRAC address already exists in another wallet',
            });
            return;
          }

          // 3) Generate random 32-byte hex for BTC private key to create a Single Wallet entry
          const randomBytes = new Uint8Array(32);
          crypto.getRandomValues(randomBytes);
          const randomHex = Array.from(randomBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          
          // Convert TRAC secret key to hex string for storage
          const tracPrivateKeyHex = Array.from(secretBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          
          await walletProvider.createWalletFromPrivateKey(
            randomHex,
            AddressType.P2TR,
            { tracPrivateKeys: [tracPrivateKeyHex] } // Pass TRAC private key
          );

          // 4) Set TRAC address for the new wallet
          try {
            const wallets = await walletProvider.getWallets();
            const newWallet = wallets[wallets.length - 1];
            if (newWallet) {
              walletProvider.setTracAddress(newWallet.index, 0, tracAddress);
            }
          } catch (error) {
            console.log('Error setting TRAC address:', error);
          }

          // Refresh wallets list to show the new wallet immediately
          try {
            const wallets = await walletProvider.getWallets();
            dispatch(WalletActions.setListWallet(wallets));
            
            const activeWallet = await walletProvider.getActiveWallet();
            dispatch(WalletActions.setActiveWallet(activeWallet));
            
            const accounts = await walletProvider.getAccounts();
            dispatch(AccountActions.setAccounts(accounts));
            
            const activeAccount = await walletProvider.getActiveAccount();
            dispatch(AccountActions.setActiveAccount(activeAccount));
          } catch (error) {
            console.log('Error refreshing wallets:', error);
            // Continue with navigation even if refresh fails
          }
          
          navigate('/success?isImport=isImport');
          return;
          }
        }

        // Default BTC private-key flow (for Bitcoin private keys)
        const _res = await walletProvider.previewAddressFromPrivateKey(
          restoreInput,
          AddressType.P2TR,
        );
        if (_res.accounts.length === 0) {
          throw new Error('Invalid Private Key');
        }
        CreateWalletContextHandler.Handlers.wif = restoreInput;
        navigate('/choose-address-private');
      }
    } catch (e) {
      showToast({
        type: 'error',
        title: e.message,
      });
    }
  };

  const handleOnChange = (inputData: string) => {
    setRestoreInput(inputData.trim());
  };

  useEffect(() => {
    setDisabled(true);
    if (restoreInput === '') {
      return;
    }
    if (isMnemonics) {
      if (!bip39.validateMnemonic(restoreInput)) {
        return;
      }
    }
    setDisabled(false);
  }, [restoreInput]);

  //! Render
  return (
    <LayoutScreenImport
      header={<UX.TextHeader onBackClick={handleGoBack} />}
      body={
        <UX.Box layout="column_center" spacing="xl">
          <SVG.SeedPhraseIcon />
          <UX.Text
            title={`Restore from ${text}`}
            styleType="heading_24"
            customStyles={{
              marginTop: '16px',
              textAlign: 'center',
            }}
          />
          <UX.Text
            title={`Enter ${desc} below. This will restore your existing wallet.`}
            styleType="body_16_normal"
            customStyles={{textAlign: 'center'}}
          />
          <style>
            {`
              .textareaWidth {
                color: #FFFFFFB0 !important;
                font-size: 16px !important;
                font-weight: 400 !important;
                font-family: Exo !important;
                line-height: 24px !important;
              }
              .textareaWidth::placeholder {
                color: #FFFFFFB0 !important;
                font-size: 16px !important;
                font-weight: 400 !important;
                font-family: Exo !important;
                line-height: 24px !important;
              }
            `}
          </style>
          <UX.TextArea
            className="textareaWidth"
            onChange={e => handleOnChange(e.target.value)}
            placeholder={`Enter/paste ${placeholder} here `}
            customStyles={{width: '100%'}}
            style={{display: 'flex', width: '100%'}}
          />
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
            isDisable={disabled}
            styleType="primary"
            title="Restore Wallet"
            onClick={handleNavigate}
          />
        </UX.Box>
      }
    />
  );
};

export default RestoreWallet;

