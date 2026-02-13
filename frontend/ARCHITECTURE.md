# 🏗️ Architecture Complète du Frontend - RWA Platform

Architecture professionnelle pour une dApp de tokenisation d'actifs réels (RWA) avec Next.js 14.

---

## 📁 Structure du Projet

```
frontend/
│
├── app/                          ✅ Next.js 14 App Router
│   ├── layout.tsx               ✅ Layout principal + Providers
│   ├── page.tsx                 ✅ Landing page
│   ├── providers.tsx            ✅ Web3 Providers (RainbowKit, wagmi)
│   │
│   ├── dashboard/               ✅ Dashboard utilisateur
│   │   └── page.tsx             Portfolio, stats, activité
│   │
│   ├── assets/                  ✅ Assets tokenisés
│   │   └── page.tsx             Liste des actifs
│   │
│   ├── tokenize/                ✅ Tokenisation
│   │   ├── page.tsx             Liste & créer
│   │   └── new/page.tsx         Formulaire création
│   │
│   ├── trade/                   ✅ Trading
│   │   └── page.tsx             Interface DEX
│   │
│   ├── oracle/                  ✅ Oracle & Prix
│   │   └── page.tsx             Dashboard prix
│   │
│   ├── admin/                   ✅ Administration
│   │   └── page.tsx             KYC, whitelist
│   │
│   ├── portfolio/               ✅ Portfolio (existant)
│   └── kyc/                     ✅ KYC (existant)
│
├── components/                   ✅ Composants
│   ├── layout/                  ✅ Layout components
│   │   └── Header.tsx           Header + wallet connect
│   │
│   ├── features/                ✅ Composants métier
│   │   ├── AssetCard.tsx        Carte d'actif
│   │   └── ComplianceStatus.tsx Statut KYC
│   │
│   ├── ui/                      📦 Composants UI (à créer)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   │
│   └── web3/                    📦 Composants Web3 (à créer)
│       ├── WalletButton.tsx
│       └── NetworkSwitcher.tsx
│
├── hooks/                        ✅ Custom Hooks
│   ├── web3/                    ✅ Hooks Web3
│   │   ├── useCompliance.ts     ✅ Vérif KYC/whitelist
│   │   ├── useAssets.ts         ✅ Récupération actifs
│   │   ├── useTokenization.ts   ✅ Créer/mint actifs
│   │   ├── useDex.ts            ✅ Swap, pools DEX
│   │   ├── useOracle.ts         ✅ Prix oracle
│   │   ├── useBalance.ts        ✅ Balances multi-tokens
│   │   └── useTransactions.ts   ✅ Historique TX
│   │
│   ├── data/                    ✅ Hooks de données
│   │   ├── useIndexer.ts        ✅ Requêtes GraphQL
│   │   ├── useMarketData.ts     ✅ Données marché
│   │   └── useUserStats.ts      ✅ Stats utilisateur
│   │
│   └── ui/                      ✅ Hooks UI
│       ├── useModal.ts          ✅ Gestion modals
│       ├── useToast.ts          ✅ Notifications
│       └── useDebounce.ts       ✅ Debounce inputs
│
├── services/                     ✅ Services / API Layer
│   ├── contracts/               ✅ Wrappers smart contracts
│   │   ├── assetRegistry.ts     ✅ Registre d'actifs
│   │   └── kycManager.ts        ✅ Gestion KYC
│   │
│   ├── dex/                     ✅ Services DEX
│   │   └── uniswap.ts           ✅ Calculs Uniswap
│   │
│   ├── oracle/                  ✅ Services Oracle
│   │   └── priceFeeds.ts        ✅ Récup/validation prix
│   │
│   └── indexer/                 ✅ Services Indexer
│       └── graphql.ts           ✅ Client GraphQL
│
├── store/                        ✅ State Management (Zustand)
│   ├── userStore.ts             ✅ Préférences user
│   └── uiStore.ts               ✅ État UI global
│
├── config/                       ✅ Configuration
│   ├── wagmi.ts                 ✅ Config wagmi
│   └── contracts.ts             ✅ Adresses contrats
│
├── types/                        ✅ Types TypeScript
│   └── index.ts                 ✅ Types complets
│
├── utils/                        ✅ Utilitaires
│   ├── format.ts                ✅ Formatage nombres
│   └── constants.ts             ✅ Constantes app
│
├── abi/                          ✅ ABIs
│   ├── AssetRegistry.ts         ✅ ABI exemple
│   ├── KYCManager.ts            ✅ ABI exemple
│   └── README.md                ✅ Instructions
│
└── lib/                          📦 Bibliothèques (à créer si besoin)

```

