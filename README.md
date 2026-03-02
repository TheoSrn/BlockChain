# 🏢 Tokenized Real Estate Platform

Plateforme blockchain de tokenisation d'actifs immobiliers avec trading décentralisé, conformité KYC on-chain, et synchronisation temps-réel.

**⛓️ Network:** Ethereum Sepolia Testnet

---

## 🎯 Qu'est-ce que c'est ?

Une application complète pour tokeniser des **biens immobiliers** (bureaux, villas, terrains) et les échanger de manière sécurisée sur blockchain :

- 🏠 **Tokenisation** : Créer des tokens ERC-20 (divisibles) ou ERC-721 (uniques)
- ✅ **KYC On-Chain** : Whitelist/Blacklist enforced dans tous les contrats
- 💱 **Trading DEX** : Uniswap V2 avec vérification KYC obligatoire
- 📊 **Oracle** : Prix des assets mis à jour en temps réel
- 🔄 **Indexer** : Synchronisation automatique via WebSocket

---

## 🚀 Quick Start

```bash
# 1. Cloner le repo
git clone <votre-repo>
cd BlockChain

# 2. Installer les dépendances
npm install --prefix contracts
npm install --prefix frontend
npm install --prefix indexer

# 3. Lancer l'application
cd frontend && npm run dev        # Frontend → http://localhost:3000
cd indexer && npm run dev         # Indexer → http://localhost:3001
```

📖 **Guide complet :** [INSTALLATION.md](./INSTALLATION.md)

---

## 📝 Déploiement des Contrats

```bash
# Déployer tous les contrats sur Sepolia
cd contracts
npx hardhat run scripts/deployAll.ts --network sepolia
```

Le script affiche les adresses à copier dans `frontend/.env.local` :
- `NEXT_PUBLIC_ASSET_FACTORY_ADDRESS`
- `NEXT_PUBLIC_KYC_ADDRESS`
- `NEXT_PUBLIC_ORACLE_ADDRESS`
- `NEXT_PUBLIC_TRADING_POOL_ADDRESS`

📖 **Configuration complète :** [INSTALLATION.md](./INSTALLATION.md)

---

## 🏗️ Stack Technique

**Smart Contracts**  
Solidity 0.8.20 + OpenZeppelin + Hardhat

**Frontend**  
Next.js 14 + TypeScript + Wagmi + TailwindCSS

**Backend**  
Node.js + WebSocket + REST API (Indexer temps-réel)

**Blockchain**  
Ethereum Sepolia (EVM) + Uniswap V2

---

## 📚 Documentation

- **[HOW_TO_USE.md](./HOW_TO_USE.md)** → Guide utilisateur
- **[DESIGN_CHOICES.md](./DESIGN_CHOICES.md)** → Justifications techniques
- **[INSTALLATION.md](./INSTALLATION.md)** → Installation & configuration

---

## 🎁 Bonus Implémentés

✅ Upgradeable contracts (Proxy pattern - Clones EIP-1167)  
✅ Custom indexer avec WebSocket real-time  
✅ Oracle system on-chain  
✅ KYC workflow avancé  
✅ Gas optimization (factory pattern)

---

## 🎥 Démo

**Vidéo complète :** [Lien YouTube à ajouter]

Démo inclut :
1. Connexion wallet + vérification KYC
2. Création asset immobilier (ERC-20 + NFT)
3. Trading sur DEX avec liquidité
4. Mise à jour prix Oracle
5. Synchronisation temps-réel (indexer)

---

## 📄 License

MIT
