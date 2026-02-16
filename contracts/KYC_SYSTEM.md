# 🛡️ KYC System Documentation

## Vue d'ensemble

Le système KYC (Know Your Customer) est implémenté **on-chain** pour assurer que seuls les utilisateurs vérifiés peuvent détenir et échanger des actifs tokenisés. Ce système combine une **whitelist** (liste blanche) et une **blacklist** (liste noire) pour un contrôle de conformité complet.

## 🏗️ Architecture

### Contrats principaux

1. **KYC.sol** - Contrat principal de gestion KYC
   - Gère la whitelist et la blacklist
   - Utilise AccessControl d'OpenZeppelin
   - Supporte les opérations batch pour l'efficacité du gas

2. **IKYC.sol** - Interface KYC
   - `isWhitelisted(address)` - Vérifie si l'adresse est whitelistée
   - `isBlacklisted(address)` - Vérifie si l'adresse est blacklistée
   - `isVerified(address)` - Vérifie si l'adresse peut trader (whitelisted && !blacklisted)

### Intégration dans les contrats

Le KYC est appliqué **on-chain** dans:

- **AssetERC20.sol** - Tokens ERC20 (actions tokenisées)
- **AssetNFT.sol** - NFTs (propriété unique)
- **AssetPool.sol** - Pools de liquidité (investissement/trading)

## 🔒 Règles de vérification

### Pour être "verified" (autorisé à trader):
```solidity
isVerified = isWhitelisted && !isBlacklisted
```

### Hiérarchie des statuts:
1. ✅ **Whitelisted + NOT Blacklisted** = Peut trader
2. 🚫 **Whitelisted + Blacklisted** = NE PEUT PAS trader (blacklist prioritaire)
3. ❌ **Not Whitelisted** = NE PEUT PAS trader
4. ❌ **Blacklisted** = NE PEUT PAS trader (même si whitelisted)

## 📝 Fonctions principales

### Administration KYC

```solidity
// Whitelist - individuel
function setWhitelisted(address user, bool status) external onlyRole(KYC_ADMIN_ROLE)

// Whitelist - batch (économise du gas)
function setBatchWhitelisted(address[] calldata users, bool status) external onlyRole(KYC_ADMIN_ROLE)

// Blacklist - individuel
function setBlacklisted(address user, bool status) external onlyRole(KYC_ADMIN_ROLE)

// Blacklist - batch
function setBatchBlacklisted(address[] calldata users, bool status) external onlyRole(KYC_ADMIN_ROLE)
```

### Vérification

```solidity
// Vérifier le statut
function isWhitelisted(address user) external view returns (bool)
function isBlacklisted(address user) external view returns (bool)
function isVerified(address user) external view returns (bool) // whitelist && !blacklist
```

## 🚀 Utilisation

### 1. Déploiement

Le contrat KYC est déployé automatiquement avec le système:

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

Cela déploie:
- ✅ Contrat KYC
- ✅ Whitelist le deployer automatiquement
- ✅ Configure tous les autres contrats avec l'adresse KYC

### 2. Gérer le KYC

Utilisez le script de gestion pour ajouter/retirer des utilisateurs:

```bash
npx hardhat run scripts/manageKYC.ts --network localhost
```

**Modifier le script** avant l'exécution:
```typescript
// Dans manageKYC.ts
const addressesToWhitelist = [
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Votre utilisateur 1
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Votre utilisateur 2
];

const addressesToBlacklist = [
  "0x...", // Adresse à blacklister
];
```

### 3. Tester le système

Exécutez les tests complets du KYC:

```bash
npx hardhat run scripts/testKYC.ts --network localhost
```

Tests inclus:
- ✅ Blocage des transferts sans KYC
- ✅ Autorisation après whitelist
- ✅ Blacklist override la whitelist
- ✅ Batch operations
- ✅ Désactivation du KYC

### 4. Vérifier le statut d'une adresse

```typescript
import { ethers } from "hardhat";

const kycAddress = "0x..."; // Votre adresse KYC
const userAddress = "0x..."; // L'adresse à vérifier

const KYC = await ethers.getContractFactory("KYC");
const kyc = await KYC.attach(kycAddress);

const isWhitelisted = await kyc.isWhitelisted(userAddress);
const isBlacklisted = await kyc.isBlacklisted(userAddress);
const isVerified = await kyc.isVerified(userAddress);

console.log("Whitelisted:", isWhitelisted);
console.log("Blacklisted:", isBlacklisted);
console.log("Can trade:", isVerified);
```

## 🎯 Cas d'usage

### Scénario 1: Onboarding d'un nouvel investisseur

1. L'investisseur complète le KYC off-chain
2. L'admin vérifie les documents
3. L'admin whitelist l'adresse:
   ```bash
   npx hardhat run scripts/manageKYC.ts
   ```
4. L'investisseur peut maintenant acheter des tokens

### Scénario 2: Révocation d'accès (compliance)

1. Un utilisateur devient non-conforme
2. L'admin le blacklist:
   ```typescript
   await kyc.setBlacklisted(userAddress, true);
   ```
