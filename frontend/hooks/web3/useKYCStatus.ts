/**
 * Hook pour récupérer le statut KYC d'un utilisateur
 * Lecture on-chain : whitelist, blacklist, KYC verification
 * 
 * Alias de useCompliance avec un nom plus explicite
 */

import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

/**
 * ABI minimal pour KYCManager
 * À remplacer par l'ABI complet depuis abi/KYCManager.ts
 */
const KYC_MANAGER_ABI = [
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
] as const;

export interface KYCStatus {
  /** Adresse vérifiée */
  address: `0x${string}`;
  
  /** KYC vérifié ? */
  isKYCVerified: boolean;
  
  /** Whitelisté ? */
  isWhitelisted: boolean;
  
  /** Blacklisté ? */
  isBlacklisted: boolean;
  
  /** Niveau KYC (0 = aucun, 1 = basique, 2 = avancé, etc.) */
  kycLevel: number;
  
  /** Peut trader ? (KYC OK + Whitelist OK + Non blacklisté) */
  canTrade: boolean;
  
  /** Raison du blocage si canTrade = false */
  reason?: string;
}

/**
 * Hook principal pour le statut KYC
 */
export function useKYCStatus(userAddress?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const address = userAddress || connectedAddress;

  // Lecture KYC vérifié
  const { data: isKYCVerified, isLoading: kycLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
    abi: KYC_MANAGER_ABI,
    functionName: 'isKYCVerified',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10_000, // Refresh toutes les 10s
    },
  });

  // Lecture whitelist
  const { data: isWhitelisted, isLoading: whitelistLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
    abi: KYC_MANAGER_ABI,
    functionName: 'isWhitelisted',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10_000,
    },
  });

  // Lecture blacklist
  const { data: isBlacklisted, isLoading: blacklistLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
    abi: KYC_MANAGER_ABI,
    functionName: 'isBlacklisted',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10_000,
    },
  });

  // Lecture niveau KYC
  const { data: kycLevel, isLoading: levelLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
    abi: KYC_MANAGER_ABI,
    functionName: 'getKYCLevel',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10_000,
    },
  });

  const isLoading = kycLoading || whitelistLoading || blacklistLoading || levelLoading;

  // Calcul du statut complet
  const kycStatus: KYCStatus | null = address
    ? {
        address,
        isKYCVerified: isKYCVerified ?? false,
        isWhitelisted: isWhitelisted ?? false,
        isBlacklisted: isBlacklisted ?? false,
        kycLevel: kycLevel ? Number(kycLevel) : 0,
        canTrade: !!(
          (isKYCVerified ?? false) &&
          (isWhitelisted ?? false) &&
          !(isBlacklisted ?? false)
        ),
        reason: (isBlacklisted ?? false)
          ? '🚫 Address is blacklisted'
          : !(isKYCVerified ?? false)
          ? '⚠️ KYC verification required'
          : !(isWhitelisted ?? false)
          ? '⚠️ Address not whitelisted'
          : undefined,
      }
    : null;

  return {
    kycStatus,
    isLoading,
    
    // Shortcuts pour faciliter l'utilisation
    canTrade: kycStatus?.canTrade ?? false,
    isKYCVerified: kycStatus?.isKYCVerified ?? false,
    isWhitelisted: kycStatus?.isWhitelisted ?? false,
    isBlacklisted: kycStatus?.isBlacklisted ?? false,
    kycLevel: kycStatus?.kycLevel ?? 0,
    reason: kycStatus?.reason,
  };
}

/**
 * Hook pour vérifier si une adresse spécifique peut trader
 */
export function useCanTrade(address?: `0x${string}`) {
  const { canTrade, isLoading } = useKYCStatus(address);
  return { canTrade, isLoading };
}

/**
 * Hook pour obtenir uniquement le statut de vérification KYC
 */
export function useIsKYCVerified(address?: `0x${string}`) {
  const { isKYCVerified, isLoading } = useKYCStatus(address);
  return { isKYCVerified, isLoading };
}
