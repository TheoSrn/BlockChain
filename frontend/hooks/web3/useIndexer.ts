/**
 * Hook useIndexer - Synchronisation on-chain en temps réel
 * Détecte automatiquement les swaps, transfers, mint/burn
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import {
  IndexerSyncService,
  EventType,
  BlockchainEvent,
  EventSubscription,
} from '@/services/indexer/indexer';

export interface UseIndexerOptions {
  /**
   * Types d'événements à écouter ('ALL' pour tous)
   */
  eventTypes?: EventType[] | 'ALL';

  /**
   * Filtrer uniquement les événements impliquant l'utilisateur connecté
   */
  userOnly?: boolean;

  /**
   * Adresse de contrat spécifique à surveiller
   */
  contractAddress?: string;

  /**
   * Utiliser polling au lieu de WebSocket
   */
  usePolling?: boolean;

  /**
   * Intervalle de polling en ms (si usePolling=true)
   */
  pollingInterval?: number;

  /**
   * Limite d'événements à garder en mémoire
   */
  maxEvents?: number;

  /**
   * Callback appelé lors d'un nouvel événement
   */
  onNewEvent?: (event: BlockchainEvent) => void;
}

export interface UseIndexerReturn {
  /**
   * Liste des événements récents
   */
  events: BlockchainEvent[];

  /**
   * État de chargement
   */
  isLoading: boolean;

  /**
   * Erreur éventuelle
   */
  error: string | null;

  /**
   * État de la connexion WebSocket
   */
  isConnected: boolean;

  /**
   * Nombre total d'événements reçus
   */
  totalEvents: number;

  /**
   * Rafraîchir manuellement les événements
   */
  refresh: () => Promise<void>;

  /**
   * Effacer tous les événements
   */
  clearEvents: () => void;

  /**
   * Filtrer les événements par type
   */
  filterByType: (type: EventType) => BlockchainEvent[];

  /**
   * Dernière mise à jour
   */
  lastUpdate: Date | null;
}

/**
 * Hook principal pour la synchronisation avec l'indexer
 */
export function useIndexer(options: UseIndexerOptions = {}): UseIndexerReturn {
  const { address } = useAccount();
  const {
    eventTypes = 'ALL',
    userOnly = false,
    contractAddress,
    usePolling = false,
    pollingInterval = 10000,
    maxEvents = 50,
    onNewEvent,
  } = options;

  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const subscriptionsRef = useRef<EventSubscription[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Ajoute un nouvel événement à la liste
   */
  const addEvent = useCallback(
    (event: BlockchainEvent) => {
      // Filtre par utilisateur si demandé
      if (userOnly && address && !IndexerSyncService.isUserInvolved(event, address)) {
        return;
      }

      // Filtre par contrat si spécifié
      if (contractAddress && event.contractAddress.toLowerCase() !== contractAddress.toLowerCase()) {
        return;
      }

      setEvents((prev) => {
        // Évite les doublons
        if (prev.some((e) => e.id === event.id)) {
          return prev;
        }

        // Limite le nombre d'événements
        const newEvents = [event, ...prev].slice(0, maxEvents);
        return newEvents;
      });

      setTotalEvents((prev) => prev + 1);
      setLastUpdate(new Date());

      // Appelle le callback si fourni
      if (onNewEvent) {
        onNewEvent(event);
      }
    },
    [address, userOnly, contractAddress, maxEvents, onNewEvent]
  );

  /**
   * Récupère les événements via polling
   */
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filters: any = {
        limit: maxEvents,
      };

      if (userOnly && address) {
        filters.address = address;
      }

      if (contractAddress) {
        filters.contractAddress = contractAddress;
      }

      const fetchedEvents = await IndexerSyncService.fetchRecentEvents(filters);

      setEvents(fetchedEvents);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  }, [address, userOnly, contractAddress, maxEvents]);

  /**
   * Initialise les souscriptions WebSocket
   */
  useEffect(() => {
    if (usePolling) {
      // Mode polling
      fetchEvents();
      pollingIntervalRef.current = setInterval(fetchEvents, pollingInterval);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    } else {
      // Mode WebSocket
      const typesToSubscribe = eventTypes === 'ALL' ? ['ALL'] : eventTypes;

      typesToSubscribe.forEach((type) => {
        const subscription = IndexerSyncService.subscribe(type as any, addEvent);
        subscriptionsRef.current.push(subscription);
      });

      setIsConnected(true);

      // Charge également l'historique initial
      fetchEvents();

      return () => {
        subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
        subscriptionsRef.current = [];
        setIsConnected(false);
      };
    }
  }, [eventTypes, usePolling, pollingInterval, addEvent, fetchEvents]);

  /**
   * Filtre les événements par type
   */
  const filterByType = useCallback(
    (type: EventType): BlockchainEvent[] => {
      return events.filter((e) => e.eventType === type);
    },
    [events]
  );

  /**
   * Efface tous les événements
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
    setTotalEvents(0);
    setLastUpdate(null);
  }, []);

  return {
    events,
    isLoading,
    error,
    isConnected: !usePolling && isConnected,
    totalEvents,
    refresh: fetchEvents,
    clearEvents,
    filterByType,
    lastUpdate,
  };
}

/**
 * Hook spécialisé pour surveiller les swaps
 */
export function useSwapEvents(contractAddress?: string) {
  return useIndexer({
    eventTypes: [EventType.SWAP],
    contractAddress,
    maxEvents: 20,
  });
}

/**
 * Hook spécialisé pour surveiller les transfers
 */
export function useTransferEvents(userAddress?: string) {
  return useIndexer({
    eventTypes: [EventType.TRANSFER],
    userOnly: true,
    maxEvents: 30,
  });
}

/**
 * Hook spécialisé pour surveiller les mint/burn
 */
export function useMintBurnEvents(contractAddress?: string) {
  return useIndexer({
    eventTypes: [EventType.MINT, EventType.BURN],
    contractAddress,
    maxEvents: 15,
  });
}

/**
 * Hook pour afficher les dernières activités de l'utilisateur
 */
export function useUserActivity() {
  const { address } = useAccount();
  const [activitySummary, setActivitySummary] = useState({
    swaps: 0,
    transfers: 0,
    mints: 0,
    burns: 0,
  });

  const { events } = useIndexer({
    eventTypes: 'ALL',
    userOnly: true,
    maxEvents: 100,
  });

  useEffect(() => {
    const summary = {
      swaps: events.filter((e) => e.eventType === EventType.SWAP).length,
      transfers: events.filter((e) => e.eventType === EventType.TRANSFER).length,
      mints: events.filter((e) => e.eventType === EventType.MINT).length,
      burns: events.filter((e) => e.eventType === EventType.BURN).length,
    };

    setActivitySummary(summary);
  }, [events]);

  return {
    events,
    summary: activitySummary,
    totalActivity: events.length,
  };
}
