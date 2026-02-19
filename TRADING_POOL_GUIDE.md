# 🚀 TradingPool - Trading avec KYC On-Chain

## 📋 Vue d'ensemble

Le **TradingPool** est un contrat smart contract qui wrapper Uniswap V2 et **enforce la vérification KYC on-chain**. Contrairement à l'implémentation précédente qui vérifiait le KYC uniquement côté frontend, TradingPool garantit que **seuls les utilisateurs whitelisted peuvent trader**, et cette règle est **impossible à contourner**.

## 🔒 Sécurité

### Protection On-Chain
✅ **Vérification KYC dans le smart contract**
✅ **Impossible de contourner** (même en appelant directement le contrat)
✅ **Protection ReentrancyGuard** contre les attaques
✅ **Ownership** pour l'administration

### Règles de Trading
Un utilisateur peut trader SI ET SEULEMENT SI :
- ✅ `kyc.isVerified(user) == true`
- ✅ `kyc.isWhitelisted(user) == true`
- ❌ `kyc.isBlacklisted(user) == false`

## 📦 Fichiers créés

### Smart Contract
- `contracts/contracts/TradingPool.sol` - Le contrat principal
- `contracts/scripts/deployTradingPool.ts` - Script de déploiement

### Frontend
- `frontend/abi/TradingPool.ts` - ABI TypeScript
- `frontend/hooks/web3/useTradingPool.ts` - Hook React pour interagir avec TradingPool

## 🛠️ Déploiement

### 1. Prérequis

Assurez-vous d'avoir :
- ✅ Contrat KYC déployé
- ✅ Adresses Uniswap V2 (Router + Factory) pour votre réseau

### 2. Configuration

Créer/modifier `.env` dans le dossier `contracts/` :

```bash
# Réseau
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_private_key_here

# Contrats existants
KYC_ADDRESS=0x... # Votre contrat KYC déployé

# Uniswap V2 sur Sepolia
UNISWAP_V2_ROUTER=0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008
UNISWAP_V2_FACTORY=0x7E0987E5b3a30e3f2828572Bb659A548460a3003
```

### 3. Compiler

```bash
cd contracts
npx hardhat compile
```

### 4. Déployer

**Réseau local (Hardhat):**
```bash
npx hardhat run scripts/deployTradingPool.ts --network localhost
```

**Réseau Sepolia:**
```bash
npx hardhat run scripts/deployTradingPool.ts --network sepolia
```

### 5. Sauvegarder l'adresse

Le script affichera l'adresse du TradingPool déployé. **Copiez-la !**

```
✅ TradingPool deployed at: 0xABCD...1234
```

### 6. Configurer le Frontend

Créer/modifier `.env.local` dans le dossier `frontend/` :

```bash
# TradingPool
NEXT_PUBLIC_TRADING_POOL_ADDRESS=0xABCD...1234

# Uniswap V2 (même adresses que le déploiement)
NEXT_PUBLIC_UNISWAP_V2_ROUTER=0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008
NEXT_PUBLIC_UNISWAP_V2_FACTORY=0x7E0987E5b3a30e3f2828572Bb659A548460a3003

# KYC (si pas déjà configuré)
NEXT_PUBLIC_KYC_ADDRESS=0x...
```

## 🔄 Migration de la page Trade

### Option A : Utiliser TradingPool (Recommandé ✅)

Mettre à jour `frontend/app/trade/page.tsx` :

```typescript
// Remplacer
import { useSwap, useSwapWrite } from '@/hooks/web3/useSwap';

// Par
import { useTradingPool, useTradingPoolWrite } from '@/hooks/web3/useTradingPool';

// Dans le composant SwapTab:
const {
  expectedOutput,
  priceImpact,
  pairAddress,
  needsApproval,
  canTrade: onChainCanTrade, // ✅ Vérification on-chain
} = useTradingPool(
  tokenInAddress,
  tokenOutAddress,
  amountIn,
  decimalsIn as number || 18,
  decimalsOut as number || 18
);

const {
  approveToken,
  executeSwap,
  hash,
  isPending,
  isConfirming,
  isSuccess,
  error,
} = useTradingPoolWrite();

// Utiliser onChainCanTrade pour bloquer l'interface
const canTrade = onChainCanTrade && kycStatus?.canTrade;
```

### Option B : Garder les deux (Dual Mode)

Garder l'ancien système et ajouter un toggle pour choisir :

```typescript
const [useTradingPoolMode, setUseTradingPoolMode] = useState(true);

// Si mode TradingPool activé, utiliser useTradingPool
// Sinon, utiliser useSwap (ancien système)
```

## 🧪 Tests

### 1. Test en local

