# 🚀 Guide de Démarrage Rapide - Frontend RWA Platform

## ✅ Installation Réussie !

Votre frontend Next.js est maintenant configuré et fonctionne sur **http://localhost:3000**

## 📋 Prochaines Étapes

### 1. Obtenir un WalletConnect Project ID (5 min)

1. Allez sur [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Créez un compte gratuit
3. Créez un nouveau projet
4. Copiez votre Project ID
5. Ajoutez-le dans `frontend/.env.local` :

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=votre_project_id_ici
```

### 2. Configurer vos Smart Contracts

Dans `frontend/.env.local`, remplacez les adresses `0x000...` par vos adresses de contrats déployés :

```env
NEXT_PUBLIC_ASSET_REGISTRY_ADDRESS=0xVotreAdresse...
NEXT_PUBLIC_KYC_MANAGER_ADDRESS=0xVotreAdresse...
NEXT_PUBLIC_COMPLIANCE_MANAGER_ADDRESS=0xVotreAdresse...
```

### 3. Ajouter vos ABIs

Copiez les ABIs de vos smart contracts dans `frontend/abi/` :

```bash
# Depuis Hardhat
cp ../artifacts/contracts/KYCManager.sol/KYCManager.json frontend/abi/

# Depuis Foundry
cp ../out/KYCManager.sol/KYCManager.json frontend/abi/
```

Puis importez-les dans vos hooks :

```typescript
import KYC_MANAGER_ABI from '@/abi/KYCManager.json';
```

### 4. Tester le Frontend

1. **Connectez votre wallet** : Cliquez sur "Connect Wallet" dans le header
2. **Vérifiez la conformité** : Allez sur `/kyc` pour voir votre statut KYC
3. **Explorez les actifs** : Allez sur `/assets` pour voir les actifs tokenisés
4. **Testez le trading** : Allez sur `/trade` pour l'interface d'échange

## 🛠️ Commandes Utiles

```bash
# Démarrer le serveur (déjà en cours)
cd frontend
npm run dev

# Build pour production
npm run build

# Lancer la version production
npm run start

# Vérifier les erreurs TypeScript
npm run lint
```

## 📁 Structure du Projet

```
frontend/
├── app/                    # Pages (Next.js App Router)
│   ├── page.tsx            # 🏠 Page d'accueil
│   ├── assets/             # 💎 Liste des actifs
│   ├── portfolio/          # 📊 Portfolio utilisateur
│   ├── trade/              # 💱 Interface de trading
│   └── kyc/                # ✅ Vérification KYC
├── components/             # 🧩 Composants réutilisables
├── hooks/                  # 🪝 Custom hooks Web3
├── config/                 # ⚙️ Configuration
├── abi/                    # 📄 ABIs des contrats
├── types/                  # 📝 Types TypeScript
└── utils/                  # 🔧 Utilitaires
```

## 🎨 Fonctionnalités Disponibles

- ✅ **Connexion Wallet** : RainbowKit avec support multi-wallets
- ✅ **Vérification KYC** : Affichage du statut on-chain
- ✅ **Liste d'Actifs** : Récupération depuis le registre on-chain
- ✅ **Portfolio** : Vue des investissements
- ✅ **Trading** : Interface buy/sell avec vérifications de conformité
- ✅ **Design Dark Mode** : Interface moderne avec TailwindCSS

## 🔧 Personnalisation

### Changer les couleurs

Dans `frontend/app/providers.tsx` :

```typescript
<RainbowKitProvider
  theme={darkTheme({
    accentColor: '#7b3ff2',  // Votre couleur
  })}
>
```

### Modifier le header

Éditez `frontend/components/Header.tsx`

### Ajouter une page

```bash
# Créer un nouveau dossier dans app/
mkdir frontend/app/nouvelle-page

# Créer page.tsx
touch frontend/app/nouvelle-page/page.tsx
```

## 🐛 Dépannage

### Le serveur ne démarre pas

```bash
# Rechargez les variables d'environnement
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Relancez
npm run dev
```

### Erreurs de connexion wallet

Vérifiez que `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` est bien configuré.

### Contracts non trouvés

Assurez-vous que :
1. Les adresses dans `.env.local` sont correctes
2. Vous êtes sur le bon réseau (Sepolia par défaut)
3. Les contrats sont déployés

### Erreurs TypeScript

```bash
# Vérifiez les types
npm run lint

# Reconstruisez
npm run build
```

## 📚 Documentation

- **Next.js** : https://nextjs.org/docs
- **wagmi** : https://wagmi.sh/
- **RainbowKit** : https://www.rainbowkit.com/
- **viem** : https://viem.sh/
- **TailwindCSS** : https://tailwindcss.com/

## 💡 Conseils

1. **Testez sur testnet** : Utilisez Sepolia ou Goerli avant mainnet
2. **Utilisez un indexer** : Pour des requêtes complexes, configurez un indexer GraphQL
3. **Gérez les erreurs** : Ajoutez des try/catch dans vos hooks
4. **Optimisez les appels RPC** : Utilisez le polling avec parcimonie

## 🔐 Sécurité

- ❌ **Jamais de clés privées** dans le code ou .env
- ✅ **Vérifications on-chain** : Toute la logique de conformité est dans les smart contracts
- ✅ **Validation des inputs** : Vérifiez les montants et adresses côté client
- ✅ **Rate limiting** : Limitez les appels RPC si nécessaire

## 🎓 Pour Aller Plus Loin

### Ajouter un indexer GraphQL

```typescript
// utils/graphql.ts
import { request, gql } from 'graphql-request';

const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL;

export async function getUserAssets(address: string) {
  const query = gql`
    query GetUserAssets($address: String!) {
      investments(where: { investor: $address }) {
        id
        asset { name, symbol }
        amount
      }
    }
  `;
  return request(INDEXER_URL, query, { address });
}
```

### Intégrer Uniswap pour le swap

```typescript
import { Pool, Route, Trade } from '@uniswap/v3-sdk';
// ... logique de swap
```

### Ajouter des notifications

```bash
npm install react-hot-toast
```

```typescript
import toast from 'react-hot-toast';

toast.success('Transaction confirmée !');
```

---

**🎉 Votre frontend est prêt ! Bon développement !**

Si vous avez des questions, consultez le README.md dans le dossier frontend.
