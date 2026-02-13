# 🔧 Configuration Backend Indexer

## Vue d'ensemble

Le frontend est maintenant prêt pour la synchronisation on-chain. Voici comment configurer le backend indexer.

## 📡 Endpoints requis

### 1. REST API - `/events`

```http
GET /events?address={address}&contract={contract}&type={type}&limit={limit}
```

**Paramètres :**
- `address` (optional) : Filtrer par adresse utilisateur
- `contract` (optional) : Filtrer par adresse de contrat
- `type` (optional) : Filtrer par type d'événement (`Swap`, `Transfer`, `Mint`, `Burn`)
- `limit` (optional) : Nombre max d'événements (défaut: 10)

**Réponse :**
```json
{
  "events": [
    {
      "id": "0xabc123-1",
      "blockNumber": 12345678,
      "transactionHash": "0xdef456...",
      "eventType": "Swap",
      "contractAddress": "0x1234...",
      "timestamp": 1707654321,
      "from": "0xaaa...",
      "to": "0xbbb...",
      "amount": "1000000000000000000",
      "token0": "0xUSDC...",
      "token1": "0xWETH...",
      "amount0": "100000000",
      "amount1": "50000000000000000",
      "args": {
        "sender": "0xaaa...",
        "recipient": "0xbbb...",
        "amount0In": "100000000",
        "amount1Out": "50000000000000000"
      }
    }
  ]
}
```

### 2. WebSocket - `/events/stream`

```javascript
// Connexion WebSocket
const ws = new WebSocket('ws://localhost:8080/events/stream');

// Recevoir un événement
ws.onmessage = (message) => {
  const event = JSON.parse(message.data);
  // event a la même structure que ci-dessus
};
```

## 🛠️ Implémentation Backend (Node.js + Express)

### Installation

```bash
cd backend
npm install express ws ethers
```

### Code exemple

```javascript
// backend/indexer.js
const express = require('express');
const WebSocket = require('ws');
const { ethers } = require('ethers');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

// Configuration
const RPC_URL = process.env.RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY';
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Stockage en mémoire des événements (à remplacer par une DB)
let events = [];

// ============================================================================
// DÉTECTION D'ÉVÉNEMENTS ON-CHAIN
// ============================================================================

// Contrats à surveiller
const CONTRACTS = {
  UNISWAP_ROUTER: '0x...',
  ERC20_TOKENS: ['0x...', '0x...'],
  NFT_CONTRACTS: ['0x...'],
};

// ABIs simplifiés
const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

const UNISWAP_ROUTER_ABI = [
  'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)',
];

// Écouter les événements Transfer sur tous les tokens
CONTRACTS.ERC20_TOKENS.forEach(tokenAddress => {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  
  contract.on('Transfer', (from, to, value, event) => {
    const newEvent = {
      id: `${event.transactionHash}-${event.index}`,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      eventType: 'Transfer',
      contractAddress: tokenAddress,
      timestamp: Math.floor(Date.now() / 1000),
      from,
      to,
      amount: value.toString(),
      args: { from, to, value: value.toString() },
    };

    // Stocker l'événement
    events.unshift(newEvent);
    if (events.length > 1000) events.pop();

    // Envoyer à tous les clients WebSocket
    broadcastEvent(newEvent);
  });
});

// Écouter les événements Swap sur Uniswap
const uniswapRouter = new ethers.Contract(
  CONTRACTS.UNISWAP_ROUTER,
  UNISWAP_ROUTER_ABI,
  provider
);

uniswapRouter.on('Swap', (sender, amount0In, amount1In, amount0Out, amount1Out, to, event) => {
  const newEvent = {
    id: `${event.transactionHash}-${event.index}`,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
    eventType: 'Swap',
    contractAddress: CONTRACTS.UNISWAP_ROUTER,
    timestamp: Math.floor(Date.now() / 1000),
    from: sender,
    to,
    amount0: amount0In.gt(0) ? amount0In.toString() : amount0Out.toString(),
    amount1: amount1In.gt(0) ? amount1In.toString() : amount1Out.toString(),
    args: {
      sender,
      amount0In: amount0In.toString(),
      amount1In: amount1In.toString(),
      amount0Out: amount0Out.toString(),
      amount1Out: amount1Out.toString(),
      to,
    },
  };

  events.unshift(newEvent);
  if (events.length > 1000) events.pop();
  broadcastEvent(newEvent);
});

// ============================================================================
// REST API
// ============================================================================

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// GET /events - Récupérer les événements
app.get('/events', (req, res) => {
  const { address, contract, type, limit = 10 } = req.query;
  
  let filtered = events;

  // Filtrer par adresse utilisateur
  if (address) {
    const addr = address.toLowerCase();
    filtered = filtered.filter(e => 
      e.from?.toLowerCase() === addr ||
      e.to?.toLowerCase() === addr ||
      e.args?.from?.toLowerCase() === addr ||
      e.args?.to?.toLowerCase() === addr
    );
  }

  // Filtrer par contrat
  if (contract) {
    filtered = filtered.filter(e => 
      e.contractAddress.toLowerCase() === contract.toLowerCase()
    );
  }

  // Filtrer par type
  if (type) {
    filtered = filtered.filter(e => e.eventType === type);
  }

  // Limiter le nombre de résultats
  const limitedEvents = filtered.slice(0, parseInt(limit));

  res.json({ events: limitedEvents });
});

// ============================================================================
// WEBSOCKET
// ============================================================================

// Broadcast un événement à tous les clients connectés
function broadcastEvent(event) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(event));
    }
  });
}

// Gestion des connexions WebSocket
wss.on('connection', (ws) => {
  console.log('✅ New WebSocket client connected');

  // Envoyer les 10 derniers événements lors de la connexion
  ws.send(JSON.stringify({ 
    type: 'initial',
    events: events.slice(0, 10) 
  }));

  ws.on('close', () => {
    console.log('❌ WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// ============================================================================
// DÉMARRAGE
// ============================================================================

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 Indexer server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket available on ws://localhost:${PORT}/events/stream`);
});
```

## 🐳 Docker (optionnel)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "indexer.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  indexer:
    build: .
    ports:
      - "8080:8080"
    environment:
      - RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
      - PORT=8080
    restart: unless-stopped
```