3. L'utilisateur ne peut plus trader (même s'il garde ses tokens)
4. Tokens existants sont "gelés" jusqu'à résolution

### Scénario 3: Opérations en masse

Pour whitelister 100 investisseurs:

```typescript
const addresses = [/* 100 adresses */];

// Méthode efficace (1 seule transaction)
await kyc.setBatchWhitelisted(addresses, true);

// vs méthode inefficace (100 transactions)
// for (const addr of addresses) {
//   await kyc.setWhitelisted(addr, true);
// }
```

## 🔐 Sécurité

### Rôles et permissions

- **DEFAULT_ADMIN_ROLE**: Peut gérer tous les rôles
- **KYC_ADMIN_ROLE**: Peut modifier whitelist/blacklist

### Bonnes pratiques

1. **Multi-sig pour l'admin** - Utilisez un wallet multi-signature pour les opérations KYC
2. **Audit trail** - Tous les événements sont émis on-chain:
   ```solidity
   event WhitelistUpdated(address indexed user, bool status);
   event BlacklistUpdated(address indexed user, bool status);
   ```
3. **Séparation des rôles** - Donnez KYC_ADMIN_ROLE à une équipe compliance dédiée
4. **Emergency pause** - Les admins peuvent désactiver temporairement le KYC:
   ```solidity
   await assetToken.setKycRequired(false); // Urgence seulement!
   ```

## 📊 Vérification on-chain

### Dans AssetERC20 et AssetNFT:

```solidity
function _update(address from, address to, uint256 value) internal override {
    if (kycRequired && from != address(0) && to != address(0)) {
        require(kyc.isWhitelisted(from), "KYC_FROM");
        require(kyc.isWhitelisted(to), "KYC_TO");
        require(!kyc.isBlacklisted(from), "BL_FROM");
        require(!kyc.isBlacklisted(to), "BL_TO");
    }
    super._update(from, to, value);
}
```

### Dans AssetPool:

```solidity
modifier onlyVerified() {
    if (kycRequired) {
        require(kyc.isVerified(msg.sender), "KYC_REQUIRED");
    }
    _;
}

function addLiquidity(...) external onlyVerified { ... }
function removeLiquidity(...) external onlyVerified { ... }
function swapAssetForBase(...) external onlyVerified { ... }
function swapBaseForAsset(...) external onlyVerified { ... }
```

## ⚠️ Messages d'erreur

| Erreur | Signification |
|--------|---------------|
| `KYC_FROM` | L'expéditeur n'est pas whitelisté |
| `KYC_TO` | Le destinataire n'est pas whitelisté |
| `BL_FROM` | L'expéditeur est blacklisté |
| `BL_TO` | Le destinataire est blacklisté |
| `KYC_REQUIRED` | L'utilisateur doit être vérifié (pool) |
| `ADMIN_ZERO` | Adresse admin ne peut pas être 0x0 |
| `KYC_ZERO` | Adresse KYC ne peut pas être 0x0 |

## 🎨 Frontend Integration

Pour afficher le statut KYC dans votre frontend:

```typescript
import { useReadContract } from 'wagmi';
import { kycABI } from '@/abi/KYC';

export function useKYCStatus(address: `0x${string}`) {
  const { data: isWhitelisted } = useReadContract({
    address: kycAddress,
    abi: kycABI,
    functionName: 'isWhitelisted',
    args: [address],
  });

  const { data: isBlacklisted } = useReadContract({
    address: kycAddress,
    abi: kycABI,
    functionName: 'isBlacklisted',
    args: [address],
  });

  const { data: isVerified } = useReadContract({
    address: kycAddress,
    abi: kycABI,
    functionName: 'isVerified',
    args: [address],
  });

  return {
    isWhitelisted: isWhitelisted ?? false,
    isBlacklisted: isBlacklisted ?? false,
    isVerified: isVerified ?? false,
  };
}
```

## 📋 Checklist de conformité

- [x] ✅ Whitelist implémentée on-chain
- [x] ✅ Blacklist implémentée on-chain
- [x] ✅ Vérifications dans tous les contrats (ERC20, NFT, Pool)
- [x] ✅ Événements émis pour audit trail
- [x] ✅ Batch operations pour efficacité
- [x] ✅ Interface isVerified() pour logique simple
- [x] ✅ Possibilité de désactiver (cas particuliers)
- [x] ✅ AccessControl pour gestion des permissions
- [x] ✅ Scripts de gestion et de test

## 🚨 Note importante

**Le KYC est appliqué ON-CHAIN**, ce qui signifie:
- ✅ Pas de bypass possible via le frontend
- ✅ Vérification automatique à chaque transaction
- ✅ Sécurité maximale pour la conformité
- ✅ Transparence totale (audit trail on-chain)

**La blacklist override toujours la whitelist**: Un utilisateur blacklisté ne peut PAS trader, même s'il est whitelisté.

## 📞 Support

Pour toute question sur le système KYC:
1. Consultez les tests: `scripts/testKYC.ts`
2. Vérifiez le contrat: `contracts/KYC.sol`
3. Utilisez le script de gestion: `scripts/manageKYC.ts`

---

Fait avec ❤️ pour la conformité et la sécurité on-chain.
