export const TracBalanceSelector = {
  byAddress: (state: any, address?: string) => {
    if (!address) return {total: '', confirmed: '', unconfirmed: ''};
    return state?.tracBalanceReducer?.map?.[address] || {
      total: '',
      confirmed: '',
      unconfirmed: '',
    };
  },
};


