# ✅ Guide de Vérification Manuel - RWA Platform

Guide complet pour tester toutes les fonctionnalités implémentées.

---

## 🚀 Étape 1 : Démarrer le Serveur

### Dans le terminal VS Code (PowerShell) :

```powershell
# 1. Recharger le PATH (si npm n'est pas reconnu)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 2. Aller dans le dossier frontend
cd frontend

# 3. Démarrer le serveur
npm run dev
```

**Attendez que le message apparaisse** :
```
✓ Ready in 3.2s
○ Local:        http://localhost:3000
○ Environments: .env.local
```

➡️ **Le serveur est prêt sur http://localhost:3000**

---

## 🔍 Étape 2 : Tests de l'Interface

### ✅ Test 1 : Page d'Accueil

1. **Ouvrir** : http://localhost:3000
2. **Vérifier** :
   - ✅ Header avec logo "RWA Platform" en haut
   - ✅ Navigation (Dashboard, Assets, Portfolio, Trade, KYC)
   - ✅ Bouton "Connect Wallet" en haut à droite (violet/rose)
   - ✅ Hero section avec titre
   - ✅ Cartes de fonctionnalités (Tokenize Assets, Secure Trading, etc.)
   - ✅ Pas d'erreurs dans la console (F12)

**Screenshot attendu** :
```
┌─────────────────────────────────────────────────┐
│ [Logo] RWA Platform    Nav Menu   [Connect]    │
├─────────────────────────────────────────────────┤
│                                                  │
│     Welcome to RWA Platform                      │
│     Tokenize, Trade, and Manage Assets          │
│                                                  │
│  [Tokenize Assets]  [Secure Trading]  [KYC]     │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

### ✅ Test 2 : Connexion Wallet (CRUCIAL)

1. **Cliquer** sur "Connect Wallet"
2. **Vérifier** :
   - ✅ Modal RainbowKit s'ouvre (fond sombre)
   - ✅ Liste des wallets disponibles :
     - MetaMask
     - WalletConnect
     - Coinbase Wallet
     - Rainbow
     - (autres selon ce qui est installé)

**Si WalletConnect Project ID manque** :
```
⚠️ Erreur: "Project ID is required"
```
➡️ **Solution** : Ajouter dans `.env.local` :
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=votre_project_id
```

3. **Connecter avec MetaMask** :
   - Cliquer sur MetaMask
   - Approuver dans l'extension
   - Le modal se ferme

4. **Vérifier après connexion** :
   - ✅ Bouton "Connect Wallet" remplacé par :
     - Badge réseau (ex: "Sepolia")
     - Votre adresse (ex: "0x1234...5678")
     - **Badge KYC** (cercle coloré à gauche) :
       - 🟢 Vert si KYC vérifié + whitelisté
       - 🟡 Jaune si non vérifié
       - 🔴 Rouge si blacklisté

**Screenshot attendu après connexion** :
```
┌──────────────────────────────────────────┐
│ [Sepolia ▼] [🟡 0x1234...5678 ▼]       │
└──────────────────────────────────────────┘
```

---

### ✅ Test 3 : Badge KYC dans le Wallet Button

**Objectif** : Vérifier que le badge KYC s'affiche correctement

