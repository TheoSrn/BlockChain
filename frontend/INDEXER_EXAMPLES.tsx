/**
 * EXEMPLES D'UTILISATION - Synchronisation Indexer
 * 
 * Ce fichier montre comment utiliser le nouveau système de synchronisation
 * on-chain dans différentes situations.
 */

import { useIndexer, useSwapEvents, useTransferEvents, useMintBurnEvents, useUserActivity } from '@/hooks/web3/useIndexer';
import { EventType } from '@/services/indexer/indexer';

// ============================================================================
// EXEMPLE 1 : Écouter TOUS les événements on-chain
// ============================================================================
export function AllEventsExample() {
  const { events, isConnected, totalEvents, lastUpdate } = useIndexer({
    eventTypes: 'ALL',
    maxEvents: 50,
  });

  return (
    <div>
      <h2>All Events ({totalEvents})</h2>
      <p>Connected: {isConnected ? '✅' : '❌'}</p>
      <p>Last update: {lastUpdate?.toLocaleTimeString()}</p>
      
      {events.map(event => (
        <div key={event.id}>
          {event.eventType} - {event.transactionHash}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EXEMPLE 2 : Écouter uniquement les SWAPS d'un contrat Uniswap
// ============================================================================
export function SwapEventsExample() {
  const UNISWAP_ROUTER = '0x...'; // Adresse du router Uniswap
  
  const { events, isConnected } = useSwapEvents(UNISWAP_ROUTER);

  return (
    <div>
      <h2>Recent Swaps</h2>
      {events.map(event => (
        <div key={event.id}>
          Swap: {event.amount0} ⇄ {event.amount1}
          <br />
          Tx: {event.transactionHash.slice(0,10)}...
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EXEMPLE 3 : Écouter les TRANSFERS de l'utilisateur connecté
// ============================================================================
export function UserTransfersExample() {
  const { events } = useTransferEvents();

  return (
    <div>
      <h2>My Transfers</h2>
      {events.map(event => (
        <div key={event.id}>
          From: {event.from} → To: {event.to}
          <br />
          Amount: {event.amount}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EXEMPLE 4 : Écouter les MINT/BURN d'un token spécifique
// ============================================================================
export function MintBurnExample() {
  const TOKEN_ADDRESS = '0x...'; // Adresse du token ERC20
  
  const { events, filterByType } = useMintBurnEvents(TOKEN_ADDRESS);

  const mints = filterByType(EventType.MINT);
  const burns = filterByType(EventType.BURN);

  return (
    <div>
      <h2>Token Activity</h2>
      <div>
        <h3>Minted: {mints.length}</h3>
        {mints.map(event => (
          <div key={event.id}>✨ {event.amount} tokens minted</div>
        ))}
      </div>
      <div>
        <h3>Burned: {burns.length}</h3>
        {burns.map(event => (
          <div key={event.id}>🔥 {event.amount} tokens burned</div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXEMPLE 5 : Statistiques d'activité utilisateur
// ============================================================================
export function UserActivitySummary() {
  const { summary, totalActivity, events } = useUserActivity();

  return (
    <div>
      <h2>Your Activity</h2>
      <div className="stats">
        <div>Swaps: {summary.swaps}</div>
        <div>Transfers: {summary.transfers}</div>
        <div>Mints: {summary.mints}</div>
        <div>Burns: {summary.burns}</div>
      </div>
      <p>Total events: {totalActivity}</p>
    </div>
  );
}

// ============================================================================
// EXEMPLE 6 : Notification en temps réel lors d'un nouvel événement
// ============================================================================
export function RealtimeNotificationExample() {
  const { events } = useIndexer({
    eventTypes: [EventType.SWAP, EventType.TRANSFER],
    userOnly: true,
    onNewEvent: (event) => {
      // Appelé automatiquement à chaque nouvel événement
      console.log('📢 New event:', event);
      
      // Afficher une notification
      if (Notification.permission === 'granted') {
        new Notification('New Transaction!', {
          body: `${event.eventType} - ${event.transactionHash.slice(0,10)}...`,
        });
      }
    },
  });

  return (
    <div>
      <h2>Realtime Notifications</h2>
      <p>You have {events.length} recent transactions</p>
    </div>
  );
}

// ============================================================================
// EXEMPLE 7 : Mode POLLING (fallback si WebSocket indisponible)
// ============================================================================
export function PollingModeExample() {
  const { events, isConnected } = useIndexer({
    eventTypes: 'ALL',
    usePolling: true,          // Force le mode polling
    pollingInterval: 5000,     // Rafraîchir toutes les 5 secondes
  });

  return (
    <div>
      <h2>Polling Mode</h2>
      <p>WebSocket: {isConnected ? 'Connected' : 'Polling mode'}</p>
      <p>Events: {events.length}</p>
    </div>
  );
}

// ============================================================================
// EXEMPLE 8 : Rafraîchissement manuel et effacement
// ============================================================================
export function ManualControlExample() {
  const { events, refresh, clearEvents } = useIndexer({
    eventTypes: 'ALL',
  });

  return (
    <div>
      <h2>Manual Controls</h2>
      <button onClick={refresh}>🔄 Refresh</button>
      <button onClick={clearEvents}>🗑️ Clear</button>
      <p>Events: {events.length}</p>
    </div>
  );
}

// ============================================================================
// EXEMPLE 9 : Filtrage des événements d'un utilisateur spécifique
// ============================================================================
export function FilteredEventsExample() {
  const TARGET_ADDRESS = '0x...'; // Adresse à surveiller
  
  const { events } = useIndexer({
    eventTypes: 'ALL',
    userOnly: false, // On veut tous les événements
  });

  // Filtrer manuellement les événements
  const filteredEvents = events.filter(event => 
    event.from?.toLowerCase() === TARGET_ADDRESS.toLowerCase() ||
    event.to?.toLowerCase() === TARGET_ADDRESS.toLowerCase()
  );

  return (
    <div>
      <h2>Filtered Events</h2>
      <p>Events involving {TARGET_ADDRESS}: {filteredEvents.length}</p>
    </div>
  );
}

// ============================================================================
// EXEMPLE 10 : Affichage formaté avec icônes et couleurs
// ============================================================================
import { IndexerSyncService } from '@/services/indexer/indexer';

export function FormattedEventsExample() {
  const { events } = useIndexer({
    eventTypes: 'ALL',
    maxEvents: 10,
  });

  return (
    <div>
      <h2>Formatted Events</h2>
      {events.map(event => {
        const formatted = IndexerSyncService.formatEvent(event);
        
        return (
          <div 
            key={event.id}
            style={{ 
              borderLeft: `4px solid ${formatted.color}`,
              padding: '12px',
              margin: '8px 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>{formatted.icon}</span>
              <div>
                <h3>{formatted.title}</h3>
                <p>{formatted.description}</p>
                <small>Tx: {event.transactionHash.slice(0,10)}...</small>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// UTILISATION AVANCÉE : Combiner plusieurs hooks
// ============================================================================
export function CombinedExample() {
  // Hook 1: Tous les swaps
  const swaps = useSwapEvents();
  
  // Hook 2: Transfers de l'utilisateur
  const transfers = useTransferEvents();
  
  // Hook 3: Mint/burn d'un token
  const mintBurns = useMintBurnEvents('0x...');
  
  // Hook 4: Statistiques globales
  const activity = useUserActivity();

  return (
    <div>
      <h2>Combined Dashboard</h2>
      
      <div className="stats-grid">
        <div>Swaps: {swaps.events.length}</div>
        <div>Transfers: {transfers.events.length}</div>
        <div>Mint/Burns: {mintBurns.events.length}</div>
        <div>Total Activity: {activity.totalActivity}</div>
      </div>

      <div className="recent-swaps">
        <h3>Recent Swaps</h3>
        {swaps.events.slice(0, 5).map(event => (
          <div key={event.id}>
            {event.amount0} ⇄ {event.amount1}
          </div>
        ))}
      </div>

      <div className="recent-transfers">
        <h3>My Transfers</h3>
        {transfers.events.slice(0, 5).map(event => (
          <div key={event.id}>
            {event.from?.slice(0,6)}... → {event.to?.slice(0,6)}...
          </div>
        ))}
      </div>
    </div>
  );
}
