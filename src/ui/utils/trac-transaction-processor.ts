/**
 * Trac Transaction Processor
 * Process raw Trac transaction data from API
 */

import { TracApi } from '@/src/background/requests/trac-api';

export interface ProcessedTracTransaction {
  hash: string;
  type: 'sent' | 'received' | 'contract';
  address: string;
  amount: string;
  currency: string;
  status: 'confirmed' | 'pending' | 'failed';
  txid: string;
  timestamp: number;
  rawType: number;
  fee: string;
  method: string;
  sender: string;
  recipient: string;
  isConfirmed: boolean;
  rawData?: any; // Original raw transaction data from API
}

export function processTracTransaction(
  tx: any,
  userAddress: string
): ProcessedTracTransaction {
  // Extract sender and recipient
  const sender = (tx.address || tx.in || '').toLowerCase();
  const recipient = (tx.to || tx.ia || '').toLowerCase();
  const userAddrLower = userAddress.toLowerCase();

  // Determine if user is sender
  const isSender = sender === userAddrLower;

  // Determine transaction type
  const isTransfer = tx.type === 13;
  const isContract = tx.type === 12 || tx.type === 3;

  // UI Type
  let uiType: 'sent' | 'received' | 'contract';
  if (isContract) {
    uiType = 'contract';
  } else if (isTransfer) {
    uiType = isSender ? 'sent' : 'received';
  } else {
    uiType = 'contract'; // Default to contract for unknown types
  }

  // Display address (counterparty)
  const displayAddress = isSender ? recipient : sender;

  // Convert amount from wei to readable format
  const displayAmount = TracApi.balanceToDisplay(tx.am || '0');

  // Determine status
  const confirmations = parseInt(tx.confirmed_length || '0', 10);
  const isConfirmed = confirmations > 0 || (tx.block && tx.block > 0);
  const status: 'confirmed' | 'pending' | 'failed' = isConfirmed ? 'confirmed' : 'pending';

  // Handle timestamp (can be in seconds, milliseconds, or ISO string)
  let timestamp = tx.createdAt || tx.created_at || tx.timestamp || Date.now();

  if (typeof timestamp === 'string') {
    // Check if it's an ISO 8601 date string (e.g., "2026-02-12T03:32:26.281Z")
    if (timestamp.includes('T') || timestamp.includes('-')) {
      timestamp = new Date(timestamp).getTime();
    } else {
      // Otherwise parse as number string
      timestamp = parseInt(timestamp, 10);
    }
  }

  // Convert to milliseconds if in seconds (10 digits)
  if (typeof timestamp === 'number' && timestamp.toString().length === 10) {
    timestamp = timestamp * 1000;
  }

  // Extract fee
  const fee = tx.fee || '0.03';

  // Extract method based on tx.type or prepared_command
  const methodMap: Record<number, string> = {
    3: 'Balance Initialization',
    12: 'Contract Interaction',
    13: 'Transfer',
  };
  const method = tx.prepared_command?.type || methodMap[tx.type] || `Type ${tx.type}`;

  return {
    hash: tx.tx,
    type: uiType,
    address: displayAddress,
    amount: displayAmount,
    currency: 'TNK',
    status,
    txid: tx.tx,
    timestamp: timestamp / 1000, // Convert back to seconds for grouping
    rawType: tx.type,
    fee: TracApi.balanceToDisplay(fee),
    method,
    sender,
    recipient,
    isConfirmed,
    rawData: tx, // Store original raw transaction data
  };
}
