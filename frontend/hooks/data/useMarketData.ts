/**
 * Hook pour récupérer les données de marché
 */

import { useIndexerQuery } from './useIndexer';

export function useMarketData() {
  const query = `
    query GetMarketData {
      platformStats {
        totalAssets
        totalValueLocked
        totalUsers
        totalTransactions
        volume24h
      }
      assets(orderBy: valueUSD, orderDirection: desc, first: 10) {
        id
        name
        symbol
        valueUSD
        totalSupply
        isActive
      }
    }
  `;

  return useIndexerQuery(query, {}, { refetchInterval: 60000 });
}

/**
 * Hook pour les statistiques d'un actif spécifique
 */
export function useAssetStats(assetAddress: string | undefined) {
  const query = `
    query GetAssetStats($address: String!) {
      asset(id: $address) {
        id
        name
        symbol
        totalSupply
        valueUSD
        holders: investments_aggregate {
          aggregate {
            count
          }
        }
        volume24h
        priceChange24h
      }
    }
  `;

  return useIndexerQuery(
    query,
    { address: assetAddress?.toLowerCase() },
    { enabled: !!assetAddress, refetchInterval: 30000 }
  );
}
