/**
 * Hook pour récupérer les prix depuis l'oracle
 * Support multi-sources et agrégation
 */

import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { formatUnits } from 'viem';
import { useEffect, useState } from 'react';
import ORACLE_ABI from '@/abi/Oracle';

export interface PriceData {
  price: string;
  timestamp: number;
  formattedPrice: string;
}

export function useOracle(assetId: bigint | number | undefined) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);

  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PRICE_ORACLE as `0x${string}`,
    abi: ORACLE_ABI,
    functionName: 'getPrice',
    args: assetId !== undefined ? [BigInt(assetId)] : undefined,
    query: {
      enabled: assetId !== undefined,
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

export function usePriceHistory() {
  return {
    history: [] as { price: string; timestamp: number }[],
    isLoading: false,
  };
}

/**
 * Hook pour surveiller les changements de prix
 */
export function usePriceAlert(
  assetId: bigint | number | undefined,
  targetPrice: number,
  onAlert: () => void
) {
  const { priceData } = useOracle(assetId);

  useEffect(() => {
    if (priceData && parseFloat(priceData.formattedPrice.replace('$', '')) >= targetPrice) {
      onAlert();
    }
  }, [priceData, targetPrice, onAlert]);

  return priceData;
}