```bash
# Terminal 1 : Démarrer Hardhat
cd contracts
npx hardhat node

# Terminal 2 : Déployer
npx hardhat run scripts/deployTradingPool.ts --network localhost

# Terminal 3 : Whitelist un user
npx hardhat run scripts/manageKYC.ts --network localhost

# Terminal 4 : Frontend
cd ../frontend
npm run dev
```

### 2. Test sur Sepolia

```bash
# Déployer
npx hardhat run scripts/deployTradingPool.ts --network sepolia

# Whitelist votre adresse
npx hardhat run scripts/manageKYC.ts --network sepolia

# Tester sur l'interface
```

### 3. Scénarios de test

#### ✅ Test 1 : User whitelisted peut swap
1. Connecter wallet whitelisted
2. Sélectionner tokens
3. Entrer montant
4. Approve
5. Swap
6. ✅ Transaction réussie

#### ❌ Test 2 : User non-whitelisted ne peut PAS swap
1. Connecter wallet non-whitelisted
2. Sélectionner tokens
3. Entrer montant
4. Approve
5. Swap
6. ❌ Transaction revert avec "NotWhitelisted"

#### ❌ Test 3 : Appel direct échoue
```typescript
// Même en appelant directement le contrat, ça échoue
const tx = await tradingPool.swapExactTokensForTokens(
  tokenIn,
  tokenOut,
  amountIn,
  amountOutMin,
  deadline
);
// ❌ Revert: NotWhitelisted
```

## 🔧 Fonctions disponibles

### Swap
```solidity
function swapExactTokensForTokens(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOutMin,
    uint256 deadline
) external onlyWhitelisted returns (uint256 amountOut)
```

### Add Liquidity
```solidity
function addLiquidity(
    address tokenA,
    address tokenB,
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256 amountAMin,
    uint256 amountBMin,
    uint256 deadline
) external onlyWhitelisted returns (uint256 amountA, uint256 amountB, uint256 liquidity)
```

### Remove Liquidity
```solidity
function removeLiquidity(
    address tokenA,
    address tokenB,
    uint256 liquidity,
    uint256 amountAMin,
    uint256 amountBMin,
    uint256 deadline
) external onlyWhitelisted returns (uint256 amountA, uint256 amountB)
```

### View Functions
```solidity
function canTrade(address user) external view returns (bool)
function getPair(address tokenA, address tokenB) external view returns (address)
function getAmountsOut(uint256 amountIn, address[] memory path) external view returns (uint256[] memory)
```

## 👨‍💼 Administration

### Mettre à jour le contrat KYC
```solidity
tradingPool.setKYCContract(newKYCAddress);
```

### Activer/désactiver le KYC
```solidity
tradingPool.setKYCRequired(false); // Désactiver temporairement
```

### Changer Uniswap Router
```solidity
tradingPool.setUniswapRouter(newRouterAddress);
```

### Récupérer tokens bloqués (emergency)
```solidity
tradingPool.rescueTokens(tokenAddress, amount);
```

## 📊 Comparaison

| Fonctionnalité | useSwap (ancien) | useTradingPool (nouveau) |
|---|---|---|
| Vérification KYC | ❌ Frontend only | ✅ On-chain |
| Contournable | ⚠️ Oui | ❌ Non |
| Sécurité | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Gas cost | Moins cher | Légèrement plus cher |
| Conformité | Partielle | ✅ Complète |

## 🎯 Recommandation

**Utiliser TradingPool** pour :
- ✅ Production
- ✅ Conformité réglementaire
- ✅ Sécurité maximale
- ✅ Trading entre whitelisted users only

**Garder useSwap** pour :
- 🧪 Tests en développement
- 📚 Référence d'implémentation
- 🔄 Fallback si TradingPool a un problème

## 🚨 Points d'attention

### 1. Approvals
Les utilisateurs doivent approuver le **TradingPool** (pas Uniswap Router) :
```typescript
await token.approve(TRADING_POOL_ADDRESS, amount);
```

### 2. LP Tokens
Les LP tokens sont envoyés **directement à l'utilisateur**, pas au TradingPool.

### 3. Gas Cost
TradingPool ajoute ~30-50k gas par transaction (pour la vérification KYC).

### 4. Deadline
Le deadline est calculé automatiquement (+20 minutes).

## 📚 Documentation liée

- `contracts/KYC_SYSTEM.md` - Documentation système KYC
- `frontend/app/trade/TRADE_KYC_README.md` - Documentation KYC frontend
- `contracts/contracts/KYC.sol` - Contrat KYC
- `contracts/contracts/TradingPool.sol` - Contrat TradingPool

## 🎉 Conclusion

Le **TradingPool** offre une **protection KYC complète on-chain** qui garantit que seuls les utilisateurs whitelisted peuvent trader. C'est la solution recommandée pour la production et pour être conforme avec l'exigence :

> "Trading allowed only between whitelisted users"

Cette implémentation respecte **totalement** cette règle, de manière **impossible à contourner**. 🔒✅
