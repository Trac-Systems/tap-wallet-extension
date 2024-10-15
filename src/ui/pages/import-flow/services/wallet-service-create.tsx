import React from 'react';

export const Handlers = {
  pin: '',
  confirmPin: '',
  startWalletType: '',
  mnemonic: '',
  wif: '',
};

export const CreateWalletContext = React.createContext({Handlers});
