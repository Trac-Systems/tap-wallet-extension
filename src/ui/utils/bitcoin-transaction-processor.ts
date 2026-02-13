/**
 * Bitcoin Transaction Processor
 * Processes raw Bitcoin transaction data from Mempool API
 */

export interface ProcessedBitcoinTransaction {
  type: 'sent' | 'received';
  address: string;
  amount: string;
  currency: string;
  status: 'confirmed' | 'pending' | 'failed';
  txid: string;
  hash: string;
  timestamp: number;
  fee: string;
  isConfirmed: boolean;
}

/**
 * Convert satoshis to BTC
 */
function satoshisToBTC(satoshis: number): string {
  const btc = satoshis / 100000000;
  return btc.toFixed(8).replace(/\.?0+$/, ''); // Remove trailing zeros
}

/**
 * Process Bitcoin transaction from Mempool API
 */
export function processBitcoinTransaction(
  tx: any,
  userAddress: string
): ProcessedBitcoinTransaction {
  // Handle coinbase transactions (mining rewards)
  const isCoinbase = tx.vin?.some((input: any) => input.is_coinbase || !input.prevout);

  // Determine if this is a sent or received transaction
  const isSent = !isCoinbase && tx.vin?.some((input: any) =>
    input.prevout?.scriptpubkey_address === userAddress
  );

  let amount = 0;
  let counterpartyAddress = '';

  if (isCoinbase) {
    // Coinbase transaction - always received
    tx.vout?.forEach((output: any) => {
      if (output.scriptpubkey_address === userAddress) {
        amount += output.value || 0;
      }
    });
    counterpartyAddress = 'Coinbase (Mining Reward)';
  } else if (isSent) {
    // For sent: sum outputs NOT going to user
    tx.vout?.forEach((output: any) => {
      if (output.scriptpubkey_address !== userAddress) {
        amount += output.value || 0;
        if (!counterpartyAddress) {
          counterpartyAddress = output.scriptpubkey_address || 'Unknown';
        }
      }
    });
    // If no counterparty found (self-transfer), use user's address
    if (!counterpartyAddress || amount === 0) {
      counterpartyAddress = userAddress;
      // For self-transfer, use the output value
      amount = tx.vout?.[0]?.value || 0;
    }
  } else {
    // For received: sum outputs going to user
    tx.vout?.forEach((output: any) => {
      if (output.scriptpubkey_address === userAddress) {
        amount += output.value || 0;
      }
    });
    // Get sender address from first input
    counterpartyAddress = tx.vin?.[0]?.prevout?.scriptpubkey_address || 'Unknown';
  }

  const isConfirmed = tx.status?.confirmed || false;
  const timestamp = tx.status?.block_time || Math.floor(Date.now() / 1000);

  return {
    type: isSent ? 'sent' : 'received',
    address: counterpartyAddress,
    amount: satoshisToBTC(amount),
    currency: 'BTC',
    status: isConfirmed ? 'confirmed' : 'pending',
    txid: tx.txid,
    hash: tx.txid,
    timestamp,
    fee: satoshisToBTC(tx.fee || 0),
    isConfirmed,
  };
}
