/**
 * Hook pour récupérer le statut KYC d'un utilisateur
 * Lecture on-chain : whitelist, blacklist, KYC verification
 * 
 * Alias de useCompliance avec un nom plus explicite
 */

import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import KYC_MANAGER_ABI from '@/abi/KYCManager';

export interface KYCStatus {
  /** Adresse vérifiée */
  address: `0x${string}`;
  
  /** KYC verifie ? */
  isKYCVerified: boolean;
  
  /** Whitelisté ? */
  isWhitelisted: boolean;
  
  /** Blacklisté ? */
  isBlacklisted: boolean;
  
  /** Peut trader ? (KYC OK + Whitelist OK + Non blacklisté) */
  canTrade: boolean;
  
  /** Raison du blocage si canTrade = false */
  reason?: string;
}

/**
 * Hook principal pour le statut KYC
 */
type KycStatusOptions = {
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean;
};

export function useKYCStatus(
  userAddress?: `0x${string}`,
  options?: KycStatusOptions
) {
  const { address: connectedAddress } = useAccount();
  const address = userAddress || connectedAddress;
  const { refetchInterval = 60_000, refetchOnWindowFocus = false } = options ?? {};

  // Lecture KYC vérifié
  const {
    data: isVerified,
    isLoading: kycLoading,
    refetch: refetchVerified,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
    abi: KYC_MANAGER_ABI,
    functionName: 'isVerified',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval,
      refetchOnWindowFocus,
    },
  });

  // Lecture whitelist
  const {
    data: isWhitelisted,
    isLoading: whitelistLoading,
    refetch: refetchWhitelisted,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
    abi: KYC_MANAGER_ABI,
    functionName: 'isWhitelisted',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval,
      refetchOnWindowFocus,
    },
  });

  // Lecture blacklist
  const {
    data: isBlacklisted,
    isLoading: blacklistLoading,
    refetch: refetchBlacklisted,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
    abi: KYC_MANAGER_ABI,
    functionName: 'isBlacklisted',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval,
      refetchOnWindowFocus,
    },
  });

  const isLoading = kycLoading || whitelistLoading || blacklistLoading;

  // Calcul du statut complet
  const kycStatus: KYCStatus | null = address
    ? {
        address,
        isKYCVerified: isVerified ?? false,
        isWhitelisted: isWhitelisted ?? false,
        isBlacklisted: isBlacklisted ?? false,
        canTrade: !!(
          (isVerified ?? false) &&
          (isWhitelisted ?? false) &&
          !(isBlacklisted ?? false)
        ),
        reason: (isBlacklisted ?? false)
          ? '🚫 Address is blacklisted'
          : !(isVerified ?? false)
          ? '⚠️ KYC verification required'
          : !(isWhitelisted ?? false)
          ? '⚠️ Address not whitelisted'
          : undefined,
      }
    : null;

  const refetch = async () => {
    await Promise.all([
      refetchVerified(),
      refetchWhitelisted(),
      refetchBlacklisted(),
    ]);
  };

  return {
    kycStatus,
    isLoading,
    refetch,
    
    // Shortcuts pour faciliter l'utilisation
    canTrade: kycStatus?.canTrade ?? false,
    isKYCVerified: kycStatus?.isKYCVerified ?? false,
    isWhitelisted: kycStatus?.isWhitelisted ?? false,
    isBlacklisted: kycStatus?.isBlacklisted ?? false,
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
