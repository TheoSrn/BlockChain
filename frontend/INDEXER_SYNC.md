# 🔄 Synchronisation On-Chain - Documentation

## Vue d'ensemble

Le système de synchronisation on-chain permet de détecter automatiquement les événements blockchain (swaps, transfers, mint, burn) et de mettre à jour le frontend en temps réel.

## 📁 Architecture

```
frontend/
├── services/indexer/
│   ├── indexer.ts          # Service principal avec WebSocket
│   └── graphql.ts          # Client GraphQL (existant)
├── hooks/web3/
│   └── useIndexer.ts       # Hook React pour consommer les événements
└── app/dashboard/
    └── page.tsx            # Exemple d'intégration
```

## 🚀 Fonctionnalités

### ✅ Détection automatique d'événements
- **Swaps** (Uniswap, DEX)
- **Transfers** (ERC20, ERC721)
- **Mint / Burn** (tokens)
- **Liquidity Add / Remove**
- **Approvals**

### ✅ Modes de synchronisation
- **WebSocket** : Temps réel (préféré)
- **Polling** : Fallback si WebSocket indisponible

### ✅ Filtrage avancé
- Par type d'événement (`SWAP`, `TRANSFER`, etc.)
- Par utilisateur connecté
- Par adresse de contrat

### ✅ UI enrichie
- Icônes par type d'événement (🔄 Swap, 📤 Transfer, ✨ Mint, 🔥 Burn)
- Couleurs par catégorie
- Indicateur de connexion WebSocket
- Timestamps en temps réel
- Statistiques d'activité

## 📖 Utilisation

### 1. Hook basique - Tous les événements

```tsx
import { useIndexer } from '@/hooks/web3/useIndexer';

function MyComponent() {
  const { events, isConnected, totalEvents } = useIndexer({
    eventTypes: 'ALL',
    maxEvents: 50,
  });

  return (
    <div>
      <p>Connected: {isConnected ? '✅' : '❌'}</p>
      <p>Total events: {totalEvents}</p>
      
      {events.map(event => (
        <div key={event.id}>
          {event.eventType} - {event.transactionHash}
        </div>
      ))}
    </div>
  );
}
```

### 2. Hook spécialisé - Swaps uniquement

```tsx
import { useSwapEvents } from '@/hooks/web3/useIndexer';

function SwapsComponent() {
  const { events } = useSwapEvents('0x...'); // Adresse du router

  return (
    <div>
      {events.map(event => (
        <div key={event.id}>
          Swap: {event.amount0} ⇄ {event.amount1}
        </div>
      ))}
    </div>
  );
}
```

### 3. Hook spécialisé - Transfers de l'utilisateur

```tsx
import { useTransferEvents } from '@/hooks/web3/useIndexer';

function TransfersComponent() {
  const { events } = useTransferEvents();

  return (
    <div>
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
```

### 4. Hook spécialisé - Statistiques utilisateur

```tsx
import { useUserActivity } from '@/hooks/web3/useIndexer';

function ActivityComponent() {
  const { summary, totalActivity } = useUserActivity();

  return (
    <div>
      <p>Swaps: {summary.swaps}</p>
      <p>Transfers: {summary.transfers}</p>
      <p>Mints: {summary.mints}</p>
      <p>Burns: {summary.burns}</p>
      <p>Total: {totalActivity}</p>
    </div>
  );
}
```

## ⚙️ Options de configuration

```tsx
interface UseIndexerOptions {
  // Types d'événements à écouter
  eventTypes?: EventType[] | 'ALL';
  
  // Filtrer par utilisateur connecté
  userOnly?: boolean;
  
  // Adresse de contrat spécifique
  contractAddress?: string;
  
  // Mode polling au lieu de WebSocket
  usePolling?: boolean;
  
  // Intervalle de polling (ms)
  pollingInterval?: number;
  
  // Nombre max d'événements en mémoire
  maxEvents?: number;
  
  // Callback lors d'un nouvel événement
  onNewEvent?: (event: BlockchainEvent) => void;
}
```

## 🎨 Affichage formaté

Utilisez `IndexerSyncService.formatEvent()` pour obtenir des icônes et couleurs :

```tsx
import { IndexerSyncService } from '@/services/indexer/indexer';

function FormattedEvent({ event }) {
  const { title, description, icon, color } = IndexerSyncService.formatEvent(event);

  return (
    <div style={{ borderLeft: `4px solid ${color}` }}>
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
```

### Types d'événements et leur affichage

| Type | Icône | Couleur | Description |
|------|-------|---------|-------------|
| `SWAP` | 🔄 | Blue | Token swap |
| `TRANSFER` | 📤 | Green | Token transfer |
| `MINT` | ✨ | Purple | Tokens minted |
| `BURN` | 🔥 | Red | Tokens burned |
| `LIQUIDITY_ADD` | 💧 | Cyan | Liquidity added |
| `LIQUIDITY_REMOVE` | 💨 | Orange | Liquidity removed |

## 🔌 Backend requis

