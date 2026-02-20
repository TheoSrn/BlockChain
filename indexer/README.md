# Tek5 Indexer (MVP)

Service Node.js qui synchronise les événements on-chain et les expose au frontend.

## Features

- Polling blockchain toutes les `POLL_INTERVAL_MS` (par défaut 60s)
- Checkpoint du dernier bloc indexé (`indexer/data/checkpoint.json`)
- Endpoint REST `GET /events`
- Endpoint REST `GET /health`
- Stream WebSocket `ws://localhost:<PORT>/events/stream`

## Prérequis

- Node.js 18+
- npm
- Une URL RPC (Sepolia, local Hardhat, etc.)

## Démarrage rapide (nouvelle machine)

1. Cloner le projet et aller dans le dossier indexer:

```powershell
cd BlockChain\indexer
```

2. Installer les dépendances:

```powershell
npm install
```

3. Créer le fichier d'environnement:

```powershell
touch .env
```

4. Remplir `.env`:
	- `RPC_URL` (important)
	- `CHAIN_ID`
	- adresses contrats (`ASSET_FACTORY_ADDRESS`, `KYC_ADDRESS`, `ORACLE_ADDRESS`, etc.)
	- `PORT` (si `8080` est déjà pris, mettre `3030` par exemple)

5. Démarrer l'indexer:

```powershell
npm run dev
```

6. Vérifier que l'API répond:

```powershell
curl "http://localhost:3030/health"
curl "http://localhost:3030/events?limit=5"
```

> Remplace `3030` par la valeur de `PORT` dans ton `.env`.

## Brancher le frontend

Dans `frontend/.env.local`, configurer:

```dotenv
NEXT_PUBLIC_INDEXER_URL=http://localhost:3030/graphql
```

Puis redémarrer le frontend (`npm run dev` dans `frontend/`).

## Setup

1. Installer les dépendances:

```powershell
cd indexer
npm install
```

2. Configurer l'environnement:

```powershell
touch .env
```

3. Démarrer:

```powershell
npm run dev
```

## Variables `.env`

- `PORT` (défaut `8080`)
- `RPC_URL`
- `CHAIN_ID`
- `POLL_INTERVAL_MS`
- `START_BLOCK`
- `MAX_BLOCK_RANGE` (taille max d'une plage `eth_getLogs`)
- `INITIAL_LOOKBACK_BLOCKS` (fenêtre d'historique au premier lancement)
- `REQUEST_DELAY_MS` (pause entre requêtes RPC)
- `MAX_LOG_RETRIES` (retries sur erreurs rate-limit)
- `MAX_STORED_EVENTS`
- `ASSET_FACTORY_ADDRESS`
- `KYC_ADDRESS`
- `ORACLE_ADDRESS`
- `ROUTER_ADDRESS`
- `BASE_TOKEN_ADDRESS`
- `USDC_ADDRESS`
- `USDT_ADDRESS`

### Exemple `.env`

```dotenv
PORT=3030
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/VOTRE_RPC_KEY_ICI
CHAIN_ID=11155111
POLL_INTERVAL_MS=60000
START_BLOCK=0
MAX_BLOCK_RANGE=10
INITIAL_LOOKBACK_BLOCKS=120
REQUEST_DELAY_MS=350
MAX_LOG_RETRIES=6
MAX_STORED_EVENTS=5000

ASSET_FACTORY_ADDRESS=0xVOTRE_FACTORY_ADDRESS
KYC_ADDRESS=0xVOTRE_KYC_ADDRESS
ORACLE_ADDRESS=0xVOTRE_ORACLE_ADDRESS
ROUTER_ADDRESS=0xVOTRE_ROUTER_ADDRESS
BASE_TOKEN_ADDRESS=0xVOTRE_BASE_TOKEN_ADDRESS
USDC_ADDRESS=0xVOTRE_USDC_ADDRESS
USDT_ADDRESS=0xVOTRE_USDT_ADDRESS
```

> Remplace toutes les valeurs `VOTRE_...` par tes vraies valeurs.

## API

Base URL: `http://localhost:<PORT>`

### `GET /events`

Query params optionnels:

- `address`: filtre les événements impliquant cette adresse
- `contract`: filtre par adresse de contrat
- `type`: filtre par type (`Swap`, `Transfer`, `Mint`, `Burn`, etc.)
- `limit`: limite le nombre de résultats

Exemple:

```bash
curl "http://localhost:3030/events?type=Swap&limit=20"
```

Réponse (exemple simplifié):

```json
{
	"events": [
		{
			"id": "0xabc...-12",
			"blockNumber": 10367890,
			"transactionHash": "0xabc...",
			"eventType": "Swap",
			"contractAddress": "0x...",
			"timestamp": 1739980000,
			"from": "0x...",
			"to": "0x...",
			"amount0": "1000000000000000000",
			"amount1": "998000",
			"args": {}
		}
	],
	"meta": {
		"lastSyncedBlock": 10367900,
		"totalEvents": 42
	}
}
```

À quoi sert ce JSON:
- `events`: données métier à afficher dans le frontend (historique, activité, dashboard)
- `meta`: contexte technique (debug, synchronisation)

### `GET /health`

Retourne l'état du service, le dernier bloc sync, et les contrats trackés.

Réponse (exemple simplifié):

```json
{
	"status": "ok",
	"service": "tek5-indexer",
	"chainId": 11155111,
	"rpcUrl": "https://...",
	"trackedContracts": [{ "tag": "factory", "address": "0x..." }],
	"lastSyncedBlock": 10367900,
	"totalEvents": 42,
	"pollIntervalMs": 60000
}
```

À quoi sert ce JSON:
- vérifier que l'indexer tourne
- voir s'il synchronise bien les blocs
- diagnostiquer rapidement un souci de config RPC/contrats

### `WS /events/stream`

Diffuse chaque nouvel événement indexé en JSON.

Exemple rapide côté frontend:

```ts
const ws = new WebSocket('ws://localhost:3030/events/stream');
ws.onmessage = (msg) => {
	const event = JSON.parse(msg.data);
	console.log(event);
};
```

## Troubleshooting

- `429 / throughput / compute units`:
	- augmente `REQUEST_DELAY_MS` (ex: `500`)
	- diminue `INITIAL_LOOKBACK_BLOCKS` (ex: `50`)
	- garde `MAX_BLOCK_RANGE=10` pour Alchemy free tier
- `EADDRINUSE`:
	- change `PORT` (ex: `3030`)
- Le frontend ne voit rien:
	- vérifier `NEXT_PUBLIC_INDEXER_URL`
	- redémarrer le serveur frontend après modification de `.env.local`
