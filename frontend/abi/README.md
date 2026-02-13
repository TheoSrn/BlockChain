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

- `KYCManager.ts` : ABI exemple pour le contrat de gestion KYC
- `AssetRegistry.ts` : ABI exemple pour le registre d'actifs

**⚠️ Remplacez ces fichiers par vos ABIs réels !**
