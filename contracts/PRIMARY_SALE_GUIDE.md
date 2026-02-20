# Primary Sale System - Direct Asset Purchase

## 📖 Overview

Le système **PrimarySale** permet aux propriétaires d'assets de vendre leurs tokens **directement aux acheteurs**, sans avoir besoin de créer des pools de liquidité Uniswap.

### 💡 Pourquoi ce système ?

**Avant (avec pools Uniswap)** ❌
- Nécessite de créer un pool de liquidité
- Nécessite de fournir des tokens ET de la crypto pour la liquidité
- Les acheteurs achètent depuis le pool, pas directement du créateur
- Complexe et coûteux en gas

**Maintenant (avec PrimarySale)** ✅
- Vente directe propriétaire → acheteur
- Prix fixe basé sur l'estimation
- Pas besoin de liquidité
- Simple et efficace

---

## 🚀 Guide d'utilisation

### Étape 1 : Déployer le contrat PrimarySale

```bash
cd contracts
npx hardhat run scripts/deployPrimarySale.ts --network sepolia
```

Notez l'adresse du contrat déployé et ajoutez-la dans `frontend/.env.local` :

```env
NEXT_PUBLIC_PRIMARY_SALE_ADDRESS=0x...
```

### Étape 2 : Lister votre asset (Propriétaire)

En tant que propriétaire, créez un fichier `.env` dans le dossier `contracts/` :

```env
PRIMARY_SALE_ADDRESS=0x...
ASSET_TOKEN_ADDRESS=0x...  # L'adresse ERC20 de votre asset
PAYMENT_TOKEN_ADDRESS=0x... # USDC, USDT ou WETH
```

Modifiez les valeurs dans `scripts/listAssetForSale.ts` :

```typescript
const PRICE_PER_TOKEN = '20';    // Prix par token (ex: 20 USDC)
const AMOUNT_TO_SELL = '500';    // Nombre de tokens à vendre
```

Exécutez le script :

```bash
npx hardhat run scripts/listAssetForSale.ts --network sepolia
```

Le script va :
1. ✅ Approuver PrimarySale à transférer vos tokens
2. ✅ Créer le listing avec le prix et la quantité
3. ✅ Afficher les détails du listing

### Étape 3 : Acheter l'asset (Acheteur)

Les acheteurs peuvent maintenant :

1. Aller sur **Buy Assets** dans l'application
2. Sélectionner l'asset
3. Choisir la quantité
4. Cliquer sur **Buy Asset**
5. Approuver le paiement (USDC/USDT/WETH)
6. Confirmer l'achat

**Le paiement va directement au propriétaire !** 💰

---

## 🔧 Gestion des listings (Propriétaire)

### Mettre à jour un listing

```typescript
// Via le contrat directement
await primarySale.updateListing(
  assetTokenAddress,
  newPricePerToken,  // Nouveau prix
  newAmount          // Nouvelle quantité disponible
);
```

### Annuler un listing

```typescript
await primarySale.cancelListing(assetTokenAddress);
```

---

## 🏗️ Architecture

### Smart Contract (`PrimarySale.sol`)

```
┌─────────────────────────────────────────┐
│         PrimarySale Contract            │
├─────────────────────────────────────────┤
│ Listings:                               │
│  • Asset Token Address → Listing        │
│    - Seller (owner)                     │
│    - Payment Token (USDC/USDT/WETH)     │
│    - Price per Token                    │
│    - Available Amount                   │
│    - Active (bool)                      │
├─────────────────────────────────────────┤
│ Functions:                              │
│  • createListing()                      │
│  • updateListing()                      │
│  • cancelListing()                      │
│  • buy()                                │
│  • getListing()                         │
└─────────────────────────────────────────┘
```

### Flow d'achat

```
Acheteur                PrimarySale              Propriétaire
   │                         │                         │
   │─── approve(USDC) ──────>│                         │
   │                         │                         │
   │─── buy(amount) ────────>│                         │
   │                         │                         │
   │                         │──── transferFrom ──────>│
   │                         │     (USDC payment)      │
   │                         │                         │
   │<─── transferFrom ───────│                         │
   │     (Asset tokens)      │                         │
   │                         │                         │
```

---

## 📋 Exemples de commandes

### Déploiement

```bash
# Déployer PrimarySale
npx hardhat run scripts/deployPrimarySale.ts --network sepolia

# Lister un asset
npx hardhat run scripts/listAssetForSale.ts --network sepolia
```

### Vérification

```bash
# Vérifier un listing
npx hardhat console --network sepolia

> const primarySale = await ethers.getContractAt('PrimarySale', '0x...')
> const listing = await primarySale.getListing('0xAssetTokenAddress')
> console.log(listing)
```

---

## ⚠️ Important

1. **Approvals nécessaires** :
   - Le propriétaire doit approuver PrimarySale pour ses tokens d'asset
   - L'acheteur doit approuver PrimarySale pour son token de paiement

2. **KYC** :
   - KYC requis par défaut pour vendre et acheter
   - Peut être désactivé par l'admin si besoin

3. **Quantités** :
   - Tout est en 18 decimals (format wei)
   - Le script `listAssetForSale.ts` gère automatiquement la conversion

4. **Prix** :
   - Le prix est fixe (pas de slippage comme avec Uniswap)
   - À définir en fonction de l'`estimatedValue` de l'asset

---

## 🆚 PrimarySale vs Pool Uniswap

| Critère | PrimarySale | Pool Uniswap |
|---------|-------------|--------------|
| **Liquidité requise** | ❌ Non | ✅ Oui |
| **Prix** | Fixe | Variable (AMM) |
| **Slippage** | Aucun | Oui |
| **Complexité** | Simple | Complexe |
| **Gas** | Faible | Élevé |
| **Destinataire paiement** | Propriétaire | Pool → LP |
| **Use case** | Vente initiale | Marché secondaire |

---

## 🎯 Cas d'usage

### Vente initiale (Primary Market)
✅ Utilisez **PrimarySale**
- Le créateur vend ses tokens pour la première fois
- Prix fixe basé sur l'évaluation
- Paiement direct au créateur

### Marché secondaire (Secondary Market)
✅ Utilisez **Pool Uniswap**
- Les investisseurs revendent entre eux
- Prix déterminé par l'offre et la demande
- Liquidité fournie par les LP (Liquidity Providers)

---

## 🔐 Sécurité

Le contrat PrimarySale inclut :
- ✅ Vérification KYC (via contrat KYC)
- ✅ Vérifications de balance et allowance
- ✅ Protection contre les re-entrancy (via checks-effects-interactions pattern)
- ✅ Access control (roles admin)
- ✅ Events pour tracking

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que PrimarySale est bien déployé
2. Vérifiez que l'asset est listé (`getListing()`)
3. Vérifiez les approvals (owner et buyer)
4. Vérifiez le KYC status
5. Consultez les logs dans la console du navigateur

---

## 🎉 C'est tout !

Votre système de vente directe est maintenant opérationnel. Les propriétaires peuvent vendre leurs tokens facilement, et les acheteurs peuvent acheter directement sans se soucier de la liquidité ! 🚀
