# Choix de Design et Architecture

## 🎯 Objectif du Projet

Créer une plateforme de tokenisation d'assets réels (RWA - Real World Assets) avec trading décentralisé et conformité KYC.

## 🏗️ Choix Techniques Majeurs

### 1. Blockchain : Ethereum

**Pourquoi Ethereum ?**
- Écosystème DeFi le plus mature
- Standards ERC-20 et ERC-721 universels
- Uniswap déjà disponible
- Beaucoup de documentation et support
- Outils de développement robustes (Hardhat, Wagmi)

**Testnet : Sepolia**
- Testnet officiel Ethereum
- ETH gratuit via faucets
- Stable et maintenu long-terme
- Uniswap V2 déjà déployé

### 2. DEX : Uniswap V2

**Pourquoi Uniswap V2 ?**
- Déjà déployé sur Sepolia
- Standard de l'industrie
- Formule simple (x * y = k)
- Gas fees raisonnables
- Facile à wrapper avec système KYC

**Alternatives considérées :**
- Uniswap V3 : Trop complexe pour débuter
- Sushiswap : Moins de liquidité sur Sepolia
- XRPL AMM : Nécessiterait changement de blockchain

### 3. Smart Contracts : Solidity + OpenZeppelin

**Architecture des Contrats :**

**Factory.sol**
- Crée tous les assets en une seule transaction
- Utilise le pattern Clones (EIP-1167) pour économiser le gas
- Vérifie le KYC avant création
- Registry centralisé de tous les assets

**AssetERC20.sol**
- Standard ERC-20 pour assets divisibles
- KYC vérifié à chaque transfer
- Mint/Burn contrôlés par rôles
- Upgradeable pour maintenance

**AssetNFT.sol**
- Standard ERC-721 pour assets uniques
- Métadonnées stockées on-chain
- 1 NFT = 1 asset unique
- KYC vérifié sur transferts

**TradingPool.sol**
- Wrapper autour d'Uniswap V2
- KYC obligatoire pour trader (on-chain)
- ReentrancyGuard pour sécurité
- Slippage protection intégrée

**KYC.sol**
- Whitelist et Blacklist
- Vérification à chaque action
- Admin peut modifier les listes

**Oracle.sol**
- Prix des assets en temps réel
- Support multi-devises
- Timestamp des mises à jour

**Pourquoi OpenZeppelin ?**
- Code audité et sécurisé
- Standards respectés
- Gain de temps (pas besoin de tout coder)
- Mises à jour régulières

### 4. Frontend : Next.js + TypeScript

**Stack Technique :**
- **Next.js 14** : Framework React moderne
- **TypeScript** : Typage fort pour éviter erreurs
- **TailwindCSS** : Styling rapide et responsive
- **Wagmi** : Connexion Ethereum simplifiée
- **Viem** : Alternative moderne à Ethers.js

**Pourquoi Next.js ?**
- Server-Side Rendering (SEO friendly)
- API Routes intégrées
- File-based routing simple
- Performance optimale
- Grande communauté

## 🎨 Choix d'Interface

### Design System

