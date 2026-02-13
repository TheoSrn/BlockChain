/**
 * Hook pour requêter l'indexer GraphQL
 * Utilise une API GraphQL pour des requêtes complexes
 */

import { useState, useEffect } from 'react';
import { INDEXER_URL } from '@/config/contracts';

interface UseIndexerOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export function useIndexerQuery<T = any>(
  query: string,
  variables?: Record<string, any>,
  options?: UseIndexerOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (options?.enabled === false) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(INDEXER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        setData(result.data);
      } catch (err) {
        setError(err as Error);
        console.error('Indexer query error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Setup refetch interval if specified
    if (options?.refetchInterval) {
      const interval = setInterval(fetchData, options.refetchInterval);
      return () => clearInterval(interval);
    }
  }, [query, JSON.stringify(variables), options?.enabled, options?.refetchInterval]);

  return {
    data,
    isLoading,
    error,
  };
}

/**
 * Hook pour récupérer les actifs d'un utilisateur via l'indexer
 */
export function useUserAssetsIndexer(userAddress: string | undefined) {
  const query = `
    query GetUserAssets($address: String!) {
      investments(where: { investor: $address }) {
        id
        asset {
          id
          name
          symbol
          totalSupply
          valueUSD
        }
        amount
        investedAt
        currentValue
      }
    }
  `;

  return useIndexerQuery(
    query,
    { address: userAddress?.toLowerCase() },
    { enabled: !!userAddress, refetchInterval: 30000 }
  );
}

/**
 * Hook pour récupérer les transactions récentes
 */
export function useRecentTransactions(limit: number = 10) {
  const query = `
    query GetRecentTransactions($limit: Int!) {
      transactions(
        first: $limit
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        hash
        from
        to
        amount
        timestamp
        type
        status
      }
    }
  `;

  return useIndexerQuery(query, { limit }, { refetchInterval: 15000 });
}
