# Comment Utiliser l'Application

## 🚀 Accès Rapide

L'application tourne sur : **http://localhost:3000**

## 📋 Pages Principales

### 1. Page KYC (Vérification d'Identité)
**Route :** `/kyc`

- **Vérifier votre statut** : Voir si vous êtes whitelisté ou blacklisté
- **Vous serez whitelisté** : Si c'est la première fois ou si l'admin vous a ajouté
- Nécessaire avant de pouvoir créer des assets ou trader

### 2. Page Tokenize (Créer des Assets)
**Route :** `/tokenize`

**Onglet Factory :**
- Créer un nouvel asset tokenisé
- Choisir le type :
  - **DIVISIBLE** : Asset fractionnable (ex: immeuble)
  - **UNIQUE** : Asset unique (ex: villa, diamant)
- Remplir les informations :
  - Nom de l'asset
  - Symbole (ex: PARIS, VILLA)
  - Localisation
  - Surface (m²)
  - Valeur estimée
  - Description
- Choisir la devise de paiement (USDC, USDT, WETH)

**Onglet ERC20 :**
- Mint des tokens pour un asset divisible
- Transférer des tokens à quelqu'un
- Voir le total supply

**Onglet NFT :**
- Voir les détails du NFT unique
- Transférer le NFT
- Checker le propriétaire actuel

### 3. Page Assets (Liste des Assets)
**Route :** `/assets`

- **Voir tous les assets créés** avec leurs infos :
  - Image
  - Nom, symbole
  - Type (Divisible ou Unique)
  - Prix actuel (Oracle ou métadonnées)
  - Votre propriété (pour assets divisibles)
  - Statut de possession (pour NFTs)

- **Boutons disponibles :**
  - **View Details** : Ouvre un modal avec infos complètes
  - **Trade** : Redirige vers la page de trading

### 4. Page Trade (Trading)
**Route :** `/trade`

**Section Swap :**
- Échanger un token contre un autre
- Choisir token d'entrée et de sortie
- Entrer le montant
- Voir le prix estimé
- KYC vérifié automatiquement avant le swap

**Section Liquidité :**
- Ajouter de la liquidité à un pool
- Retirer de la liquidité
- Voir vos positions LP
- Gagner des fees (0.3% sur les trades)

### 5. Page Oracle (Prix des Assets)
**Route :** `/oracle`

- **Voir les prix en temps réel** de tous les assets
- Prix mis à jour par l'admin
- Support multi-devises (USD, EUR, USDC, etc.)

### 6. Page Dashboard (Vue d'Ensemble)
**Route :** `/dashboard` ou `/`

- **Portfolio** : Valeur totale de vos assets
- **Balances** : Tous vos tokens avec montants
- **Transactions récentes** : Historique de vos actions

## 🔄 Workflow Typique

### Pour Créer et Vendre un Asset :

1. **Connecter votre wallet** (bouton en haut à droite)
2. **Aller sur `/kyc`** → Vérifier que vous êtes whitelisté
3. **Aller sur `/tokenize`** → Onglet Factory
4. **Créer votre asset** :
   - Type : DIVISIBLE ou UNIQUE
   - Remplir tous les champs
   - Confirmer la transaction
5. **Mint des tokens** (si divisible) :
   - Onglet ERC20
   - Mint la quantité voulue
6. **Aller sur `/trade`** :
   - Les acheteurs peuvent maintenant trader votre token
   - Vous pouvez vendre vos tokens contre USDC/USDT

### Pour Acheter un Asset :

1. **Connecter votre wallet**
2. **Vérifier KYC** sur `/kyc`
3. **Aller sur `/assets`** → Voir les assets disponibles
4. **Cliquer sur "Trade"**
5. **Sur `/trade`** :
   - Choisir le token de l'asset
   - Échanger vos USDC/USDT contre le token
6. **Voir votre balance** sur `/dashboard`

## 💡 Conseils d'Utilisation

### Tokens de Test
- USDC : Pour acheter la plupart des assets
- USDT : Alternative au USDC
- WETH : Pour assets valorisés en ETH

### Avant de Trader
✓ Vérifier que vous êtes whitelisté (KYC)
✓ Avoir des tokens dans votre wallet (USDC, USDT, ou WETH)
✓ Approve le TradingPool pour utiliser vos tokens

### Slippage
- **Slippage** : Différence entre prix attendu et prix réel
- Réglez le slippage selon la liquidité du pool
- 0.5% à 1% recommandé pour pools stables

### Gas Fees
- Sur Sepolia testnet, les gas fees sont très faibles
- Obtenez du ETH gratuit sur un faucet Sepolia

## ⚠️ Restrictions

### KYC Obligatoire
- Impossible de créer un asset sans être whitelisté
- Impossible de trader sans être whitelisté
- Les transferts entre non-whitelistés sont bloqués

### Blacklist
- Si vous êtes blacklisté, tous vos transferts sont bloqués
- Contactez l'admin pour résoudre le problème

## 🆘 Problèmes Courants

### "Not whitelisted"
→ Allez sur `/kyc` et attendez l'approbation de l'admin

### "Insufficient balance"
→ Vous n'avez pas assez de tokens. Mintez-en ou échangez sur `/trade`

### "Transaction failed"
→ Vérifiez :
- Votre KYC est validé
- Vous avez approve le contrat
- Vous avez assez de ETH pour le gas

### Le prix ne s'affiche pas
→ L'admin n'a pas encore configuré le prix dans l'Oracle

## 📱 Navigation Rapide

- **Home** : Dashboard avec vue d'ensemble
- **Assets** : Catalogue des assets tokenisés
- **Trade** : Trading et liquidité
- **Tokenize** : Créer et gérer vos assets
- **Oracle** : Prix en temps réel
- **KYC** : Vérification d'identité