**Couleurs :**
- Fond : Noir / Gris foncé (thème dark)
- Accent : Violet/Purple (#A855F7)
- Success : Vert (#10B981)
- Warning : Jaune (#F59E0B)
- Danger : Rouge (#EF4444)

**Pourquoi un thème dark ?**
- Moderne et professionnel
- Moins fatiguant pour les yeux
- Standard dans les apps crypto/finance

### Navigation

**Architecture des Pages :**
```
/                 → Dashboard (overview)
/assets           → Liste des assets
/trade            → Trading et liquidité
/tokenize         → Créer des assets
/oracle           → Prix en temps réel
/kyc              → Vérification identité
```

**Navigation Simple :**
- Menu en haut avec liens directs
- Wallet connection toujours visible
- Breadcrumbs pour situer l'utilisateur

### Composants Réutilisables

**Structure :**
- `components/` : Composants UI génériques
- `app/` : Pages de l'application
- `hooks/` : Custom hooks Web3
- `services/` : Logique métier
- `abi/` : ABIs des smart contracts

**Patterns utilisés :**
- Composition over inheritance
- Hooks pour logique réutilisable
- Context pour état global
- Custom hooks pour Web3

## 🔐 Choix de Sécurité

### KYC On-Chain

**Pourquoi on-chain ?**
- Impossible à contourner
- Vérifié par les smart contracts
- Pas besoin de faire confiance au frontend
- Conformité garantie

**Implémentation :**
- Modifier `_update()` dans ERC20
- Modifier `_beforeTokenTransfer()` dans ERC721
- Modifier `onlyWhitelisted()` dans TradingPool

### Protection des Transactions

**ReentrancyGuard :**
- Empêche les attaques de reentrancy
- Appliqué sur TradingPool

**Slippage Protection :**
- `amountOutMin` sur tous les swaps
- Protection contre manipulation de prix

**Deadline :**
- Empêche transactions trop longues
- Évite exécution à mauvais moment

## 💱 Choix de Trading

### Liquidity Pools Créés

**USDC/USDT :**
- Stablecoins swap
- Ratio 1:1 (faible slippage)
- 5,000 de liquidité initiale

**USDC/WETH :**
- Bridge crypto/stablecoin
- Prix dynamique

**Asset/USDC :**
- Pool pour chaque asset créé
- Prix découvert par le marché

### Token Standards

**ERC-20 (Fongibles) :**
- Pour assets divisibles
- Exemples : immeubles, actions, or
- Fractionnalisation possible
- Trading sur DEX facile

**ERC-721 (Non-Fongibles) :**
- Pour assets uniques
- Exemples : villas, diamants, art
- 1 token = 1 bien
- Métadonnées riches

## 📊 Choix de Données

### Storage des Métadonnées

**On-Chain :**
- Location, surface, valeur
- Dans le struct AssetMetadata
- Immuable et permanent

**Off-Chain (IPFS) :**
- Images haute résolution
- Documents légaux
- tokenURI pointe vers JSON

**Pourquoi cette séparation ?**
- Gas optimization (images trop lourdes)
- Infos critiques on-chain (sécurisé)
- Images off-chain (flexible)

### Oracle de Prix

**Pourquoi un Oracle ?**
- Prix réels des assets
- Affichage dans l'interface
- Calcul de portfolio value
- Peut être connecté à Chainlink

**Update Manuel :**
- Admin met à jour les prix
- Simple pour commencer
- Évolutif vers Chainlink plus tard

## 🛠️ Choix de Développement

### Hardhat

**Pourquoi Hardhat ?**
- Standard de l'industrie
- Debugging facile
- TypeScript support
- Plugin ecosystem riche

### TypeScript Partout

**Avantages :**
- Détection erreurs à la compilation
- Autocomplétion IDE
- Code plus maintenable
- Type safety avec les ABIs

### Scripts de Déploiement

**Scripts créés :**
- `deployAll.ts` : Tous les contrats
- `createLiquidityPools.ts` : Pools Uniswap
- `addInitialLiquidity.ts` : Liquidité initiale
- `createAsset.ts` : Asset de test

**Pourquoi ?**
- Automatisation complète
- Reproductible
- Documenté dans le code

## 🎯 Trade-offs Acceptés

### Performance vs Sécurité
**Choix : Sécurité**
- KYC vérifié à chaque transaction (coût gas)
- OpenZeppelin (un peu moins optimisé mais sûr)
- ReentrancyGuard (gas supplémentaire)

### Simplicité vs Fonctionnalités
**Choix : Simplicité**
- Uniswap V2 au lieu de V3
- Oracle manuel au lieu de Chainlink
- KYC basique au lieu de système complexe

### Décentralisation vs Conformité
**Choix : Conformité**
- KYC centralisé (admin peut whitelist/blacklist)
- Oracle contrôlé par admin
- Trade-off nécessaire pour RWA légaux

## 🚀 Évolutions Futures

### Court Terme
- Plus de pools de liquidité
- Intégration Chainlink Oracle
- Tests automatisés complets

### Moyen Terme
- DAO pour governance
- Multi-chain (Polygon, Arbitrum)
- NFT Marketplace intégré

### Long Terme
- Lending protocol (RWA comme collateral)
- Derivatives (options, futures)
- AI-powered KYC automation

## 📝 Principes de Design Suivis

✓ **KISS** : Keep It Simple, Stupid
✓ **DRY** : Don't Repeat Yourself
✓ **YAGNI** : You Ain't Gonna Need It
✓ **Composition over Inheritance**
✓ **Security First**
✓ **User Experience Priority**

## 🎓 Leçons Apprises

1. **Commencer simple** : Uniswap V2 suffisant avant V3
2. **Standards > Custom** : ERC-20/721 plutôt que custom tokens
3. **Documentation importante** : Facilite maintenance
4. **KYC on-chain essentiel** : Impossible à contourner
5. **TypeScript partout** : Évite beaucoup d'erreurs
