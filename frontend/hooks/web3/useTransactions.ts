/**
 * Hook pour récupérer l'historique des transactions
 */

import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';
import type { Transaction } from '@/types';
import {
  IndexerSyncService,
  EventType,
  BlockchainEvent,
} from '@/services/indexer/indexer';

const DEFAULT_LOOKBACK_BLOCKS = Number(
  process.env.NEXT_PUBLIC_TX_LOOKBACK_BLOCKS || '1000'
);
const INDEXER_LIMIT = Number(process.env.NEXT_PUBLIC_TX_LIMIT || '200');
const INDEXER_TIMEOUT_MS = Number(
  process.env.NEXT_PUBLIC_TX_INDEXER_TIMEOUT_MS || '5000'
);
const SCAN_TIMEOUT_MS = Number(
  process.env.NEXT_PUBLIC_TX_SCAN_TIMEOUT_MS || '8000'
);

async function fetchIndexerEventsWithTimeout(address: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), INDEXER_TIMEOUT_MS);

  try {
    const events = await IndexerSyncService.fetchRecentEvents({
      address,
      limit: INDEXER_LIMIT,
      signal: controller.signal as unknown as AbortSignal,
    } as any);
    return events;
  } catch (error) {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function mapEventToTransaction(event: BlockchainEvent, userAddress: string): Transaction {
  const from =
    event.from ||
    event.args?.from ||
    event.args?.sender ||
    '';
  const to =
    event.to ||
    event.args?.to ||
    event.args?.recipient ||
    '';

  const rawAmount = event.amount || event.amount0 || event.amount1 || '0';
  let amount = BigInt(0);

  try {
    amount = BigInt(rawAmount);
  } catch {
    amount = BigInt(0);
  }

  const type = (() => {
    switch (event.eventType) {
      case EventType.MINT:
        return 'MINT' as const;
      case EventType.BURN:
        return 'BURN' as const;
      case EventType.TRANSFER:
        return 'TRANSFER' as const;
      case EventType.SWAP:
        return from.toLowerCase() === userAddress.toLowerCase() ? 'SELL' : 'BUY';
      default:
        return from.toLowerCase() === userAddress.toLowerCase() ? 'SELL' : 'BUY';
    }
  })();

  return {
    hash: event.transactionHash,
    from,
    to,
    assetAddress: event.contractAddress,
    amount,
    timestamp: event.timestamp,
    status: 'SUCCESS',
    type,
  };
}

export function useTransactions() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) return;

    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const etherscanResponse = await fetch(
          `/api/transactions?address=${address}&chainId=${chainId}`,
          { cache: 'no-store' }
        );

        if (etherscanResponse.ok) {
          const etherscanData = await etherscanResponse.json();
          if (etherscanData?.error) {
            console.warn('Etherscan API error:', etherscanData.error, etherscanData.meta);
          } else if (Array.isArray(etherscanData.transactions)) {
            const mappedTransactions = etherscanData.transactions.map((tx: any) => ({
              ...tx,
              amount: BigInt(tx.amount || '0'),
              timestamp: Number(tx.timestamp || '0'),
            })) as Transaction[];
            setTransactions(mappedTransactions);
            return;
          }
        }

        const indexedEvents = await fetchIndexerEventsWithTimeout(address);

        if (indexedEvents.length > 0) {
          const indexedTransactions = indexedEvents.map((event) =>
            mapEventToTransaction(event, address)
          );
          setTransactions(indexedTransactions);
          return;
        }

        if (!publicClient) {
          setTransactions([]);
          return;
        }

        const latestBlock = await publicClient.getBlockNumber();
        const blocks = DEFAULT_LOOKBACK_BLOCKS;
        const scanStart = Date.now();

        const txs: Transaction[] = [];

        for (let i = 0; i < blocks && i < latestBlock; i++) {
          if (Date.now() - scanStart > SCAN_TIMEOUT_MS) {
            break;
          }

          const block = await publicClient.getBlock({
            blockNumber: latestBlock - BigInt(i),
            includeTransactions: true,
          });

          if (block.transactions) {
            block.transactions.forEach((tx: any) => {
              if (
                tx.from?.toLowerCase() === address.toLowerCase() ||
                tx.to?.toLowerCase() === address.toLowerCase()
              ) {
                txs.push({
                  hash: tx.hash,
                  from: tx.from || '',
                  to: tx.to || '',
                  assetAddress: tx.to || '',
                  amount: tx.value || BigInt(0),
                  timestamp: Number(block.timestamp),
                  status: 'SUCCESS',
                  type:
                    tx.from?.toLowerCase() === address.toLowerCase()
                      ? 'SELL'
                      : 'BUY',
                });
              }
            });
          }
        }

        setTransactions(txs);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [address, publicClient, chainId]);

  return {
    transactions,
    isLoading,
  };
}

/**
 * Hook pour suivre le statut d'une transaction spécifique
 */
export function useTransactionStatus(txHash: string | undefined) {
  const publicClient = usePublicClient();
  const [status, setStatus] = useState<'PENDING' | 'SUCCESS' | 'FAILED' | null>(null);

  useEffect(() => {
    if (!txHash || !publicClient) return;

    const checkStatus = async () => {
      try {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash as `0x${string}`,
        });
        
        setStatus(receipt.status === 'success' ? 'SUCCESS' : 'FAILED');
      } catch (error) {
        console.error('Error checking transaction status:', error);
        setStatus('FAILED');
      }
    };

    setStatus('PENDING');
    checkStatus();
  }, [txHash, publicClient]);

  return status;
}
