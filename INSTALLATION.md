# Installation et Lancement

## 📋 Prérequis

### Logiciels Nécessaires
- **Node.js 18+** : [Télécharger ici](https://nodejs.org/)
- **npm** : Installé avec Node.js
- **MetaMask** : [Extension navigateur](https://metamask.io/)

### Services Externes
- **Compte Infura** (optionnel) : Pour RPC Sepolia
- **Etherscan API Key** (optionnel) : Pour historique transactions

## 🚀 Installation Rapide

### 1. Cloner le Projet

```powershell
git clone https://github.com/votre-repo/BlockChain.git
cd BlockChain
```

### 2. Installer les Dépendances

**Smart Contracts :**
```powershell
cd contracts
npm install
```

**Frontend :**
```powershell
cd ../frontend
npm install
```

**Indexer (optionnel) :**
```powershell
cd ../indexer
npm install
```

## ⚙️ Configuration

### 1. Variables d'Environnement - Smart Contracts

Créer `contracts/.env` :

```env
# RPC Sepolia
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/VOTRE_KEY_INFURA

# Votre clé privée (wallet de déploiement)
SEPOLIA_PRIVATE_KEY=votre_private_key_ici

# Etherscan (pour vérifier les contrats)
ETHERSCAN_API_KEY=votre_api_key_ici
```

⚠️ **IMPORTANT :** Ne jamais commit le fichier `.env` !

### 2. Variables d'Environnement - Frontend

Créer `frontend/.env.local` :

```env
# Contrats déployés
NEXT_PUBLIC_ASSET_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_KYC_ADDRESS=0x...
NEXT_PUBLIC_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_TRADING_POOL_ADDRESS=0x...

# Uniswap (déjà déployé sur Sepolia)
NEXT_PUBLIC_UNISWAP_V2_ROUTER=0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008
NEXT_PUBLIC_UNISWAP_V2_FACTORY=0x7E0987E5b3a30e3f2828572Bb659A548460a3003

# Tokens de test
NEXT_PUBLIC_USDC_ADDRESS=0x461Ca34a940680c2e34E6928F54BF38D0a29C494
NEXT_PUBLIC_USDT_ADDRESS=0xf7d3677312e147c857e596583eB31185cf2b70e9
NEXT_PUBLIC_WETH_ADDRESS=0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14

# Configuration réseau
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/VOTRE_KEY

# Etherscan API (optionnel)
ETHERSCAN_API_KEY=votre_api_key_ici
```

## 🔨 Compilation des Smart Contracts

```powershell
cd contracts
npx hardhat compile
```

✅ Ça devrait afficher "Compiled X Solidity files successfully"

## 🚀 Déploiement des Smart Contracts

### Option 1 : Sur Testnet Sepolia

**1. Obtenir du Sepolia ETH :**
- [Faucet Alchemy](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Faucet Infura](https://www.infura.io/faucet/sepolia)

**2. Déployer tous les contrats :**
```powershell
cd contracts
npx hardhat run scripts/deployAll.ts --network sepolia
```

**3. Noter les adresses :**
Le script affichera toutes les adresses déployées. Copiez-les dans `frontend/.env.local`.

**4. Créer les pools de liquidité :**
```powershell
npx hardhat run scripts/createLiquidityPools.ts --network sepolia
```

**5. Ajouter la liquidité initiale :**
```powershell
npx hardhat run scripts/addInitialLiquidity.ts --network sepolia
```

### Option 2 : Sur Localhost (développement)

**1. Démarrer un nœud local :**
```powershell
cd contracts
npx hardhat node
```
⚠️ Laisser cette fenêtre ouverte

**2. Dans une nouvelle fenêtre, déployer :**
```powershell
cd contracts
npx hardhat run scripts/deployAll.ts --network localhost
```

## 🎨 Lancer le Frontend

### Développement

```powershell
cd frontend
npm run dev
```

Ouvrir : **http://localhost:3000**

### Production

```powershell
cd frontend
npm run build
npm start
```

## 🔧 Configuration MetaMask

### 1. Ajouter le Réseau Sepolia

**Paramètres :**
- **Nom du réseau :** Sepolia
- **RPC URL :** https://sepolia.infura.io/v3/VOTRE_KEY
- **Chain ID :** 11155111
- **Symbole :** ETH
- **Block Explorer :** https://sepolia.etherscan.io

### 2. Importer les Tokens de Test

**USDC :**
- Adresse : `0x461Ca34a940680c2e34E6928F54BF38D0a29C494`
- Symbole : USDC
- Décimales : 6

**USDT :**
- Adresse : `0xf7d3677312e147c857e596583eB31185cf2b70e9`
- Symbole : USDT
- Décimales : 6

**WETH :**
- Adresse : `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14`
- Symbole : WETH
- Décimales : 18

### 3. Se Whitelister (KYC)

**Option A : Via le frontend**
- Aller sur `/kyc`
- Si première connexion, vous serez auto-whitelisté

**Option B : Via Hardhat console**
```powershell
cd contracts
npx hardhat console --network sepolia
```

```javascript
const kyc = await ethers.getContractAt("KYC", "ADRESSE_KYC");
await kyc.addToWhitelist("VOTRE_WALLET_ADDRESS");
```

## 📦 Scripts Utiles

### Mint des Tokens de Test

```powershell
cd contracts
npx hardhat run scripts/mintTestTokens.ts --network sepolia
```

Vous recevrez 10,000 USDC et 10,000 USDT.

### Créer un Asset de Test

```powershell
npx hardhat run scripts/createAsset.ts --network sepolia
```

### Configurer les Prix Oracle

```powershell
npx hardhat run scripts/setPrices.ts --network sepolia
```

### Vérifier le KYC

```powershell
npx hardhat run scripts/checkKYC.ts --network sepolia
```

## 🧪 Tests

### Tester les Smart Contracts

```powershell
cd contracts
npx hardhat test
```

### Tester le Frontend

```powershell
cd frontend
npm run test
```

## 🐛 Dépannage

### Problème : "Cannot find module..."

**Solution :**
```powershell
rm -rf node_modules package-lock.json
npm install
```

### Problème : "Network error" dans MetaMask

**Solutions :**
1. Vérifier que MetaMask est sur Sepolia
2. Vérifier votre RPC URL dans `.env.local`
3. Réinitialiser MetaMask : Settings → Advanced → Reset Account

### Problème : "Not whitelisted"

**Solution :**
```powershell
cd contracts
npx hardhat run scripts/manageKYC.ts --network sepolia
```

Puis suivre les instructions pour vous ajouter à la whitelist.

### Problème : Port 3000 déjà utilisé

**Solution :**
```powershell
# Changer le port
cd frontend
npm run dev -- -p 3001
```

### Problème : Transaction failed

**Vérifications :**
1. Vous avez assez de ETH pour le gas ?
2. Vous êtes whitelisté (KYC) ?
3. Vous avez approve le contrat ?
4. Le contrat est déployé à la bonne adresse ?

## 📚 Structure du Projet

```
BlockChain/
│
├── contracts/              # Smart contracts Solidity
│   ├── contracts/         # Fichiers .sol
│   ├── scripts/           # Scripts de déploiement
│   ├── test/              # Tests Hardhat
│   └── hardhat.config.ts  # Config Hardhat
│
├── frontend/              # Application Next.js
│   ├── app/              # Pages (App Router)
│   ├── components/       # Composants React
│   ├── hooks/            # Custom hooks Web3
│   ├── abi/              # ABIs des contrats
│   └── services/         # Logique métier
│
└── indexer/               # Indexeur blockchain (optionnel)
    └── src/              # Code de l'indexeur
```

## 🎯 Workflow Complet

1. **Installation** : `npm install` dans contracts/ et frontend/
2. **Configuration** : Créer les `.env` avec les bonnes valeurs
3. **Compilation** : `npx hardhat compile`
4. **Déploiement** : `npx hardhat run scripts/deployAll.ts --network sepolia`
5. **Copier adresses** : Du output vers `frontend/.env.local`
6. **Créer pools** : `npx hardhat run scripts/createLiquidityPools.ts --network sepolia`
7. **Mint tokens** : `npx hardhat run scripts/mintTestTokens.ts --network sepolia`
8. **Lancer frontend** : `npm run dev` dans frontend/
9. **Configurer MetaMask** : Ajouter Sepolia et les tokens
10. **Se whitelister** : Via `/kyc` ou script
11. **Utiliser l'app** : http://localhost:3000

## ✅ Tout Fonctionne Si...

- Le frontend charge sur http://localhost:3000
- Vous pouvez connecter MetaMask
- La page `/kyc` affiche "Whitelisted"
- Vous voyez vos balances de tokens
- Vous pouvez créer un asset sur `/tokenize`
- Vous pouvez trader sur `/trade`

## 📞 Besoin d'Aide ?

- Documentation Hardhat : https://hardhat.org/docs
- Documentation Next.js : https://nextjs.org/docs
- Documentation Wagmi : https://wagmi.sh/
- Sepolia Faucet : https://www.alchemy.com/faucets/ethereum-sepolia
- Sepolia Explorer : https://sepolia.etherscan.io