L'indexer backend doit exposer deux endpoints :

### 1. REST API - Polling
```
GET /events?address={address}&contract={contract}&type={type}&limit={limit}

Response:
{
  "events": [
    {
      "id": "0x...-1",
      "blockNumber": 12345,
      "transactionHash": "0x...",
      "eventType": "Swap",
      "contractAddress": "0x...",
      "timestamp": 1234567890,
      "from": "0x...",
      "to": "0x...",
      "amount": "1000000",
      "args": { ... }
    }
  ]
}
```

### 2. WebSocket - Temps réel
```
ws://localhost:8080/events/stream

Message format (JSON):
{
  "id": "0x...-1",
  "blockNumber": 12345,
  "transactionHash": "0x...",
  "eventType": "Transfer",
  "contractAddress": "0x...",
  "timestamp": 1234567890,
  "from": "0x...",
  "to": "0x...",
  "amount": "1000000",
  "args": { ... }
}
```

## 🛠️ Configuration

Dans `.env.local` :

```bash
# URL de l'indexer (REST API)
NEXT_PUBLIC_INDEXER_URL=http://localhost:8080/graphql

# WebSocket sera automatiquement dérivé :
# ws://localhost:8080/events/stream
```

## 📊 Intégration dans le Dashboard

Le dashboard utilise déjà le nouveau système :

```tsx
// app/dashboard/page.tsx
import { useIndexer, useUserActivity } from '@/hooks/web3/useIndexer';

export default function Dashboard() {
  // Événements temps réel
  const { events, isConnected, totalEvents } = useIndexer({
    eventTypes: 'ALL',
    userOnly: true,
  });

  // Statistiques d'activité
  const { summary } = useUserActivity();

  return (
    <div>
      {/* Indicateur de connexion */}
      {isConnected && (
        <div className="status">
          <div className="pulse-dot" /> Live
        </div>
      )}

      {/* Statistiques */}
      <div className="stats">
        <div>Swaps: {summary.swaps}</div>
        <div>Transfers: {summary.transfers}</div>
        <div>Mints: {summary.mints}</div>
        <div>Burns: {summary.burns}</div>
      </div>

      {/* Liste des événements */}
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
```

## 🔍 Détection et filtrage

### Vérifier si un événement implique un utilisateur

```tsx
import { IndexerSyncService } from '@/services/indexer/indexer';

const isInvolved = IndexerSyncService.isUserInvolved(event, userAddress);
```

### Extraire les données d'un swap

```tsx
import { EventDetector } from '@/services/indexer/indexer';

if (EventDetector.isSwap(event)) {
  const { token0, token1, amount0, amount1 } = EventDetector.extractSwapAmounts(event);
}
```

### Extraire les données d'un transfer

```tsx
if (EventDetector.isTransfer(event)) {
  const { from, to, amount } = EventDetector.extractTransferAddresses(event);
}
```

## 🎯 Cas d'usage

### 1. Trading Dashboard
- Surveiller les swaps en temps réel
- Afficher les prix et volumes
- Détecter les opportunités d'arbitrage

### 2. Portfolio Tracker
- Suivre les transfers entrants/sortants
- Calculer le P&L automatiquement
- Alertes sur les mouvements importants

### 3. Token Analytics
- Surveiller les mint/burn d'un token
- Analyser la supply en temps réel
- Traquer les holders actifs

### 4. Liquidity Pool Manager
- Suivre les ajouts/retraits de liquidité
- Calculer les APY en temps réel
- Détecter les impermanent losses

## 🚨 Gestion d'erreurs

Le système gère automatiquement :
- ✅ Reconnexion WebSocket automatique (5 tentatives)
- ✅ Fallback sur polling si WebSocket échoue
- ✅ Messages d'erreur pédagogiques
- ✅ États de chargement

```tsx
const { events, error, isLoading } = useIndexer({ ... });

if (error) {
  return <div>Error: {error}</div>;
}

if (isLoading) {
  return <div>Loading...</div>;
}
```

## 📝 Exemples complets

Voir le fichier `INDEXER_EXAMPLES.tsx` pour 10 exemples d'utilisation :
1. Tous les événements
2. Swaps uniquement
3. Transfers utilisateur
4. Mint/Burn d'un token
5. Statistiques utilisateur
6. Notifications temps réel
7. Mode polling
8. Contrôles manuels
9. Filtrage avancé
10. Affichage formaté

## 🔗 Références

- **Service principal** : `services/indexer/indexer.ts`
- **Hook React** : `hooks/web3/useIndexer.ts`
- **Dashboard** : `app/dashboard/page.tsx`
- **Exemples** : `INDEXER_EXAMPLES.tsx`

## 🎉 Résultat

Vous avez maintenant :
- ✅ Synchronisation temps réel via WebSocket
- ✅ Détection automatique de tous les types d'événements
- ✅ Hooks React faciles à utiliser
- ✅ UI enrichie avec icônes et couleurs
- ✅ Statistiques d'activité en temps réel
- ✅ Intégration complète dans le dashboard
