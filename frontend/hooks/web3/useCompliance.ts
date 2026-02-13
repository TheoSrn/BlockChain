/**
 * Hook personnalisé pour vérifier la conformité d'un utilisateur
 * Vérifie KYC, whitelist et blacklist on-chain
 */

import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import type { ComplianceCheck } from '@/types';
import KYC_MANAGER_ABI from '@/abi/KYCManager';

export function useCompliance() {
  const { address } = useAccount();

  const { data: isVerified, isLoading: kycLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
    abi: KYC_MANAGER_ABI,
    functionName: 'isVerified',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: isWhitelisted, isLoading: whitelistLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
    abi: KYC_MANAGER_ABI,
    functionName: 'isWhitelisted',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: isBlacklisted, isLoading: blacklistLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
    abi: KYC_MANAGER_ABI,
    functionName: 'isBlacklisted',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const isLoading = kycLoading || whitelistLoading || blacklistLoading;

  const complianceCheck: ComplianceCheck | null = address
    ? {
        address,
        canTrade: !!(isVerified && isWhitelisted && !isBlacklisted),
        reason: !isVerified
          ? 'KYC verification required'
          : isBlacklisted
          ? 'Address is blacklisted'
          : !isWhitelisted
          ? 'Address not whitelisted'
          : undefined,
        restrictions: [
          !isVerified && 'NO_KYC',
          isBlacklisted && 'BLACKLISTED',
          !isWhitelisted && 'NOT_WHITELISTED',
        ].filter(Boolean) as string[],
      }
    : null;

  return {
    compliance: complianceCheck,
    isLoading,
    isKYCVerified: !!isVerified,
    isWhitelisted: !!isWhitelisted,
    isBlacklisted: !!isBlacklisted,
  };
}