## 🔥 Démarrage rapide

```bash
# Cloner et installer
git clone https://github.com/your-repo/indexer
cd indexer
npm install

# Configurer
export RPC_URL="https://sepolia.infura.io/v3/YOUR_KEY"

# Démarrer
node indexer.js
```

## 🧪 Test manuel

```bash
# REST API
curl "http://localhost:8080/events?limit=5"

# WebSocket (avec wscat)
npm install -g wscat
wscat -c ws://localhost:8080/events/stream
```

## 📊 The Graph (alternative)

Si vous préférez utiliser **The Graph** plutôt qu'un indexer custom :

1. Créez un subgraph avec les événements nécessaires
2. Déployez sur The Graph Studio
3. Utilisez l'URL GraphQL dans `.env.local` :

```bash
NEXT_PUBLIC_INDEXER_URL=https://api.thegraph.com/subgraphs/name/your-username/your-subgraph
```

Le service `graphql.ts` existant gère déjà les requêtes GraphQL.

## 🔗 Configuration Frontend

Une fois le backend indexer démarré, configurez le frontend :

```bash
# frontend/.env.local
NEXT_PUBLIC_INDEXER_URL=http://localhost:8080/graphql
```

Le WebSocket sera automatiquement dérivé : `ws://localhost:8080/events/stream`

## ✅ Vérification

1. **Backend en cours d'exécution** :
   ```bash
   curl http://localhost:8080/events
   # Devrait retourner {"events": [...]}
   ```

2. **Frontend connecté** :
   - Ouvrir http://localhost:3000/dashboard
   - Vérifier l'indicateur "Live" (point vert pulsant)
   - Un événement on-chain devrait apparaître automatiquement

## 🎯 Production

Pour la production, utilisez :
- ✅ Base de données (PostgreSQL, MongoDB)
- ✅ Redis pour le cache
- ✅ Rate limiting
- ✅ Authentification WebSocket
- ✅ Logs structurés (Winston, Pino)
- ✅ Monitoring (Prometheus, Grafana)

## 🆘 Troubleshooting

**WebSocket ne se connecte pas :**
- Vérifier que le port 8080 est ouvert
- Vérifier les CORS
- Essayer le mode polling : `usePolling: true`

**Pas d'événements :**
- Vérifier les adresses de contrats
- Vérifier le RPC_URL
- Tester avec `ethers.js` en ligne de commande

**Erreur CORS :**
- Ajouter les headers CORS dans Express
- Vérifier `Access-Control-Allow-Origin`

## 📚 Ressources

- [Ethers.js Docs](https://docs.ethers.org/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [The Graph Docs](https://thegraph.com/docs/)
- [Express.js Guide](https://expressjs.com/)
