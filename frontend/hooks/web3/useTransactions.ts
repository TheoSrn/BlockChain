/**
 * Hook pour récupérer l'historique des transactions
 */

import { useAccount, usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';
import type { Transaction } from '@/types';

export function useTransactions() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address || !publicClient) return;

    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        // In production, use an indexer/API for transaction history
        // This is a placeholder implementation
        const latestBlock = await publicClient.getBlockNumber();
        const blocks = 100; // Check last 100 blocks
        
        const txs: Transaction[] = [];
        
        // This is very inefficient - use an indexer in production!
        for (let i = 0; i < blocks && i < latestBlock; i++) {
          const block = await publicClient.getBlock({
            blockNumber: latestBlock - BigInt(i),
            includeTransactions: true,
          });
          
          // Filter transactions involving the user
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
                  amount: tx.value || 0n,
                  timestamp: Number(block.timestamp),
                  status: 'SUCCESS',
                  type: tx.from?.toLowerCase() === address.toLowerCase() ? 'SELL' : 'BUY',
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
  }, [address, publicClient]);

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
