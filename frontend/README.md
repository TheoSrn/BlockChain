# Frontend - Blockchain Asset Tokenization Platform

## 📋 Présentation du Projet

Cette application frontend constitue l'interface utilisateur d'une plateforme de tokenisation d'actifs sur blockchain Ethereum. Elle permet aux utilisateurs de tokeniser des actifs réels (immobilier) sous forme de tokens ERC20 et NFTs ERC721, tout en respectant les exigences réglementaires KYC/AML.

### Objectifs

- **Tokenisation d'actifs** : Convertir des actifs physiques en représentations numériques négociables
- **Conformité réglementaire** : Intégration KYC/AML avec vérification on-chain
- **Trading décentralisé** : Échange de tokens via Uniswap V2
- **Transparence** : Suivi en temps réel des transactions via indexer blockchain
- **Administration** : Gestion centralisée des permissions et accès

### Contexte Académique

Ce projet s'inscrit dans le cadre du module **G-ING-910 - Blockchain** et démontre :
- L'intégration Web3 avec wagmi/viem
- L'architecture moderne React (Next.js 14, App Router)
- Les patterns de sécurité blockchain
- La conformité réglementaire on-chain

---

## 🛠️ Stack Technique

### Framework & Bibliothèques Core

| Technologie | Version | Usage |
|------------|---------|-------|
| **Next.js** | 16.1.6 | Framework React avec SSR/SSG |
| **React** | 19 | Bibliothèque UI |
| **TypeScript** | 5.x | Typage statique |
| **Tailwind CSS** | 3.x | Styling utilitaire |

### Web3 & Blockchain

| Bibliothèque | Version | Rôle |
|-------------|---------|------|
| **wagmi** | 3.4.3 | React Hooks pour Ethereum |
| **viem** | 2.45.3 | Client Ethereum TypeScript-native |
| **RainbowKit** | 2.2.10 | Connexion wallet (MetaMask, WalletConnect, etc.) |
| **@tanstack/react-query** | 5.x | Gestion du cache et requêtes |

### Protocoles & Standards

