# 📋 Guide de Déploiement des Contrats et Configuration

## Étape 1: Démarrer un nœud Hardhat local

Dans le dossier `contracts/`:

```bash
# Terminal 1 - Démarrer le nœud local
npx hardhat node
```

Ce terminal doit rester ouvert. Il affichera les comptes de test et écoutera sur `http://127.0.0.1:8545`

## Étape 2: Déployer les smart contracts

Dans un **nouveau terminal**, dans le dossier `contracts/`:

```bash
# Terminal 2 - Déployer les contrats
npx hardhat run scripts/deploy.ts --network localhost
```

### ✅ Le script va déployer:

1. **KYC Manager** - Gestion de la conformité
2. **Oracle** - Prix pour actifs RWA et NFT
3. **Implementations** - ERC20, NFT, Pool (pour clones)
4. **Test Tokens** - USDC et USDT
5. **Factory** - Création d'actifs tokenisés

### 📝 Exemple de sortie:

```
🚀 Deploying contracts...
Deploying from: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

📋 Deploying KYC Manager...
✅ KYC Manager deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3

🔮 Deploying Oracle...
✅ Oracle deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

🧱 Deploying Implementations...
✅ ERC20 implementation: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
✅ NFT implementation: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
✅ Pool implementation: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9

💰 Deploying Test Tokens...
✅ USDC deployed at: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
✅ USDT deployed at: 0x0165878A594ca255338adfa4d48449f69242Eb8F

🏭 Deploying Asset Factory...
✅ Factory deployed at: 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853

📝 Add these to your .env.local:

NEXT_PUBLIC_ASSET_FACTORY_ADDRESS=0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
NEXT_PUBLIC_KYC_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_ORACLE_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_ROUTER_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
NEXT_PUBLIC_BASE_TOKEN_ADDRESS=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
NEXT_PUBLIC_LOCAL_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_DEFAULT_ASSET_ID=1
NEXT_PUBLIC_USDC_ADDRESS=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
NEXT_PUBLIC_USDT_ADDRESS=0x0165878A594ca255338adfa4d48449f69242Eb8F

✨ Deployment complete!
```

## Étape 3: Copier les adresses dans .env.local

Dans le dossier `frontend/`:

1. **Créer le fichier `.env.local`** (s'il n'existe pas):
   ```bash
   # Copier l'exemple
   cp .env.local.example .env.local
   ```

2. **Coller les adresses** affichées par le script de déploiement dans `.env.local`:

```bash
# Remplacer les 0x0000... par vos vraies adresses
NEXT_PUBLIC_ASSET_FACTORY_ADDRESS=0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
NEXT_PUBLIC_KYC_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_ORACLE_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_ROUTER_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
NEXT_PUBLIC_BASE_TOKEN_ADDRESS=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
NEXT_PUBLIC_USDC_ADDRESS=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
NEXT_PUBLIC_USDT_ADDRESS=0x0165878A594ca255338adfa4d48449f69242Eb8F
NEXT_PUBLIC_LOCAL_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_DEFAULT_ASSET_ID=1
```

## Étape 4: Démarrer le frontend

Dans le dossier `frontend/`:

```bash
npm run dev
```

Le frontend sera accessible sur `http://localhost:3000`

## 🔐 Configuration MetaMask

Pour tester l'application:

1. **Ajouter le réseau Hardhat dans MetaMask**:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Importer un compte de test**:
   - Copier une clé privée affichée par `npx hardhat node`
   - Dans MetaMask: Import Account → Coller la clé privée

⚠️ **IMPORTANT**: N'utilisez JAMAIS ces clés privées en production!

## 🔮 Tester l'Oracle

Une fois le frontend démarré:

1. Allez sur la page **Oracle** (`/oracle`)
2. Vous verrez les actifs avec leurs prix (initialement à $0.00 si non configurés)
3. Pour définir un prix, vous pouvez interagir avec le contrat Oracle via un script ou Hardhat console

### Définir un prix via Hardhat console:

```bash
# Dans le dossier contracts/
npx hardhat console --network localhost
```

```javascript
// Dans la console Hardhat
const Oracle = await ethers.getContractFactory("Oracle");
const oracle = await Oracle.attach("VOTRE_ADRESSE_ORACLE");

// Définir le prix de l'asset 1 à $1000.00 (6 décimales)
await oracle.setPrice(1, ethers.parseUnits("1000", 6));

// Vérifier
const [price, timestamp] = await oracle.getPrice(1);
console.log("Price:", ethers.formatUnits(price, 6));
```

## 📊 Créer un nouvel actif

Via le frontend ou via console:

```javascript
const Factory = await ethers.getContractFactory("Factory");
const factory = await Factory.attach("VOTRE_ADRESSE_FACTORY");

await factory.createAsset(
  "My Real Estate Token",
  "MRET",
  "ipfs://metadata-uri",
  100,  // 100 tokens
  ethers.parseUnits("1000", 6)  // 1000 USDC par token
);
```

## 🔄 Redéployer les contrats

Si vous modifiez les contrats:

1. **Arrêter** le nœud Hardhat (Ctrl+C dans Terminal 1)
2. **Redémarrer** `npx hardhat node`
3. **Redéployer** `npx hardhat run scripts/deploy.ts --network localhost`
4. **Mettre à jour** les adresses dans `.env.local`
5. **Redémarrer** le frontend

## ❓ Dépannage

### Le frontend ne trouve pas les contrats

✅ Vérifiez que:
- Les adresses dans `.env.local` sont correctes
- Le nœud Hardhat est démarré
- Vous avez redémarré le serveur Next.js après modification de `.env.local`

### MetaMask affiche "Transaction failed"

✅ Vérifiez que:
- Vous êtes connecté au bon réseau (Hardhat Local, Chain ID 31337)
- Votre compte a assez d'ETH
- Le contrat est bien déployé à l'adresse spécifiée

### Oracle affiche "$0.00"

✅ C'est normal! Les prix doivent être définis manuellement via `setPrice()`:
```bash
npx hardhat console --network localhost
# Puis utilisez oracle.setPrice(assetId, price)
```

## 📚 Ressources

- [Documentation Oracle](./ORACLE_DOCUMENTATION.md)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
