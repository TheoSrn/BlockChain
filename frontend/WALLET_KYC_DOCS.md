# 🔐 Connexion Wallet & KYC - Documentation Complète

Documentation complète de l'implémentation **wagmi + RainbowKit + Statut KYC**.

---

## 📋 Table des Matières

- [Vue d'Ensemble](#-vue-densemble)
- [Architecture](#-architecture)
- [Composants](#-composants)
- [Hooks](#-hooks)
- [Exemples d'Utilisation](#-exemples-dutilisation)
- [Configuration](#-configuration)

---

## 🎯 Vue d'Ensemble

### **Fonctionnalités Implémentées**

✅ **Connexion Wallet**
- Support multi-wallets (MetaMask, WalletConnect, Coinbase, Rainbow, etc.)
- Détection automatique du réseau
- Interface personnalisée avec badge KYC

✅ **Lecture On-Chain du Statut KYC**
- Vérification KYC (isKYCVerified)
- Statut whitelist (isWhitelisted)
- Statut blacklist (isBlacklisted)
- Niveau KYC (kycLevel)
- Calcul automatique de canTrade

✅ **Composants UI**
- WalletButton avec badge KYC intégré
- KYCStatusDisplay avec affichage détaillé
- ComplianceStatus (version simple)

✅ **100% On-Chain**
- Aucune logique off-chain
- Polling automatique (10s)
- Cache React Query

---

## 🏗 Architecture

### **Flow de Données**

```
┌─────────────────┐
│ Smart Contract  │ KYCManager
│  (Blockchain)   │ - isKYCVerified()
└────────┬────────┘ - isWhitelisted()
         │          - isBlacklisted()
         │          - getKYCLevel()
         ↓
┌─────────────────┐
│   useKYCStatus  │ Hook React
│   (wagmi hook)  │ - useReadContract
└────────┬────────┘ - refetchInterval: 10s
         │
         ↓
┌─────────────────┐
│   Components    │ UI
│ - WalletButton  │ - Affiche badge
│ - KYCDisplay    │ - Affiche détails
└─────────────────┘
```

### **Fichiers Principaux**

```
frontend/
├── config/
│   └── wagmi.ts                    ✅ Configuration wagmi + RainbowKit
│
├── hooks/web3/
│   ├── useKYCStatus.ts             ✅ Hook principal statut KYC
│   └── useCompliance.ts            ✅ Alias (ancien nom)
│
├── components/
│   ├── web3/
│   │   ├── WalletButton.tsx        ✅ Bouton connexion + badge KYC
│   │   ├── KYCStatusDisplay.tsx    ✅ Affichage détaillé statut
│   │   └── index.ts                ✅ Exports
│   │
│   ├── layout/
│   │   └── Header.tsx              ✅ Header avec WalletButton
│   │
│   └── features/
│       └── ComplianceStatus.tsx    ✅ Affichage simple statut
│
└── app/
    ├── providers.tsx               ✅ Providers Web3
    └── kyc/page.tsx                ✅ Page KYC intégrée
```

---

## 🧩 Composants

### 1. **WalletButton** 

Bouton de connexion personnalisé avec badge KYC.

**Localisation** : `components/web3/WalletButton.tsx`

**Features** :
- ✅ Connexion multi-wallets
- ✅ Affichage réseau (chain switcher)
- ✅ Badge KYC visuel (✅ vert, ⚠️ jaune, 🚫 rouge)
- ✅ Affichage balance
- ✅ Indicateur "Wrong Network"

**Utilisation** :

```tsx
import { WalletButton } from '@/components/web3/WalletButton';

export function MyComponent() {
  return <WalletButton />;
}
```

**Props** : Aucune (utilise ConnectButton.Custom de RainbowKit)

**États visuels** :
- 🔴 **Non connecté** → "Connect Wallet" (bouton gradient violet/rose)
- ⚠️ **Mauvais réseau** → "Wrong Network" (bouton rouge)
- 🔵 **Connecté** → Badge réseau + account avec badge KYC

**Badge KYC** :
- ✅ **Vert** : KYC vérifié + Whitelisté
- ⚠️ **Jaune** : Non vérifié ou non whitelisté
- 🚫 **Rouge** : Blacklisté

---

### 2. **KYCStatusDisplay**

Affichage détaillé du statut de conformité.

**Localisation** : `components/web3/KYCStatusDisplay.tsx`

**Features** :
- ✅ Affichage complet des 3 vérifications (KYC, whitelist, blacklist)
- ✅ Niveau KYC (si > 0)
- ✅ Message clair selon le statut
- ✅ Bouton CTA "Complete KYC" si nécessaire
- ✅ Design moderne avec dégradés

**Utilisation** :

```tsx
import { KYCStatusDisplay } from '@/components/web3/KYCStatusDisplay';

export function MyPage() {
  return (
    <div>
      <h1>Compliance</h1>
      <KYCStatusDisplay />
    </div>
  );
}
```

**Props** : Aucune (récupère automatiquement l'adresse connectée)

**États** :
- Wallet non connecté → Message "Connect your wallet"
- Chargement → Spinner
- Pas de statut → Message d'erreur
- Statut OK → Affichage détaillé avec badge

---

### 3. **ComplianceStatus** (Simple)

Version simplifiée du statut de conformité.

**Localisation** : `components/features/ComplianceStatus.tsx`

**Features** :
- ✅ Affichage simple (Verified / Not Verified)
- ✅ Message raison si bloqué

**Utilisation** :

```tsx
import { ComplianceStatus } from '@/components/features/ComplianceStatus';

export function Sidebar() {
  return <ComplianceStatus />;
}
```

---

## 🪝 Hooks

### 1. **useKYCStatus()**

Hook principal pour récupérer le statut KYC d'une adresse.

**Localisation** : `hooks/web3/useKYCStatus.ts`

**Signature** :

```typescript
function useKYCStatus(userAddress?: `0x${string}`): {
  kycStatus: KYCStatus | null;
  isLoading: boolean;
  canTrade: boolean;
  isKYCVerified: boolean;
  isWhitelisted: boolean;
  isBlacklisted: boolean;
  kycLevel: number;
  reason?: string;
}
```

**Type KYCStatus** :

```typescript
interface KYCStatus {
  address: `0x${string}`;
  isKYCVerified: boolean;
  isWhitelisted: boolean;
  isBlacklisted: boolean;
  kycLevel: number;
  canTrade: boolean;
  reason?: string;
}
```

**Exemples d'Utilisation** :

#### Exemple 1 : Vérifier si l'utilisateur peut trader

```tsx
import { useKYCStatus } from '@/hooks/web3/useKYCStatus';

function TradeButton() {
  const { canTrade, isLoading, reason } = useKYCStatus();

  if (isLoading) return <Spinner />;

  if (!canTrade) {
    return (
      <div>
        <p>Cannot trade: {reason}</p>
        <Link href="/kyc">Complete KYC</Link>
      </div>
    );
  }

  return <button>Trade Now</button>;
}
```

#### Exemple 2 : Affichage conditionnel selon le statut

```tsx
import { useKYCStatus } from '@/hooks/web3/useKYCStatus';

function MyComponent() {
  const { kycStatus, isLoading } = useKYCStatus();

  if (isLoading) return <Loading />;

  return (
    <div>
      {kycStatus?.isKYCVerified && <VerifiedBadge />}
      {kycStatus?.isWhitelisted && <WhitelistBadge />}
      {kycStatus?.isBlacklisted && <Alert>Blacklisted</Alert>}
      
      <p>KYC Level: {kycStatus?.kycLevel}</p>
    </div>
  );
}
```

#### Exemple 3 : Vérifier une adresse spécifique (pas l'adresse connectée)

```tsx
import { useKYCStatus } from '@/hooks/web3/useKYCStatus';

function UserProfile({ address }: { address: `0x${string}` }) {
  const { kycStatus } = useKYCStatus(address);

  return (
    <div>
      <h2>User: {address}</h2>
      <p>KYC: {kycStatus?.isKYCVerified ? '✅' : '❌'}</p>
    </div>
  );
}
```

#### Exemple 4 : Protection de route

```tsx
import { useKYCStatus } from '@/hooks/web3/useKYCStatus';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

function ProtectedPage() {
  const { canTrade, isLoading } = useKYCStatus();

  useEffect(() => {
    if (!isLoading && !canTrade) {
      redirect('/kyc');
    }
  }, [canTrade, isLoading]);

  if (isLoading) return <Loading />;

  return <div>Protected content</div>;
}
```

---

### 2. **useCanTrade()**

Hook simplifié pour vérifier uniquement si l'utilisateur peut trader.

```typescript
function useCanTrade(address?: `0x${string}`): {
  canTrade: boolean;
  isLoading: boolean;
}
```

**Exemple** :

```tsx
import { useCanTrade } from '@/hooks/web3/useKYCStatus';

function TradeWidget() {
  const { canTrade, isLoading } = useCanTrade();

  if (!canTrade) {
    return <Alert>You must complete KYC to trade</Alert>;
  }

  return <SwapInterface />;
}
```

---

### 3. **useIsKYCVerified()**

Hook pour vérifier uniquement le statut de vérification KYC.

```typescript
function useIsKYCVerified(address?: `0x${string}`): {
  isKYCVerified: boolean;
  isLoading: boolean;
}
```

**Exemple** :

```tsx
import { useIsKYCVerified } from '@/hooks/web3/useKYCStatus';

function KYCBadge() {
  const { isKYCVerified } = useIsKYCVerified();

  return (
    <span className={isKYCVerified ? 'badge-green' : 'badge-gray'}>
      {isKYCVerified ? '✅ Verified' : '⚠️ Pending'}
    </span>
  );
}
```

---

## ⚙️ Configuration

### 1. **Adresse du Contrat KYC**

Dans `config/contracts.ts` :

```typescript
export const CONTRACT_ADDRESSES = {
  KYC_MANAGER: process.env.NEXT_PUBLIC_KYC_MANAGER_ADDRESS || '0x...',
  // ... autres contrats
};
```

Dans `.env.local` :

```env
NEXT_PUBLIC_KYC_MANAGER_ADDRESS=0xYourKYCManagerAddress
```

---

### 2. **ABI du Contrat KYC**

Dans `abi/KYCManager.ts`, ajoutez votre ABI complet :

```typescript
export const KYCManagerABI = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'isKYCVerified',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'isWhitelisted',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'isBlacklisted',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getKYCLevel',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  // ... reste de votre ABI
] as const;
```

Puis importez-le dans `useKYCStatus.ts` :

```typescript
import { KYCManagerABI } from '@/abi/KYCManager';

// Remplacez l'ABI minimal par :
const { data: isKYCVerified } = useReadContract({
  abi: KYCManagerABI,
  // ...
});
```

---

### 3. **Interval de Polling**

Par défaut : **10 secondes**

Pour modifier, éditez `hooks/web3/useKYCStatus.ts` :

```typescript
query: {
  enabled: !!address,
  refetchInterval: 30_000, // 30 secondes au lieu de 10
}
```

---

### 4. **Réseau par Défaut**

Dans `config/wagmi.ts` :

```typescript
import { sepolia, mainnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  chains: [sepolia], // Changez selon vos besoins
  // ...
});
```

---

## 📝 Exemples d'Utilisation Complets

### Exemple 1 : Page avec Protection KYC

```tsx
'use client';

import { useKYCStatus } from '@/hooks/web3/useKYCStatus';
import { KYCStatusDisplay } from '@/components/web3/KYCStatusDisplay';
import Link from 'next/link';

export default function ProtectedPage() {
  const { canTrade, isLoading } = useKYCStatus();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!canTrade) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <KYCStatusDisplay />
          <div className="mt-6 text-center">
            <Link
              href="/kyc"
              className="btn-primary"
            >
              Complete KYC Verification
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Protected Content</h1>
      <p>You have access because you are KYC verified and whitelisted.</p>
    </div>
  );
}
```

---

### Exemple 2 : Composant Swap avec Vérification

```tsx
'use client';

import { useKYCStatus } from '@/hooks/web3/useKYCStatus';
import { useState } from 'react';

export function SwapWidget() {
  const { canTrade, reason, isLoading } = useKYCStatus();
  const [amount, setAmount] = useState('');

  const handleSwap = () => {
    if (!canTrade) {
      alert('Cannot trade: ' + reason);
      return;
    }
    // Logique de swap
  };

  return (
    <div className="swap-widget">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
      />

      <button
        onClick={handleSwap}
        disabled={!canTrade || isLoading}
        className={canTrade ? 'btn-primary' : 'btn-disabled'}
      >
        {!canTrade ? `Blocked: ${reason}` : 'Swap'}
      </button>

      {!canTrade && (
        <p className="text-red-400 text-sm mt-2">
          ⚠️ {reason}
        </p>
      )}
    </div>
  );
}
```

---

### Exemple 3 : Dashboard avec Multiple Statuts

```tsx
'use client';

import { useKYCStatus } from '@/hooks/web3/useKYCStatus';

export function Dashboard() {
  const { kycStatus } = useKYCStatus();

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Carte KYC */}
      <div className="card">
        <h3>KYC Verification</h3>
        <StatusBadge active={kycStatus?.isKYCVerified} />
        {kycStatus?.kycLevel && (
          <p>Level {kycStatus.kycLevel}</p>
        )}
      </div>

      {/* Carte Whitelist */}
      <div className="card">
        <h3>Whitelist Status</h3>
        <StatusBadge active={kycStatus?.isWhitelisted} />
      </div>

      {/* Carte Trading */}
      <div className="card">
        <h3>Trading Access</h3>
        <StatusBadge active={kycStatus?.canTrade} />
        {!kycStatus?.canTrade && (
          <p className="text-sm text-red-400">{kycStatus?.reason}</p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active?: boolean }) {
  return (
    <span className={active ? 'badge-green' : 'badge-gray'}>
      {active ? '✅ Active' : '❌ Inactive'}
    </span>
  );
}
```

---

## 🎨 Customisation

### Changer les Couleurs du Badge KYC

Dans `components/web3/WalletButton.tsx`, modifiez `KYCBadge` :

```tsx
// Badge vert (vérifié)
<div className="bg-green-500/20 text-green-400">

// Badge jaune (pending)
<div className="bg-yellow-500/20 text-yellow-400">

// Badge rouge (blacklisté)
<div className="bg-red-500/20 text-red-400">
```

---

### Changer le Polling Interval

Dans `hooks/web3/useKYCStatus.ts` :

```typescript
query: {
  refetchInterval: 10_000, // Changez ici (en millisecondes)
}
```

---

## ✅ Checklist d'Intégration

- [ ] WalletConnect Project ID configuré
- [ ] Adresse KYCManager dans .env.local
- [ ] ABI KYCManager complet ajouté
- [ ] Header utilise WalletButton
- [ ] Page KYC intégrée
- [ ] Tests de connexion wallet OK
- [ ] Badge KYC s'affiche correctement
- [ ] Polling fonctionne (statut se met à jour)
- [ ] Protection des routes implémentée

---

## 🐛 Troubleshooting

### Badge KYC ne s'affiche pas

1. Vérifier que `NEXT_PUBLIC_KYC_MANAGER_ADDRESS` est défini
2. Vérifier que l'ABI contient les bonnes fonctions
3. Vérifier dans la console les erreurs de contrat
4. Utiliser React DevTools pour inspecter le hook

### Hook retourne toujours `false`

1. Vérifier que vous êtes sur le bon réseau (Sepolia ?)
2. Vérifier que le contrat KYC est déployé
3. Tester manuellement avec Etherscan : appeler `isKYCVerified(yourAddress)`

### Polling trop fréquent / trop lent

Modifier `refetchInterval` dans le hook (10000 = 10 secondes)

---

**🎉 Implémentation Complète !**

Tous les composants sont 100% on-chain, sans logique off-chain.
