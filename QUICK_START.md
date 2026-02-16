# 🚀 Quick Start - Contract Addresses

## Pour obtenir les adresses de vos contrats:

### 1️⃣ Démarrer Hardhat (Terminal 1)
```bash
cd contracts
npx hardhat node
```
☝️ Laissez ce terminal ouvert!

### 2️⃣ Déployer les contrats (Terminal 2)
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```

### 3️⃣ Copier les adresses affichées

Le script affichera quelque chose comme:
```
📝 Add these to your .env.local:

NEXT_PUBLIC_ASSET_FACTORY_ADDRESS=0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
NEXT_PUBLIC_KYC_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_ORACLE_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
...
```

### 4️⃣ Créer le fichier .env.local dans frontend/

```bash
cd frontend
cp .env.local.example .env.local
```

Puis **coller les adresses** du déploiement dans votre `.env.local`

### 5️⃣ Démarrer le frontend
```bash
cd frontend
npm run dev
```

---

## 📖 Guide complet

Pour plus de détails, voir [CONTRACT_DEPLOYMENT_GUIDE.md](frontend/CONTRACT_DEPLOYMENT_GUIDE.md)

## 🔮 Oracle

L'Oracle fournit des prix pour les actifs tokenisés. Voir [ORACLE_DOCUMENTATION.md](frontend/ORACLE_DOCUMENTATION.md)
