# 🚀 Déploiement TradingPool - Guide Rapide

## ✅ Prérequis

- [x] Contrat compilé avec succès
- [ ] Contrat KYC déployé
- [ ] Wallet avec des fonds (ETH pour gas)
- [ ] Configuration .env

## 📋 Étapes de déploiement

### 1. Configurer .env

```bash
cd contracts
cp .env.tradingpool.example .env
# Éditer .env avec vos valeurs
```

**Variables à configurer :**
```bash
# Votre wallet
PRIVATE_KEY=votre_clé_privée

# Réseau (choisir un)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Contrat KYC existant
KYC_ADDRESS=0x... # Votre adresse KYC

# Uniswap V2 sur Sepolia (déjà configuré)
UNISWAP_V2_ROUTER=0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008
UNISWAP_V2_FACTORY=0x7E0987E5b3a30e3f2828572Bb659A548460a3003
```

### 2. Vérifier hardhat.config.ts

Assurez-vous que Sepolia est configuré :

```typescript
sepolia: {
  url: process.env.SEPOLIA_RPC_URL || "",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
}
```

### 3. Déployer sur Sepolia

```bash
npx hardhat run scripts/deployTradingPool.ts --network sepolia
```

**Sortie attendue :**
```
🚀 DEPLOYING TRADING POOL WITH KYC VERIFICATION
✅ TradingPool deployed at: 0xABCD...1234
```

### 4. Sauvegarder l'adresse

**IMPORTANT :** Copiez l'adresse du TradingPool déployé.

### 5. Configurer le frontend

Créer/modifier `frontend/.env.local` :

```bash
# TradingPool déployé
NEXT_PUBLIC_TRADING_POOL_ADDRESS=0xABCD...1234

# KYC
NEXT_PUBLIC_KYC_ADDRESS=0x...

# Uniswap V2
NEXT_PUBLIC_UNISWAP_V2_ROUTER=0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008
NEXT_PUBLIC_UNISWAP_V2_FACTORY=0x7E0987E5b3a30e3f2828572Bb659A548460a3003
```

### 6. Whitelist votre adresse

```bash
# Si vous utilisez le script manageKYC
npx hardhat run scripts/manageKYC.ts --network sepolia

# Ou manuellement via Hardhat console
npx hardhat console --network sepolia
> const KYC = await ethers.getContractAt("KYC", "0x...")
> await KYC.setWhitelisted("0xYourAddress", true)
```

### 7. Installer le frontend

```bash
cd ../frontend
npm install
npm run dev
```

### 8. Tester l'interface

1. Aller sur http://localhost:3000/trade
2. Connecter votre wallet whitelisted
3. Essayer un swap
4. ✅ Ça devrait fonctionner !

## 🔍 Vérification du déploiement

### Vérifier sur Etherscan

1. Aller sur https://sepolia.etherscan.io/
2. Chercher votre adresse TradingPool
3. Vérifier :
   - ✅ Contrat déployé
   - ✅ Owner correct
   - ✅ KYC contract correct

### Vérifier via Hardhat console

```bash
npx hardhat console --network sepolia
```

```javascript
// Charger le contrat
const TradingPool = await ethers.getContractAt("TradingPool", "0xABCD...1234");

// Vérifier config
const kycAddress = await TradingPool.kycContract();
const kycRequired = await TradingPool.kycRequired();
const owner = await TradingPool.owner();

console.log("KYC:", kycAddress);
console.log("KYC Required:", kycRequired);
console.log("Owner:", owner);

// Vérifier si vous pouvez trader
const canTrade = await TradingPool.canTrade("0xYourAddress");
console.log("Can trade:", canTrade);
```

## ⚠️ Troubleshooting

### Erreur: "KYC contract not found"
**Solution :** Déployer d'abord le contrat KYC :
```bash
npx hardhat run scripts/deployKYC.ts --network sepolia
```

### Erreur: "insufficient funds"
**Solution :** Ajouter du SepoliaETH via un faucet :
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### Erreur: "user is not whitelisted"
**Solution :** Whitelist votre adresse dans le contrat KYC :
```bash
npx hardhat run scripts/manageKYC.ts --network sepolia
```

### Erreur: "no liquidity pool found"
**Solution :** C'est normal si aucune liquidité n'a été ajoutée. Pour trader :
1. Créer une paire sur Uniswap V2
2. Ajouter de la liquidité initiale
3. Ensuite vous pourrez swap

## 📊 Coûts estimés (Sepolia)

- Déploiement TradingPool : ~2-3M gas
- Whitelist user : ~50k gas  
- Swap : ~150-200k gas
- Add Liquidity : ~200-300k gas

Sur Sepolia, le gas est gratuit (testnet).

## 🎯 Prochaines étapes après déploiement

1. ✅ TradingPool déployé
2. ✅ Frontend configuré
3. ⏭️ Créer des tokens de test
4. ⏭️ Créer des pools Uniswap
5. ⏭️ Ajouter liquidité initiale
6. ⏭️ Tester les swaps
7. ⏭️ Inviter d'autres users (whitelist)

## 🔐 Sécurité IMPORTANT

### ⚠️ NE JAMAIS :
- ❌ Commit votre PRIVATE_KEY
- ❌ Partager votre .env
- ❌ Utiliser la même clé pour Mainnet et testnet

### ✅ TOUJOURS :
- ✅ Ajouter .env dans .gitignore
- ✅ Utiliser des wallets séparés pour test
- ✅ Vérifier les adresses avant d'envoyer des fonds
- ✅ Tester en testnet avant mainnet

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifier les logs du déploiement
2. Vérifier sur Etherscan
3. Utiliser Hardhat console pour debug
4. Consulter TRADING_POOL_GUIDE.md pour plus de détails

## ✨ Succès !

Une fois déployé avec succès, vous avez :
- 🔒 Trading avec vérification KYC on-chain
- ✅ Sécurité maximale (impossible à contourner)
- ✅ Conformité avec l'énoncé
- ✅ Interface frontend prête à utiliser

Félicitations ! 🎉
