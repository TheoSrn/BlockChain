/**
 * Hook pour les statistiques utilisateur
 */

import { useAccount } from 'wagmi';
import { useIndexerQuery } from './useIndexer';

export function useUserStats() {
  const { address } = useAccount();

  const query = `
    query GetUserStats($address: String!) {
      user(id: $address) {
        id
        totalInvestments
        portfolioValue
        totalPnL
        investmentCount
        transactions {
          id
          type
          amount
          timestamp
        }
      }
    }
  `;

  return useIndexerQuery(
    query,
    { address: address?.toLowerCase() },
    { enabled: !!address, refetchInterval: 30000 }
  );
}

/**
 * Hook pour l'activité récente de l'utilisateur
 */
export function useUserActivity(limit: number = 5) {
  const { address } = useAccount();

  const query = `
    query GetUserActivity($address: String!, $limit: Int!) {
      transactions(
        where: { or: [{ from: $address }, { to: $address }] }
        first: $limit
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        hash
        type
        amount
        timestamp
        asset {
          name
          symbol
        }
      }
    }
  `;

  return useIndexerQuery(
    query,
    { address: address?.toLowerCase(), limit },
    { enabled: !!address, refetchInterval: 30000 }
  );
}
