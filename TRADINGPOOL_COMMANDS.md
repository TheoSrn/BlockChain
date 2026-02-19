# 🎯 Commandes Essentielles - TradingPool

## ⚡ Déploiement Rapide

### Windows (PowerShell)
```powershell
cd contracts
.\deploy-quick.ps1
```

### Linux/Mac
```bash
cd contracts
chmod +x deploy-quick.sh
./deploy-quick.sh
```

### Manuel
```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deployTradingPool.ts --network sepolia
```

## 📝 Configuration Minimale

### contracts/.env
```bash
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
KYC_ADDRESS=0x...  # Votre KYC déployé
```

### frontend/.env.local
```bash
NEXT_PUBLIC_TRADING_POOL_ADDRESS=0x...  # Copier après déploiement
NEXT_PUBLIC_KYC_ADDRESS=0x...
```

## 🔍 Vérifications Post-Déploiement

### Via Console
```bash
npx hardhat console --network sepolia
```

```javascript
const tp = await ethers.getContractAt("TradingPool", "0x...");
await tp.kycContract();      // Vérifier KYC
await tp.kycRequired();      // true
await tp.owner();            // Votre adresse
```

### Via Etherscan
```
https://sepolia.etherscan.io/address/0x...
```

## 👥 Whitelist Users

### Script manageKYC
```bash
npx hardhat run scripts/manageKYC.ts --network sepolia
```

### Console
```javascript
const kyc = await ethers.getContractAt("KYC", "0x...");
await kyc.setWhitelisted("0xUserAddress", true);
```

## 🧪 Tests Essentiels

### 1. Vérifier canTrade
```javascript
const tp = await ethers.getContractAt("TradingPool", "0x...");
await tp.canTrade("0xYourAddress");  // true = OK
```

### 2. Test Approve + Swap
```javascript
// 1. Approve token
const token = await ethers.getContractAt("IERC20", "0xTokenAddress");
await token.approve("0xTradingPoolAddress", ethers.parseEther("100"));

// 2. Swap
const deadline = Math.floor(Date.now() / 1000) + 1200;
await tp.swapExactTokensForTokens(
  "0xTokenIn",
  "0xTokenOut",
  ethers.parseEther("1"),
  ethers.parseEther("0.95"),  // min out
  deadline
);
```

## 🔧 Administration

### Changer KYC Contract
```javascript
await tp.setKYCContract("0xNewKYCAddress");
```

### Désactiver KYC temporairement
```javascript
await tp.setKYCRequired(false);
```

### Transfer Ownership
```javascript
await tp.transferOwnership("0xNewOwner");
```

## 🚨 Erreurs Communes

### "NotWhitelisted"
```bash
# Solution: Whitelist l'adresse
npx hardhat run scripts/manageKYC.ts --network sepolia
```

### "insufficient funds"
```bash
# Solution: Ajouter SepoliaETH
# Faucet: https://sepoliafaucet.com/
```

### "no liquidity pool found"
```bash
# Solution: Créer pool + ajouter liquidité sur Uniswap V2
```

## 📱 Frontend

### Démarrer le frontend
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000/trade
```

### Vérifier config
```typescript
// config/contracts.ts
TRADING_POOL: process.env.NEXT_PUBLIC_TRADING_POOL_ADDRESS
```

## 🎯 Workflow Complet

### 1️⃣ Déploiement Initial
```bash
# Déployer KYC (si pas déjà fait)
npx hardhat run scripts/deployKYC.ts --network sepolia

# Déployer TradingPool
npx hardhat run scripts/deployTradingPool.ts --network sepolia
```

### 2️⃣ Configuration
```bash
# Sauvegarder adresses dans .env.local
echo "NEXT_PUBLIC_TRADING_POOL_ADDRESS=0x..." >> frontend/.env.local
```

### 3️⃣ Whitelist
```bash
# Whitelist votre adresse
npx hardhat run scripts/manageKYC.ts --network sepolia
```

### 4️⃣ Test Interface
```bash
# Démarrer frontend
cd frontend && npm run dev

# Tester:
# 1. Connecter wallet ✅
# 2. Voir status KYC ✅
# 3. Essayer swap ✅
```

## 📊 Gas Costs (Sepolia - gratuit)

| Action | Gas |
|--------|-----|
| Deploy TradingPool | ~2-3M |
| Whitelist user | ~50k |
| Approve token | ~50k |
| Swap | ~150-200k |
| Add Liquidity | ~200-300k |

## ✅ Checklist Déploiement

- [ ] Contrat compilé sans erreur
- [ ] .env configuré (PRIVATE_KEY, RPC, KYC_ADDRESS)
- [ ] Wallet avec SepoliaETH
- [ ] TradingPool déployé
- [ ] Adresse sauvegardée
- [ ] Frontend .env.local configuré
- [ ] Votre adresse whitelisted
- [ ] Interface testée

## 🎉 Succès !

Une fois toutes les étapes complétées :
- ✅ Trading avec KYC on-chain fonctionnel
- ✅ Sécurité maximale
- ✅ Interface prête
- ✅ Conforme à l'énoncé

Votre plateforme de trading est opérationnelle ! 🚀