1. **Après connexion**, regarder le bouton wallet
2. **Vérifier le badge** (icône ronde à gauche de l'adresse) :

**Si vous n'êtes PAS KYC vérifié** :
- 🟡 Cercle jaune avec icône ⚠️
- Tooltip au survol : "KYC Required"

**Si vous ÊTES KYC vérifié ET whitelisté** :
- 🟢 Cercle vert avec icône ✅
- Tooltip au survol : "KYC Verified & Whitelisted"

**Si vous êtes BLACKLISTÉ** :
- 🔴 Cercle rouge avec icône 🚫
- Tooltip au survol : "Blacklisted - Cannot trade"

**Note** : Le badge se met à jour automatiquement toutes les 10 secondes en lisant la blockchain.

---

### ✅ Test 4 : Page KYC (Affichage Détaillé)

1. **Cliquer** sur "KYC" dans la navigation
2. **URL** : http://localhost:3000/kyc
3. **Vérifier** :

**Si wallet NON connecté** :
```
┌────────────────────────────────────┐
│   Connect Your Wallet              │
│   Please connect your wallet to    │
│   complete KYC verification        │
└────────────────────────────────────┘
```

**Si wallet CONNECTÉ** :
```
┌────────────────────────────────────────────────┐
│  KYC Verification                              │
├────────────────────────────────────────────────┤
│  [Formulaire KYC]      │ [Compliance Status]   │
│                        │                        │
│  Full Name: ___        │ ⚠️ Pending             │
│  Country: ___          │                        │
│  Document: ___         │ ❌ KYC Verification    │
│                        │ ❌ Whitelist Status    │
│  [Submit]              │ ✅ Blacklist Status    │
│                        │                        │
│                        │ ⚠️ KYC verification    │
│                        │    required            │
└────────────────────────────────────────────────┘
```

**Sidebar droite - Compliance Status** :
- ✅ Badge de statut principal (Verified/Pending/Blacklisted)
- ✅ 3 lignes de vérification :
  - KYC Verification (✅ Verified / ❌ Not Verified)
  - Whitelist Status (✅ Whitelisted / ❌ Not Whitelisted)
  - Blacklist Status (✅ Clear / ⚠️ Blacklisted)
- ✅ Niveau KYC si présent (ex: "Level 1")
- ✅ Message de raison si bloqué
- ✅ Bouton "Complete KYC Verification" si non vérifié

---

### ✅ Test 5 : Détection du Réseau

1. **Dans MetaMask**, changer de réseau :
   - Choisir "Ethereum Mainnet" ou un autre réseau

2. **Vérifier dans l'interface** :
   - ✅ Badge réseau change (ex: "Ethereum")
   - ✅ Si réseau non supporté :
     ```
     ⚠️ Wrong Network
     ```
     (Bouton devient rouge)

3. **Cliquer sur le badge réseau** :
   - ✅ Modal RainbowKit s'ouvre
   - ✅ Liste des réseaux disponibles
   - ✅ Possibilité de switch en 1 clic

4. **Revenir sur Sepolia** :
   - Interface redevient normale

---

### ✅ Test 6 : Dashboard

1. **Cliquer** sur "Dashboard" dans la navigation
2. **URL** : http://localhost:3000/dashboard
3. **Vérifier** :
   - ✅ Statistiques affichées (Total Value, Assets Owned, etc.)
   - ✅ Section "Your Holdings"
   - ✅ Section "Quick Actions"
   - ✅ Section "Recent Activity"
   - ✅ Statut de conformité affiché en haut

---

### ✅ Test 7 : Page Assets

1. **Cliquer** sur "Assets" dans la navigation
2. **URL** : http://localhost:3000/assets
3. **Vérifier** :
   - ✅ Titre "Available Assets"
   - ✅ Filtres (All Assets, Real Estate, Art, etc.)
   - ✅ Liste des actifs ou message "Connect wallet"
   - ✅ Chaque carte d'actif affiche nom, type, prix

---

### ✅ Test 8 : Page Portfolio

1. **Cliquer** sur "Portfolio"
2. **URL** : http://localhost:3000/portfolio
3. **Vérifier** :
   - ✅ Total Portfolio Value
   - ✅ Liste des holdings (vos actifs)
   - ✅ Statut de conformité

---

### ✅ Test 9 : Page Trade

1. **Cliquer** sur "Trade"
2. **URL** : http://localhost:3000/trade
3. **Vérifier** :
   - ✅ Interface de swap
   - ✅ Sélection token From / To
   - ✅ Input montant
   - ✅ Bouton "Connect Wallet" si déconnecté
   - ✅ Vérification compliance avant trade

---

### ✅ Test 10 : Page Tokenize

1. **Aller sur** : http://localhost:3000/tokenize
2. **Vérifier** :
   - ✅ Liste des types d'actifs
   - ✅ Bouton "Create New Asset"

3. **Cliquer** sur "Create New Asset" ou aller sur :
   http://localhost:3000/tokenize/new

4. **Vérifier** :
   - ✅ Formulaire de création
   - ✅ Champs : Name, Symbol, Asset Type, Total Supply, Price
   - ✅ Bouton "Tokenize Asset"

---

### ✅ Test 11 : Page Oracle

1. **Aller sur** : http://localhost:3000/oracle
2. **Vérifier** :
   - ✅ Dashboard des prix
   - ✅ Liste des price feeds
   - ✅ Derniers prix affichés

---

### ✅ Test 12 : Page Admin

1. **Aller sur** : http://localhost:3000/admin
2. **Vérifier** :
   - ✅ Tabs (KYC Requests, Whitelist, Compliance)
   - ✅ Liste des pending requests
   - ✅ Boutons Approve/Reject

---

## 🔧 Étape 3 : Tests Techniques (Console)

### Test 1 : Console du Navigateur

1. **Ouvrir** la console (F12 → Console)
2. **Vérifier** :
   - ✅ Pas d'erreurs rouges
   - ⚠️ Warnings acceptables :
     - "Hydration mismatch" (RainbowKit - normal)
     - Warnings de dépendances peer (normal avec --legacy-peer-deps)

### Test 2 : Network Requests

1. **Ouvrir** l'onglet Network (F12 → Network)
2. **Après connexion wallet**, vérifier :
   - ✅ Requêtes RPC vers le node Ethereum
   - ✅ Calls aux fonctions du contrat KYC :
     - `isKYCVerified`
     - `isWhitelisted`
     - `isBlacklisted`
     - `getKYCLevel`

### Test 3 : React DevTools

1. **Installer** React DevTools (extension Chrome/Firefox)
2. **Ouvrir** DevTools → Components
3. **Chercher** `useKYCStatus`
4. **Vérifier les hooks** :
   - `kycStatus` object
   - `isLoading` = false
   - `canTrade` = true/false
   - `isKYCVerified`, `isWhitelisted`, `isBlacklisted` présents

---

## 🎯 Étape 4 : Tests Fonctionnels Avancés

### Test 1 : Polling Automatique

1. **Se connecter** avec wallet
2. **Noter** le statut KYC actuel (ex: non vérifié)
3. **DANS UN AUTRE ONGLET** :
   - Aller sur Etherscan ou votre interface admin
   - Approuver votre KYC on-chain
4. **Attendre 10 secondes** sur la page frontend
5. **Vérifier** :
   - ✅ Badge KYC se met à jour automatiquement (🟡 → 🟢)
   - ✅ Statut dans la sidebar change
   - ✅ Message "You are authorized to trade" apparaît

### Test 2 : Déconnexion

1. **Cliquer** sur le bouton wallet (adresse)
2. **Dans le modal**, cliquer "Disconnect"
3. **Vérifier** :
   - ✅ Bouton redevient "Connect Wallet"
   - ✅ Badge KYC disparaît
   - ✅ Page KYC affiche "Connect Your Wallet"

### Test 3 : Changement de Compte

1. **Dans MetaMask**, changer de compte
2. **Vérifier** :
   - ✅ Adresse change dans l'interface
   - ✅ Badge KYC se met à jour selon le nouveau compte
   - ✅ Statut KYC correspond au nouveau compte

---

## ⚠️ Problèmes Courants et Solutions

### ❌ "Project ID is required"

**Cause** : WalletConnect Project ID manquant

**Solution** :
```env
# .env.local
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc123...
```

Obtenir sur : https://cloud.walletconnect.com/

---

### ❌ Badge KYC ne change pas de couleur

**Cause** : Adresse du contrat KYC incorrecte ou ABI incorrect

**Vérifier** :
1. `.env.local` contient `NEXT_PUBLIC_KYC_MANAGER_ADDRESS`
2. L'adresse est correcte et le contrat est déployé
3. Dans la console : erreurs de lecture du contrat ?

**Debug** :
```javascript
// Dans la console du navigateur
console.log(process.env.NEXT_PUBLIC_KYC_MANAGER_ADDRESS)
// Doit afficher l'adresse, pas undefined
```

---

### ❌ "Wrong Network" tout le temps

**Cause** : Votre wallet est sur un réseau non supporté

**Solution** :
- Changer vers Sepolia dans MetaMask
- OU ajouter le réseau dans `config/wagmi.ts`

---

### ❌ Aucune requête blockchain visible

**Cause** : RPC endpoint offline ou limité

**Solution** :
Ajouter une clé Alchemy/Infura dans `.env.local` :
```env
NEXT_PUBLIC_ALCHEMY_API_KEY=...
NEXT_PUBLIC_INFURA_API_KEY=...
```

---

## ✅ Checklist Finale

Cocher chaque test réussi :

### Interface
- [ ] Page d'accueil charge sans erreur
- [ ] Header s'affiche correctement
- [ ] Navigation fonctionne (tous les liens)
- [ ] Design responsive (mobile/desktop)

### Wallet
- [ ] Bouton "Connect Wallet" visible
- [ ] Modal RainbowKit s'ouvre
- [ ] Connexion MetaMask réussie
- [ ] Adresse affichée après connexion
- [ ] Badge réseau visible
- [ ] Déconnexion fonctionne

### KYC Status
- [ ] Badge KYC visible dans le wallet button
- [ ] Badge change selon le statut (🟢/🟡/🔴)
- [ ] Page /kyc affiche le statut détaillé
- [ ] 3 vérifications affichées (KYC, Whitelist, Blacklist)
- [ ] Message de raison si bloqué
- [ ] Bouton "Complete KYC" si nécessaire
- [ ] Polling fonctionne (statut se met à jour)

### Contrat Integration
- [ ] Requêtes RPC visibles dans Network tab
- [ ] Fonctions du contrat appelées (isKYCVerified, etc.)
- [ ] Pas d'erreurs de lecture du contrat
- [ ] Données retournées correctement

### Pages
- [ ] /dashboard charge
- [ ] /assets charge
- [ ] /portfolio charge
- [ ] /trade charge
- [ ] /tokenize charge
- [ ] /tokenize/new charge
- [ ] /oracle charge
- [ ] /admin charge
- [ ] /kyc charge

---

## 🎉 Si Tous les Tests Passent

**Félicitations !** 🎊

Votre plateforme RWA est **100% fonctionnelle** :
- ✅ Connexion wallet avec multi-providers
- ✅ Détection réseau
- ✅ Lecture on-chain du statut KYC
- ✅ Affichage UX clair et professionnel
- ✅ Polling automatique
- ✅ Architecture complète

---

## 📊 Prochaines Étapes

1. **Configuration Production** :
   - Ajouter toutes les adresses de contrats
   - Mettre les ABIs complets
   - Obtenir les clés API (Alchemy, Infura)

2. **Tests Approfondis** :
   - Tester avec vrais contrats déployés
   - Tester chaque fonction de trading
   - Tester les transactions

3. **Optimisations** :
   - Ajouter plus de composants UI
   - Améliorer les animations
   - Ajouter des notifications toast

4. **Déploiement** :
   - Build production : `npm run build`
   - Déployer sur Vercel
   - Configurer les env variables

---

**🚀 Happy Testing !**
