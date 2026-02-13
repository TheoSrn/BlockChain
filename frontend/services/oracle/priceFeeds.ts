/**
 * Service Oracle - Agrégation et validation de prix
 */

import { readContract } from '@wagmi/core';
import { config } from '@/config/wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

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
] as const;

export class OracleService {
  /**
   * Récupère le dernier prix d'un actif
   */
  static async getLatestPrice(assetAddress: string): Promise<{
    price: bigint;
    timestamp: number;
  } | null> {
    try {
      const result = await readContract(config, {
        address: CONTRACT_ADDRESSES.PRICE_ORACLE as `0x${string}`,
        abi: PRICE_ORACLE_ABI,
        functionName: 'getLatestPrice',
        args: [assetAddress as `0x${string}`],
      });

      const [price, timestamp] = result as [bigint, bigint];

      return {
        price,
        timestamp: Number(timestamp),
      };
    } catch (error) {
      console.error('Error fetching price:', error);
      return null;
    }
  }

  /**
   * Valide la fraîcheur d'un prix
   */
  static isPriceStale(timestamp: number, maxAgeSeconds: number = 3600): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime - timestamp > maxAgeSeconds;
  }

  /**
   * Agrège les prix de plusieurs sources
   */
  static aggregatePrices(prices: number[]): number {
    if (prices.length === 0) return 0;
    if (prices.length === 1) return prices[0];

    // Simple moyenne - en production, utiliser médiane
    const sum = prices.reduce((acc, p) => acc + p, 0);
    return sum / prices.length;
  }

  /**
   * Détecte les anomalies de prix
   */
  static detectPriceAnomaly(
    currentPrice: number,
    historicalPrices: number[],
    deviationThreshold: number = 0.1 // 10%
  ): boolean {
    if (historicalPrices.length === 0) return false;

    const avgPrice = historicalPrices.reduce((a, b) => a + b, 0) / historicalPrices.length;
    const deviation = Math.abs(currentPrice - avgPrice) / avgPrice;

    return deviation > deviationThreshold;
  }
}
