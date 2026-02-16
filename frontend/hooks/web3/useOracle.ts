/**
 * Oracle Hooks - On-Chain Price Feeds for Real-World Assets & NFT Collections
 * 
 * This oracle provides decentralized price data for tokenized real-world assets,
 * including real estate, commodities, art, and NFT collections.
 * 
 * Features:
 * - On-chain price storage for transparency
 * - Real-time price updates with automatic refresh
 * - Support for multiple asset types (tokens and NFT collections)
 * - Timestamp verification for data freshness
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

/**
 * Hook to fetch price data from the on-chain oracle
 * @param assetId - The ID of the asset/collection to fetch price for
 * @returns Price data including raw price, timestamp, and formatted price
 */
export function useOracle(assetId: bigint | number | undefined) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);

  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PRICE_ORACLE as `0x${string}`,
    abi: ORACLE_ABI,
    functionName: 'getPrice',
    args: assetId !== undefined ? [BigInt(assetId)] : undefined,
    query: {
      enabled: assetId !== undefined,
      refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    },
  });

  useEffect(() => {
    if (data) {
      const [price, timestamp] = data as [bigint, bigint];
      const priceInUnits = formatUnits(price, 6); // Assuming 6 decimals for USD pricing
      const numericPrice = parseFloat(priceInUnits);
      
      // Format with thousands separators and 2 decimal places
      const formattedPrice = `$${numericPrice.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

      setPriceData({
        price: price.toString(),
        timestamp: Number(timestamp),
        formattedPrice: formattedPrice,
      });
    }
  }, [data]);

  return {
    priceData,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch asset information from the oracle
 * @param assetId - The ID of the asset to fetch information for
 * @returns Asset information including NFT address, token address, and existence status
 */
export function useOracleAsset(assetId: bigint | number | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PRICE_ORACLE as `0x${string}`,
    abi: ORACLE_ABI,
    functionName: 'getAsset',
    args: assetId !== undefined ? [BigInt(assetId)] : undefined,
    query: {
      enabled: assetId !== undefined,
    },
  });

  return {
    asset: data ? {
      nft: (data as [string, string, boolean])[0],
      token: (data as [string, string, boolean])[1],
      exists: (data as [string, string, boolean])[2],
    } : null,
    isLoading,
    error,
  };
}

/**
 * Hook to get price history (placeholder for future implementation)
 * In production, this would query historical price data from events or indexer
 */
export function usePriceHistory() {
  return {
    history: [] as { price: string; timestamp: number }[],
    isLoading: false,
  };
}

/**
 * Hook to monitor price changes and trigger alerts
 * @param assetId - The ID of the asset to monitor
 * @param targetPrice - Price threshold to trigger alert
 * @param onAlert - Callback function when price reaches threshold
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
