/**
 * Hook pour consommer l'endpoint /events de l'indexer
 * Récupère les dernières transactions on-chain
 */

import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';

export interface IndexerEvent {
  id: string;
  blockNumber: number;
  transactionHash: string;
  eventName: string;
  contractAddress: string;
  timestamp: number;
  args: Record<string, any>;
}

export function useIndexerEvents(limit: number = 10) {
  const { address } = useAccount();
  const [events, setEvents] = useState<IndexerEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setEvents([]);
      return;
    }

    async function fetchEvents() {
      setIsLoading(true);
      setError(null);

      try {
        const indexerUrl = process.env.NEXT_PUBLIC_INDEXER_URL || 'http://localhost:8080';
        const response = await fetch(`${indexerUrl}/events?address=${address}&limit=${limit}`);

        if (!response.ok) {
          // Si l'indexer n'est pas disponible, ne pas considérer ça comme une erreur bloquante
          if (response.status === 404 || response.status === 503) {
            console.warn('Indexer not available, using empty events');
            setEvents([]);
            return;
          }
          throw new Error(`Indexer error: ${response.status}`);
        }

        const data = await response.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error('Error fetching indexer events:', err);
        // Ne pas afficher d'erreur si l'indexer n'est pas démarré
        setError(null);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();

    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, [address, limit]);

  return {
    events,
    isLoading,
    error,
  };
}

// Hook pour récupérer les événements d'un contrat spécifique
export function useContractEvents(contractAddress: string | undefined, limit: number = 10) {
  const [events, setEvents] = useState<IndexerEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contractAddress) {
      setEvents([]);
      return;
    }

    async function fetchEvents() {
      setIsLoading(true);
      setError(null);

      try {
        const indexerUrl = process.env.NEXT_PUBLIC_INDEXER_URL || 'http://localhost:8080';
        const response = await fetch(
          `${indexerUrl}/events?contract=${contractAddress}&limit=${limit}`
        );

        if (!response.ok) {
          if (response.status === 404 || response.status === 503) {
            setEvents([]);
            return;
          }
          throw new Error(`Indexer error: ${response.status}`);
        }

        const data = await response.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error('Error fetching contract events:', err);
        setError(null);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();

    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, [contractAddress, limit]);

  return {
    events,
    isLoading,
    error,
  };
}
