/**
 * TRAC API Constants
 */

import { Network } from '../../wallet-instance';

export const TRAC_BASE_URL_MAINNET = 'https://tracapi.trac.network/v1';
export const TRAC_BASE_URL_TESTNET = 'https://tracapi-testnet.trac.network/v1';
export const TRAC_EXPLORER_URL_MAINNET = 'https://explorer.trac.network';
export const TRAC_EXPLORER_URL_TESTNET = 'https://tracapi-testnet.trac.network';

/**
 * Get TRAC explorer URL based on network
 */
export const getTracExplorerUrl = (network: Network): string => {
  return network === Network.MAINNET 
    ? TRAC_EXPLORER_URL_MAINNET 
    : TRAC_EXPLORER_URL_TESTNET;
};