---

## 🎯 Pages Principales

### 1. **/** - Landing Page ✅
- Hero section
- Fonctionnalités
- CTA buttons
- Stats plateforme

### 2. **/dashboard** - Dashboard ✅
- Portfolio value & P&L
- Holdings
- Quick actions
- Recent activity

### 3. **/tokenize** - Tokenisation ✅
- Liste des types d'actifs
- Créer nouvel actif
- Mes actifs tokenisés
- `/new` - Formulaire création

### 4. **/assets** - Assets ✅
- Liste actifs disponibles
- Filtres & recherche
- Détails actifs

### 5. **/trade** - Trading ✅
- Interface swap
- Sélection pairs
- Slippage settings
- Market info

### 6. **/oracle** - Oracle ✅
- Prix en temps réel
- Feeds multiples
- Configuration
- Historique

### 7. **/admin** - Administration ✅
- Pending KYC requests
- Whitelist/Blacklist
- Compliance tools
- Admin dashboard

### 8. **/portfolio** - Portfolio ✅
- Holdings détaillés
- Valeur totale
- P&L

### 9. **/kyc** - KYC ✅
- Vérification identité
- Statut compliance
- Formulaire KYC

---

## 🪝 Hooks Web3

### **Compliance & KYC**
- `useCompliance()` - Vérifie KYC, whitelist, blacklist ✅
- Retourne : `{ compliance, isLoading, isKYCVerified, isWhitelisted }`

### **Assets**
- `useAssets()` - Liste actifs registry ✅
- `useAssetInfo(address)` - Info actif spécifique ✅
- `useUserAssets(address)` - Actifs créés par user ✅

### **Tokenization**
- `useTokenization()` - Créer actif tokenisé ✅
- Fonctions : `createAsset()`, transaction status

### **DEX**
- `useDex()` - Swap tokens ✅
- `useSwapQuote()` - Calcul prix swap ✅
- `usePoolReserves()` - Réserves pool ✅

### **Oracle**
- `useOracle(assetAddress)` - Prix actif ✅
- `usePriceHistory(address)` - Historique prix ✅
- `usePriceAlert()` - Alertes prix ✅

### **Balances**
- `useTokenBalance(token)` - Balance ERC20 ✅
- `useNativeBalance()` - Balance ETH ✅
- `useAllowance()` - Allowance ERC20 ✅

### **Transactions**
- `useTransactions()` - Historique TX ✅
- `useTransactionStatus(hash)` - Statut TX ✅

---

## 🔧 Services

### **contracts/**
- `AssetRegistryService` - CRUD actifs ✅
- `KYCManagerService` - Gestion KYC/whitelist ✅

### **dex/**
- `DexService` - Calculs Uniswap SDK ✅
- Prix, slippage, liquidité

### **oracle/**
- `OracleService` - Agrégation prix ✅
- Validation, détection anomalies

### **indexer/**
- `IndexerService` - Client GraphQL ✅
- Requêtes complexes, recherche

---

## 🧠 State Management

### **Zustand Stores** ✅

#### `useUserStore` - Préférences utilisateur
```typescript
{
  preferences: { theme, currency, slippageTolerance, notifications }
  setPreference()
  resetPreferences()
}
```

#### `useUIStore` - État UI
```typescript
{
  modals, openModal(), closeModal()
  sidebarOpen, toggleSidebar()
  loadingStates, setLoading()
  notifications, addNotification()
}
```

### **État React Query** (wagmi)
- Cache automatique
- Refetch auto
- Polling

---

## 🌐 Variables d'Environnement

```env
# Wallets & RPC
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_ALCHEMY_API_KEY=
NEXT_PUBLIC_INFURA_API_KEY=

# Smart Contracts
NEXT_PUBLIC_ASSET_REGISTRY_ADDRESS=
NEXT_PUBLIC_KYC_MANAGER_ADDRESS=
NEXT_PUBLIC_TRADING_POOL_ADDRESS=
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=
NEXT_PUBLIC_ASSET_FACTORY_ADDRESS=
NEXT_PUBLIC_COMPLIANCE_MANAGER_ADDRESS=

# Tokens
NEXT_PUBLIC_USDC_ADDRESS=
NEXT_PUBLIC_USDT_ADDRESS=

# Indexer
NEXT_PUBLIC_INDEXER_URL=
NEXT_PUBLIC_INDEXER_WS_URL=

# Network
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_NETWORK_NAME=sepolia

# Features
NEXT_PUBLIC_ENABLE_ADMIN=false
```

