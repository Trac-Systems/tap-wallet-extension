import React from 'react';

export const ctx = {
  toAddress: '',
  inputAmount: '',
  enableRBF: false,
  feeRate: 1,
};

export const SendBtcContext = React.createContext({ctx});
