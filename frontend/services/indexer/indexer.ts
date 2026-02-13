/**
 * Service Indexer - Synchronisation on-chain temps réel
 * Détecte les swaps, transfers, mint/burn et met à jour le frontend
 */

import { INDEXER_URL } from '@/config/contracts';

// Types d'événements supportés
export enum EventType {
  SWAP = 'Swap',
  TRANSFER = 'Transfer',
  MINT = 'Mint',
  BURN = 'Burn',
  APPROVAL = 'Approval',
  LIQUIDITY_ADD = 'LiquidityAdd',
  LIQUIDITY_REMOVE = 'LiquidityRemove',
}

export interface BlockchainEvent {
  id: string;
  blockNumber: number;
  transactionHash: string;
  eventType: EventType;
  contractAddress: string;
  timestamp: number;
  from?: string;
  to?: string;
  amount?: string;
  token0?: string;
  token1?: string;
  amount0?: string;
  amount1?: string;
  args: Record<string, any>;
}

export interface EventSubscription {
  unsubscribe: () => void;
}

type EventCallback = (event: BlockchainEvent) => void;

/**
 * Service principal de synchronisation avec l'indexer
 */
export class IndexerSyncService {
  private static ws: WebSocket | null = null;
  private static subscribers = new Map<string, Set<EventCallback>>();
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 5;
  private static reconnectDelay = 3000;
  private static isConnecting = false;

  /**
   * Initialise la connexion WebSocket
   */
  static connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = INDEXER_URL.replace('http', 'ws').replace('/graphql', '/events/stream');

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Indexer WebSocket connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      };

      this.ws.onmessage = (message) => {
        try {
          const event: BlockchainEvent = JSON.parse(message.data);
          this.notifySubscribers(event);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Indexer WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('🔌 Indexer WebSocket disconnected');
        this.isConnecting = false;
        this.ws = null;

        // Tentative de reconnexion
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          setTimeout(() => this.connect(), this.reconnectDelay);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  /**
   * Ferme la connexion WebSocket
   */
  static disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
  }

  /**
   * S'abonne aux événements d'un type spécifique
   */
  static subscribe(eventType: EventType | 'ALL', callback: EventCallback): EventSubscription {
    const key = eventType;
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // Démarre la connexion WebSocket si nécessaire
    if (!this.ws) {
      this.connect();
    }

    return {
      unsubscribe: () => {
        const subs = this.subscribers.get(key);
        if (subs) {
          subs.delete(callback);
          if (subs.size === 0) {
            this.subscribers.delete(key);
          }
        }
      },
    };
  }

  /**
   * Notifie tous les abonnés d'un nouvel événement
   */
  private static notifySubscribers(event: BlockchainEvent): void {
    // Notifie les abonnés au type spécifique
    const typeSubscribers = this.subscribers.get(event.eventType);
    if (typeSubscribers) {
      typeSubscribers.forEach((callback) => callback(event));
    }

    // Notifie les abonnés "ALL"
    const allSubscribers = this.subscribers.get('ALL');
    if (allSubscribers) {
      allSubscribers.forEach((callback) => callback(event));
    }
  }

  /**
   * Récupère les derniers événements via polling (fallback si WebSocket indisponible)
   */
  static async fetchRecentEvents(
    filters?: {
      address?: string;
      contractAddress?: string;
      eventType?: EventType;
      limit?: number;
    }
  ): Promise<BlockchainEvent[]> {
    try {
      const baseUrl = INDEXER_URL.replace('/graphql', '/events');
      const params = new URLSearchParams();

      if (filters?.address) params.append('address', filters.address);
      if (filters?.contractAddress) params.append('contract', filters.contractAddress);
      if (filters?.eventType) params.append('type', filters.eventType);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const url = `${baseUrl}?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404 || response.status === 503) {
          console.warn('Indexer not available');
          return [];
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.events || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  /**
   * Détecte si un événement concerne un utilisateur spécifique
   */
  static isUserInvolved(event: BlockchainEvent, userAddress: string): boolean {
    const address = userAddress.toLowerCase();
    return (
      event.from?.toLowerCase() === address ||
      event.to?.toLowerCase() === address ||
      event.args?.from?.toLowerCase() === address ||
      event.args?.to?.toLowerCase() === address ||
      event.args?.sender?.toLowerCase() === address ||
      event.args?.recipient?.toLowerCase() === address
    );
  }

  /**
   * Formate un événement pour l'affichage
   */
  static formatEvent(event: BlockchainEvent): {
    title: string;
    description: string;
    icon: string;
    color: string;
  } {
    switch (event.eventType) {
      case EventType.SWAP:
        return {
          title: 'Token Swap',
          description: `Swapped ${event.amount0} for ${event.amount1}`,
          icon: '🔄',
          color: 'blue',
        };

      case EventType.TRANSFER:
        return {
          title: 'Token Transfer',
          description: `${event.amount} tokens transferred`,
          icon: '📤',
          color: 'green',
        };

      case EventType.MINT:
        return {
          title: 'Tokens Minted',
          description: `${event.amount} tokens created`,
          icon: '✨',
          color: 'purple',
        };

      case EventType.BURN:
        return {
          title: 'Tokens Burned',
          description: `${event.amount} tokens destroyed`,
          icon: '🔥',
          color: 'red',
        };

      case EventType.LIQUIDITY_ADD:
        return {
          title: 'Liquidity Added',
          description: `Added ${event.amount0} + ${event.amount1}`,
          icon: '💧',
          color: 'cyan',
        };

      case EventType.LIQUIDITY_REMOVE:
        return {
          title: 'Liquidity Removed',
          description: `Removed ${event.amount0} + ${event.amount1}`,
          icon: '💨',
          color: 'orange',
        };

      default:
        return {
          title: event.eventType,
          description: 'Blockchain event',
          icon: '📋',
          color: 'gray',
        };
    }
  }
}

/**
 * Classe helper pour la détection de types d'événements spécifiques
 */
export class EventDetector {
  /**
   * Vérifie si un événement est un swap
   */
  static isSwap(event: BlockchainEvent): boolean {
    return event.eventType === EventType.SWAP;
  }

  /**
   * Vérifie si un événement est un transfer
   */
  static isTransfer(event: BlockchainEvent): boolean {
    return event.eventType === EventType.TRANSFER;
  }

  /**
   * Vérifie si un événement est un mint
   */
  static isMint(event: BlockchainEvent): boolean {
    return event.eventType === EventType.MINT;
  }

  /**
   * Vérifie si un événement est un burn
   */
  static isBurn(event: BlockchainEvent): boolean {
    return event.eventType === EventType.BURN;
  }

  /**
   * Extrait les montants d'un swap
   */
  static extractSwapAmounts(event: BlockchainEvent): {
    token0: string;
    token1: string;
    amount0: string;
    amount1: string;
  } | null {
    if (!this.isSwap(event)) return null;

    return {
      token0: event.token0 || event.args.token0 || '',
      token1: event.token1 || event.args.token1 || '',
      amount0: event.amount0 || event.args.amount0In || event.args.amount0Out || '0',
      amount1: event.amount1 || event.args.amount1In || event.args.amount1Out || '0',
    };
  }

  /**
   * Extrait les adresses d'un transfer
   */
  static extractTransferAddresses(event: BlockchainEvent): {
    from: string;
    to: string;
    amount: string;
  } | null {
    if (!this.isTransfer(event)) return null;

    return {
      from: event.from || event.args.from || '',
      to: event.to || event.args.to || '',
      amount: event.amount || event.args.value || event.args.amount || '0',
    };
  }
}
