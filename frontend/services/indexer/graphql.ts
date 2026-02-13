/**
 * Service Indexer - Client GraphQL
 * Gère les requêtes à l'indexer (The Graph, etc.)
 */

import { INDEXER_URL } from '@/config/contracts';

export class IndexerService {
  /**
   * Exécute une requête GraphQL
   */
  static async query<T = any>(
    query: string,
    variables?: Record<string, any>
  ): Promise<T | null> {
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
        console.error('GraphQL errors:', result.errors);
        throw new Error(result.errors[0].message);
      }

      return result.data;
    } catch (error) {
      console.error('Indexer query error:', error);
      return null;
    }
  }

  /**
   * Récupère les actifs d'un utilisateur
   */
  static async getUserAssets(address: string) {
    const query = `
      query GetUserAssets($address: String!) {
        investments(where: { investor: $address }) {
          id
          asset {
            id
            name
            symbol
            valueUSD
          }
          amount
          currentValue
        }
      }
    `;

    return this.query(query, { address: address.toLowerCase() });
  }

  /**
   * Récupère les statistiques de la plateforme
   */
  static async getPlatformStats() {
    const query = `
      query GetPlatformStats {
        platformStats(id: "platform") {
          totalAssets
          totalValueLocked
          totalUsers
          totalTransactions
          volume24h
        }
      }
    `;

    return this.query(query);
  }

  /**
   * Récupère l'historique des transactions
   */
  static async getTransactionHistory(address: string, limit: number = 10) {
    const query = `
      query GetTransactionHistory($address: String!, $limit: Int!) {
        transactions(
          where: { or: [{ from: $address }, { to: $address }] }
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

    return this.query(query, { address: address.toLowerCase(), limit });
  }

  /**
   * Recherche d'actifs par nom ou symbole
   */
  static async searchAssets(searchTerm: string) {
    const query = `
      query SearchAssets($search: String!) {
        assets(
          where: {
            or: [
              { name_contains_nocase: $search }
              { symbol_contains_nocase: $search }
            ]
          }
          first: 10
        ) {
          id
          name
          symbol
          valueUSD
          totalSupply
          isActive
        }
      }
    `;

    return this.query(query, { search: searchTerm });
  }
}
