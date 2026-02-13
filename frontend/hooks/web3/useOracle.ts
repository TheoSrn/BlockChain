/**
 * Hook pour récupérer les prix depuis l'oracle
 * Support multi-sources et agrégation
 */

import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { formatUnits } from 'viem';
import { useEffect, useState } from 'react';

// ABI minimal pour Price Oracle
const PRICE_ORACLE_ABI = [
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'getLatestPrice',
    outputs: [
      { name: 'price', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'getPriceHistory',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'price', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface PriceData {
  price: string;
  timestamp: number;
  formattedPrice: string;
}

export function useOracle(assetAddress: string | undefined) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);

  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PRICE_ORACLE as `0x${string}`,
    abi: PRICE_ORACLE_ABI,
    functionName: 'getLatestPrice',
    args: assetAddress ? [assetAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!assetAddress,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  useEffect(() => {
    if (data) {
      const [price, timestamp] = data as [bigint, bigint];
      const formattedPrice = formatUnits(price, 6); // Assuming 6 decimals for USD

      setPriceData({
        price: price.toString(),
        timestamp: Number(timestamp),
        formattedPrice: `$${parseFloat(formattedPrice).toFixed(2)}`,
      });
    }
  }, [data]);

  return {
    priceData,
    isLoading,
    error,
  };
}

export function usePriceHistory(assetAddress: string | undefined) {
  const { data: history, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.PRICE_ORACLE as `0x${string}`,
    abi: PRICE_ORACLE_ABI,
    functionName: 'getPriceHistory',
    args: assetAddress ? [assetAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!assetAddress,
    },
  });

  const formattedHistory = history
    ? (history as any[]).map((item: any) => ({
        price: formatUnits(item.price, 6),
        timestamp: Number(item.timestamp),
      }))
    : [];

  return {
    history: formattedHistory,
    isLoading,
  };
}

/**
 * Hook pour surveiller les changements de prix
 */
export function usePriceAlert(
  assetAddress: string | undefined,
  targetPrice: number,
  onAlert: () => void
) {
  const { priceData } = useOracle(assetAddress);

  useEffect(() => {
    if (priceData && parseFloat(priceData.formattedPrice.replace('$', '')) >= targetPrice) {
      onAlert();
    }
  }, [priceData, targetPrice, onAlert]);

  return priceData;
}
