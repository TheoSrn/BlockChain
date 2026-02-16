# Instructions d'utilisation des ABIs

## Génération des ABIs depuis vos smart contracts

### Avec Hardhat

```bash
# Compilez vos contrats
npx hardhat compile

# Les ABIs seront dans ./artifacts/contracts/
```

Copiez les fichiers JSON des ABIs dans ce dossier.

### Avec Foundry

```bash
# Compilez vos contrats
forge build

# Les ABIs seront dans ./out/
```

## Utilisation dans le frontend

### 1. Exportez vos ABIs en TypeScript

```typescript
// abi/YourContract.ts
export const YOUR_CONTRACT_ABI = [
  // ... votre ABI
] as const; // Important : utilisez "as const"

export default YOUR_CONTRACT_ABI;
```

### 2. Utilisez-les avec wagmi

```typescript
import { useReadContract } from 'wagmi';
import YOUR_CONTRACT_ABI from '@/abi/YourContract';

const { data } = useReadContract({
  address: '0x...',
  abi: YOUR_CONTRACT_ABI,
  functionName: 'yourFunction',
  args: [arg1, arg2],
});
```

## Fichiers actuels

- `Factory.ts` : ABI for the Asset Factory contract (creates and manages tokenized assets)
- `KYCManager.ts` : ABI for KYC/Compliance management
- `AssetRegistry.ts` : ABI for the asset registry
- `Oracle.ts` : **ABI for the on-chain Oracle** - Provides price feeds for real-world assets and NFT collections

### Oracle ABI

The Oracle ABI is particularly important as it enables:
- Real-time price queries for tokenized assets (`getPrice`)
- Asset information retrieval (`getAsset`)
- Price updates by authorized admins (`setPrice`)
- Event monitoring (`PriceUpdated`, `AssetRegistered`)

**Example usage:**
```typescript
import { useReadContract } from 'wagmi';
import ORACLE_ABI from '@/abi/Oracle';

const { data } = useReadContract({
  address: oracleAddress,
  abi: ORACLE_ABI,
  functionName: 'getPrice',
  args: [assetId],
});
// Returns: [price (uint256), timestamp (uint256)]
```

**⚠️ Note:** Make sure Oracle contract is deployed to use these price feeds!