- **ERC20** : Tokens fongibles (USDC, USDT, tokens d'actifs)
- **ERC721** : NFTs pour actifs uniques
- **Uniswap V2** : DEX pour swaps et liquidité
- **Chainlink Oracles** : Flux de prix externes

### Outils de Développement

- **ESLint** : Linting JavaScript/TypeScript
- **Prettier** : Formatage de code
- **Turbopack** : Bundler ultra-rapide (Next.js)

---

## 🚀 Setup Local

### Prérequis

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x ou **yarn** ≥ 1.22
- **Git**
- **MetaMask** (ou autre wallet Ethereum)
- **Sepolia testnet ETH** (faucet : https://sepoliafaucet.com/)

### Installation

```bash
# Cloner le repository
git clone https://github.com/your-org/blockchain-tokenization.git
cd blockchain-tokenization/frontend

# Installer les dépendances
npm install --legacy-peer-deps

# Copier le fichier d'environnement
cp .env.example .env.local

# Éditer les variables d'environnement
nano .env.local  # ou votre éditeur préféré

# Démarrer le serveur de développement
npm run dev

# L'application est accessible sur http://localhost:3000
```

> ⚠️ **Note** : `--legacy-peer-deps` est requis pour résoudre le conflit entre RainbowKit 2.2.10 (attend wagmi 2.x) et wagmi 3.4.3.

### Scripts Disponibles

```bash
npm run dev          # Démarre le serveur de développement (Turbopack)
npm run build        # Build de production
npm run start        # Démarre le serveur de production
npm run lint         # Analyse du code avec ESLint
npm run format       # Formatage avec Prettier
```

---

## 🔐 Variables d'Environnement

### Configuration Obligatoire

Créez un fichier `.env.local` à la racine du projet frontend :

```bash
# ============================================================================
# WALLETCONNECT (Obligatoire)
# ============================================================================
# Obtenir sur : https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=votre_project_id

# ============================================================================
# SMART CONTRACTS (Adresses Sepolia)
# ============================================================================
# À remplir après déploiement des contrats
NEXT_PUBLIC_ASSET_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_KYC_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_COMPLIANCE_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_ASSET_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_TRADING_POOL_ADDRESS=0x...
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=0x...

# ============================================================================
# TOKENS ERC20 (Adresses de test Sepolia)
# ============================================================================
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_USDT_ADDRESS=0x...

# ============================================================================
# UNISWAP V2 (Sepolia)
# ============================================================================
# Router officiel Sepolia : https://docs.uniswap.org/contracts/v2/reference/smart-contracts/router-02
NEXT_PUBLIC_UNISWAP_V2_ROUTER=0x...
NEXT_PUBLIC_UNISWAP_V2_FACTORY=0x...

# ============================================================================
# INDEXER & RPC
# ============================================================================
# Indexer backend pour récupération d'événements
NEXT_PUBLIC_INDEXER_URL=http://localhost:8080/graphql

# ============================================================================
# ETHERSCAN API (Historique complet des transactions)
# ============================================================================
# Créez une clé sur : https://etherscan.io/myapikey
ETHERSCAN_API_KEY=your_etherscan_api_key

# RPC endpoints (avec CORS activé)
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_MAINNET_RPC_URL=https://cloudflare-eth.com

# ============================================================================
# RÉSEAU
# ============================================================================
# 11155111 = Sepolia Testnet
NEXT_PUBLIC_CHAIN_ID=11155111

# ============================================================================
# MODE DÉVELOPPEMENT (⚠️ Ne pas utiliser en production!)
# ============================================================================
# Bypass la vérification admin on-chain
NEXT_PUBLIC_ADMIN_DEV_MODE=true
```

### Obtenir les Clés

1. **WalletConnect Project ID** :
   - Créer un compte sur https://cloud.walletconnect.com/
   - Créer un nouveau projet
   - Copier le Project ID

2. **Adresses de Contrats** :
   - Déployer les smart contracts sur Sepolia (voir `/backend/README.md`)
   - Copier les adresses des contrats déployés

3. **Sepolia Testnet ETH** :
   - Obtenir des ETH de test sur https://sepoliafaucet.com/
   - Ou https://www.infura.io/faucet/sepolia

4. **Historique complet des transactions (Etherscan)** :
   - Créer une clé API : https://etherscan.io/myapikey
   - Ajouter `ETHERSCAN_API_KEY` dans `.env.local`
   - Redémarrer `npm run dev`
   - La page Transactions utilise automatiquement l'adresse du wallet connecté

---

## 🏗️ Architecture

### Structure du Projet

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout racine avec RainbowKit
│   ├── page.tsx                  # Page d'accueil
│   ├── dashboard/                # Dashboard utilisateur
│   ├── tokenize/                 # Tokenisation d'actifs
│   ├── trade/                    # DEX Uniswap (Swap & Liquidity)
│   ├── oracle/                   # Prix en temps réel
│   ├── admin/                    # Panel administrateur
│   ├── portfolio/                # Portefeuille d'actifs
│   ├── transactions/             # Historique de transactions
│   ├── analytics/                # Statistiques
│   ├── settings/                 # Paramètres utilisateur
│   ├── docs/                     # Documentation
│   └── assets/                   # Marketplace d'actifs
│
├── components/                   # Composants React réutilisables
│   ├── layout/                   # Header, Footer, Navigation
│   ├── ui/                       # Composants UI génériques
│   └── wallet/                   # Composants Web3
│
├── hooks/                        # React Hooks personnalisés
│   ├── web3/                     # Hooks blockchain
│   │   ├── useSwap.ts            # Uniswap V2 swaps
│   │   ├── useOracle.ts          # Prix oracles
│   │   ├── useKYCManager.ts      # Gestion KYC/Whitelist
│   │   ├── useIndexer.ts         # Synchronisation on-chain
│   │   ├── useTokenBalances.ts   # Soldes ERC20
│   │   └── useNFTs.ts            # NFTs ERC721
│   └── data/                     # Hooks de données
│       └── useIndexerEvents.ts   # Événements indexer
│
├── services/                     # Services métier
│   ├── indexer/                  # Indexer blockchain
│   │   ├── indexer.ts            # WebSocket temps réel
│   │   └── graphql.ts            # Client GraphQL
│   ├── oracle/                   # Services Oracle
│   ├── dex/                      # Services DEX
│   └── contracts/                # Services smart contracts
│
├── config/                       # Configuration
│   ├── contracts.ts              # Adresses de contrats & constantes
│   └── wagmi.ts                  # Configuration wagmi/RainbowKit
│
├── lib/                          # Utilitaires
│   └── utils.ts                  # Fonctions helper
│
├── types/                        # Définitions TypeScript
│   └── index.ts                  # Types globaux
│
├── abis/                         # ABIs des smart contracts
│   ├── ERC20.json
│   ├── ERC721.json
│   ├── AssetRegistry.json
│   ├── KYCManager.json
│   └── ...
│
├── public/                       # Assets statiques
│   └── images/
│
├── .env.local                    # Variables d'environnement (local)
├── .env.example                  # Template des variables
├── next.config.js                # Configuration Next.js
├── tailwind.config.ts            # Configuration Tailwind
├── tsconfig.json                 # Configuration TypeScript
└── package.json                  # Dépendances npm
```

### Patterns Architecturaux

#### 1. **Séparation des Préoccupations**

```
UI Components → Hooks → Services → Smart Contracts
```

- **Components** : Logique de présentation uniquement
- **Hooks** : État et logique métier React
- **Services** : Logique métier pure (sans React)
- **Smart Contracts** : Logique on-chain

#### 2. **Communications Blockchain**

```typescript
// Lecture de données (pas de gas)
useReadContract() → RPC → Smart Contract → Data

// Écriture de données (gas requis)
useWriteContract() → Wallet → Transaction → Block → Confirmation
```

#### 3. **Gestion d'État**

- **React Query** (via wagmi) : Cache des données blockchain
- **React State** : État UI local
- **URL State** : Paramètres de route (Next.js)

#### 4. **Synchronisation Temps Réel**

```
Blockchain Events → Indexer Backend → WebSocket/Polling → Frontend State → UI Update
```

---

## 👤 Parcours Utilisateur

### 1. Connexion Wallet

**Actions** :
- Sélection du wallet (MetaMask, WalletConnect, Coinbase Wallet, etc.)
- Signature de message (gratuit, sans gas)
- Ajout automatique du réseau Sepolia si nécessaire

### 2. Dashboard - Vue d'Ensemble

**URL** : `/dashboard`

**Affichage** :
- Valeur totale du portefeuille (USD)
- Nombre de tokens ERC20 détenus
- Nombre de NFTs possédés
- Événements récents (swaps, transfers, mint/burn)
- Statistiques d'activité en temps réel

**Actions disponibles** :
- Tokenize Asset → `/tokenize`
- Trade → `/trade`
- Browse Assets → `/assets`

### 3. Tokenisation d'Actifs

**URL** : `/tokenize`

**Prérequis** : KYC vérifié (vérification on-chain)

**Processus** :

1. **Choix du Type** :
   - Fungible Asset (ERC20) : Actifs divisibles (parts d'immobilier, actions)
   - NFT Asset (ERC721) : Actifs uniques (œuvre d'art, véhicule)

2. **Saisie des Informations** :
   - Nom de l'actif
   - Symbole (ticker)
   - Valeur totale (USD)
   - Description
   - Quantité (ERC20 uniquement)
   - Upload de documents (optionnel)

3. **Validation KYC** :
   - Vérification automatique du statut KYC
   - Intégration avec smart contract KYCManager

4. **Transaction Blockchain** :
   - Approbation MetaMask
   - Mining de la transaction
   - Confirmation on-chain
   - Mint du token/NFT

### 4. Trading (DEX Uniswap)

**URL** : `/trade`

**Onglet Swap** :

1. **Sélection des Tokens** :
   - From : Token source + montant
   - To : Token destination (montant calculé automatiquement)
   - Bouton ⇅ pour inverser

2. **Informations Affichées** :
   - Prix du swap (taux de change)
   - Prix d'impact (slippage)
   - Minimum reçu (après slippage)
   - Liquidity Pool disponible

3. **Exécution** :
   - Step 1 : Approve (autoriser le router Uniswap)
   - Step 2 : Swap (exécuter l'échange)

**Onglet Liquidity** :

1. **Ajout de Liquidité** :
   - Sélection de 2 tokens (pair)
   - Saisie des montants (ratio automatique)
   - Réception de LP tokens

2. **Rewards** :
   - Frais de trading (0.3% par swap)
   - Proportionnel aux LP tokens détenus

### 5. Oracle - Prix en Temps Réel

**URL** : `/oracle`

**Fonctionnalités** :
- Affichage de 3 prix (USDC, USDT, WETH)
- Auto-refresh toutes les 10 secondes (WebSocket)
- Timestamp de dernière mise à jour (live)
- Historique des 5 derniers prix
- Sélecteur d'asset pour détails

**Source de Données** :
- Smart contract PriceOracle
- Agrégation Chainlink (production)
- Mock data (développement)

### 6. Administration (Réservé aux Admins)

**URL** : `/admin`

**Vérification d'Accès** :
- Lecture du rôle `DEFAULT_ADMIN_ROLE` on-chain
- Accès refusé si pas admin
- Mode dev bypass (développement uniquement)

**Fonctionnalités** :

1. **Recherche d'Adresse** :
   - Input avec validation Ethereum
   - Affichage du statut actuel

2. **Gestion KYC** :
   - ✅ Verify KYC : Accorder la vérification
   - 🚫 Revoke KYC : Révoquer l'accès

3. **Gestion Whitelist** :
   - ➕ Add to Whitelist : Pré-approuver une adresse
   - ➖ Remove from Whitelist : Retirer de la liste

4. **Gestion Blacklist** :
   - ⚠️ Add to Blacklist : Bloquer une adresse suspecte
   - ✅ Remove from Blacklist : Débloquer

**Sécurité** :
- Modal de confirmation obligatoire
- Affichage de l'adresse cible
- Transactions on-chain irréversibles
- Logs automatiques (événements blockchain)

---

## 🔒 Sécurité & Conformité

### Sécurité Smart Contracts

#### 1. **Vérification des Permissions**

```typescript
// Vérification on-chain du rôle admin
const { isAdmin } = useIsAdmin();

// Lecture depuis le smart contract
hasRole(DEFAULT_ADMIN_ROLE, userAddress)
```

#### 2. **Protection contre les Réentrances**

- Contrats utilisant le pattern Checks-Effects-Interactions
- Guards OpenZeppelin ReentrancyGuard
- Aucune fonction externe appelée avant mise à jour d'état

#### 3. **Validation des Entrées**

```typescript
// Frontend
if (!isAddress(address)) {
  throw new Error('Invalid Ethereum address');
}

// Smart Contract
require(_value > 0, "Amount must be positive");
require(_to != address(0), "Invalid recipient");
```

#### 4. **Gestion des Erreurs**

```typescript
try {
  await writeContract({...});
} catch (error) {
  if (error.message.includes('user rejected')) {
    // Utilisateur a refusé
  } else if (error.message.includes('insufficient funds')) {
    // Pas assez de ETH pour gas
  }
}
```

### Conformité Réglementaire

#### 1. **KYC/AML On-Chain**

**Processus** :
1. **Soumission KYC** : Utilisateur soumet documents (off-chain)
2. **Vérification** : Admin vérifie l'identité
3. **Approbation On-Chain** : `verifyKYC(address)` enregistré sur blockchain
4. **Vérification Automatique** : Chaque action vérifie `isKYCVerified(address)`

**Avantages** :
- Transparence : Statut KYC vérifiable publiquement
- Immutabilité : Historique des vérifications
- Décentralisation : Pas de serveur centralisé vulnérable

#### 2. **Whitelist/Blacklist**

**Whitelist** :
- Adresses pré-approuvées pour accès rapide
- Utilisé pour partenaires institutionnels
- Révocable par admin

**Blacklist** :
- Blocage d'adresses suspectes
- Prévention d'activités illicites
- Respect des sanctions internationales

#### 3. **Traçabilité**

Tous les événements sont enregistrés on-chain :

```solidity
event KYCVerified(address indexed account, uint256 timestamp);
event AddedToWhitelist(address indexed account, address indexed admin);
event AddedToBlacklist(address indexed account, address indexed admin, string reason);
```

### Bonnes Pratiques

#### 1. **Ne Jamais Stocker de Clés Privées**

```typescript
// ❌ DANGER
const privateKey = 'abc123...';

// ✅ BON
// Utiliser wagmi/RainbowKit qui gère les wallets de manière sécurisée
const { address } = useAccount();
```

#### 2. **Vérifier les Adresses de Contrats**

```typescript
// Valider les adresses avant d'interagir
if (CONTRACT_ADDRESSES.KYC_MANAGER === '0x0000000000000000000000000000000000000000') {
  console.warn('Contract not deployed');
  return;
}
```

#### 3. **Gérer les Erreurs Utilisateur**

```typescript
// Messages d'erreur clairs et actionnables
if (error.message.includes('insufficient allowance')) {
  return 'Please approve token spending first';
}
```

#### 4. **Rate Limiting**

```typescript
// Éviter les appels RPC excessifs
const { data } = useReadContract({
  // ...
  query: {
    refetchInterval: 10000, // 10 secondes minimum
    staleTime: 5000,        // Cache 5 secondes
  }
});
```

#### 5. **Validation des Montants**

```typescript
// Vérifier les montants avant transaction
if (parseFloat(amount) <= 0) {
  throw new Error('Amount must be positive');
}

if (parseFloat(amount) > parseFloat(balance)) {
  throw new Error('Insufficient balance');
}
```

### Audit & Tests

#### 1. **Tests Smart Contracts**

```bash
# Backend
cd ../backend
npm run test                 # Tests unitaires
npm run test:integration     # Tests d'intégration
npm run coverage             # Couverture de code
```

#### 2. **Tests Frontend**

*À implémenter* :
- Jest pour tests unitaires
- React Testing Library pour composants
- Cypress/Playwright pour tests E2E

#### 3. **Audit de Sécurité**

**Recommandations** :
- Audit par société spécialisée (Consensys Diligence, Trail of Bits)
- Bug bounty program
- Révision de code par pairs

---

## 🌐 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Déployer en production
vercel --prod
```

Configurez les variables d'environnement dans le dashboard Vercel.

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t rwa-platform .
docker run -p 3000:3000 rwa-platform
```

### Autres Plateformes
- Netlify
- AWS Amplify
- Railway
- Render

---

## 📚 Ressources Complémentaires

### Documentation Officielle

- **Next.js** : https://nextjs.org/docs
- **wagmi** : https://wagmi.sh/
- **viem** : https://viem.sh/
- **RainbowKit** : https://www.rainbowkit.com/docs
- **Uniswap V2** : https://docs.uniswap.org/contracts/v2/overview

### Guides Blockchain

- **Ethereum** : https://ethereum.org/developers
- **Solidity** : https://docs.soliditylang.org/
- **OpenZeppelin** : https://docs.openzeppelin.com/

### Tutoriels

- **wagmi + Next.js** : https://wagmi.sh/examples/connect-wallet
- **Uniswap Integration** : https://docs.uniswap.org/sdk/v2/guides/quick-start

---

## 🤝 Contribution

### Workflow Git

```bash
# Créer une branche feature
git checkout -b feature/nouvelle-fonctionnalite

# Faire vos modifications
git add .
git commit -m "feat: description de la fonctionnalité"

# Pousser la branche
git push origin feature/nouvelle-fonctionnalite

# Créer une Pull Request sur GitHub
```

### Convention de Commits

Suivre la convention [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage (pas de changement de code)
- `refactor:` Refactoring
- `test:` Ajout de tests
- `chore:` Maintenance

### Code Style

```bash
# Linting
npm run lint

# Formatage automatique
npm run format
```

---

## 🐛 Troubleshooting

### **Erreur : peer dependencies**
```bash
npm install --legacy-peer-deps
```

### **Erreur : Module not found**
Vérifiez que toutes les dépendances sont installées :
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### **Erreur : WalletConnect**
Vérifiez que `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` est défini dans `.env.local`.

### **Erreur : Contract call failed**
- Vérifiez les adresses des contrats dans `.env.local`
- Vérifiez que les ABIs sont à jour
- Vérifiez que vous êtes sur le bon réseau (Sepolia par défaut)

### **Performances lentes**
- Ajoutez des clés Alchemy/Infura dans `.env.local`
- Réduisez les intervalles de polling (refetchInterval)

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 👥 Équipe

**Projet Académique** - G-ING-910 Blockchain  
Epitech Paris - 2026

---

## 🆘 Support

Pour toute question ou problème :

1. **Issues GitHub** : https://github.com/your-org/blockchain-tokenization/issues
2. **Documentation** : Consultez `/frontend/docs`
3. **Contact** : Voir les responsables du projet

---

## ✅ Quick Start Checklist

- [ ] Node.js 18+ installé
- [ ] `npm install --legacy-peer-deps` exécuté
- [ ] `.env.local` créé et rempli
- [ ] WalletConnect Project ID configuré
- [ ] Adresses smart contracts ajoutées
- [ ] ABIs mis à jour dans `abi/`
- [ ] `npm run dev` lancé
- [ ] Wallet connecté sur http://localhost:3000
- [ ] KYC vérifié (si requis)
- [ ] Premier actif tokenisé créé 🎉

---

*Dernière mise à jour : Février 2026*