---

## 📊 Flow de Données

### **Blockchain → Frontend**
```
Smart Contracts
    ↓ (wagmi hooks)
Custom Hooks (hooks/web3/)
    ↓
Services (services/)
    ↓
Components (app pages)
    ↓
UI Display
```

### **Données Complexes**
```
Indexer GraphQL
    ↓ (useIndexer hook)
Data Hooks (hooks/data/)
    ↓
Components
    ↓
UI Display
```

### **État Global**
```
User Actions
    ↓
Zustand Store (store/)
    ↓
Components (observe store)
    ↓
UI Update
```

---

## 🎨 Principes Architecture

### **1. Séparation des préoccupations**
- UI (components) ≠ Logique (services) ≠ État (hooks/store)
- Chaque couche a une responsabilité claire

### **2. Single Source of Truth**
- Blockchain = source ultime
- Pas de duplication d'état
- Cache intelligent (React Query)

### **3. Type Safety**
- TypeScript strict
- Types définis (types/)
- ABIs typés (as const)

### **4. Performance**
- Code splitting (Next.js dynamic)
- Memoization (React.memo, useMemo)
- Polling intelligent

### **5. Error Handling**
- Try/catch dans services
- Error boundaries React
- Fallback UI

---

## 🚀 Next Steps

### **À créer si besoin :**

1. **Composants UI de base** (`components/ui/`)
   - Button, Card, Modal, Input, Table, etc.

2. **Composants Web3** (`components/web3/`)
   - WalletButton, NetworkSwitcher, TransactionButton

3. **Composants Features avancés** (`components/features/`)
   - TokenizeForm, SwapWidget, PriceChart, OrderBook

4. **Services additionnels**
   - Notifications service
   - Analytics service
   - Storage service (IPFS, etc.)

5. **Tests**
   - Tests unitaires (Vitest)
   - Tests e2e (Playwright)
   - Tests composants (React Testing Library)

6. **Optimisations**
   - Multicall pour batch requests
   - WebSocket subscriptions
   - Service worker/PWA

---

## 📚 Documentation Techniques

- **Next.js 14** : https://nextjs.org/docs
- **wagmi** : https://wagmi.sh/
- **RainbowKit** : https://www.rainbowkit.com/
- **viem** : https://viem.sh/
- **Uniswap SDK** : https://docs.uniswap.org/sdk/v3/overview
- **Zustand** : https://zustand-demo.pmnd.rs/
- **The Graph** : https://thegraph.com/docs/

---

## ✅ Checklist Implémentation

### **Pages** ✅ 9/9
- [x] / (Home)
- [x] /dashboard
- [x] /assets
- [x] /tokenize
- [x] /tokenize/new
- [x] /trade
- [x] /oracle
- [x] /admin
- [x] /portfolio
- [x] /kyc

### **Hooks Web3** ✅ 7/7
- [x] useCompliance
- [x] useAssets
- [x] useTokenization
- [x] useDex
- [x] useOracle
- [x] useBalance
- [x] useTransactions

### **Hooks Data** ✅ 3/3
- [x] useIndexer
- [x] useMarketData
- [x] useUserStats

### **Hooks UI** ✅ 3/3
- [x] useModal
- [x] useToast
- [x] useDebounce

### **Services** ✅ 5/5
- [x] AssetRegistryService
- [x] KYCManagerService
- [x] DexService (Uniswap)
- [x] OracleService
- [x] IndexerService

### **State Management** ✅ 2/2
- [x] userStore (Zustand)
- [x] uiStore (Zustand)

### **Configuration** ✅
- [x] wagmi config
- [x] contracts addresses
- [x] environment variables
- [x] types TypeScript

---

## 🎯 Architecture Prête Pour Production

Cette architecture est :
- ✅ **Scalable** : Ajout facile de nouvelles features
- ✅ **Maintenable** : Code organisé et documenté
- ✅ **Type-safe** : TypeScript strict
- ✅ **Performant** : Optimisations Next.js + React Query
- ✅ **Testable** : Séparation claire des responsabilités
- ✅ **Pédagogique** : Code commenté et structuré

**🚀 Prêt à connecter avec vos smart contracts !**

Remplacez simplement :
1. Les adresses dans `.env.local`
2. Les ABIs dans `abi/`
3. L'URL de l'indexer

Et votre dApp est opérationnelle !
