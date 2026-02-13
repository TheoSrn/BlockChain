/**
 * Hook personnalisé pour vérifier la conformité d'un utilisateur
 * Vérifie KYC, whitelist et blacklist on-chain
 */

import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import type { ComplianceCheck } from '@/types';

// ABI minimal pour le KYC Manager (à remplacer par votre ABI complet)
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
] as const;

export function useCompliance() {
  const { address } = useAccount();

  const { data: isKYCVerified, isLoading: kycLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
    abi: KYC_MANAGER_ABI,
    functionName: 'isKYCVerified',
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
        canTrade: !!(isKYCVerified && isWhitelisted && !isBlacklisted),
        reason: !isKYCVerified
          ? 'KYC verification required'
          : isBlacklisted
          ? 'Address is blacklisted'
          : !isWhitelisted
          ? 'Address not whitelisted'
          : undefined,
        restrictions: [
          !isKYCVerified && 'NO_KYC',
          isBlacklisted && 'BLACKLISTED',
          !isWhitelisted && 'NOT_WHITELISTED',
        ].filter(Boolean) as string[],
      }
    : null;

  return {
    compliance: complianceCheck,
    isLoading,
    isKYCVerified: !!isKYCVerified,
    isWhitelisted: !!isWhitelisted,
    isBlacklisted: !!isBlacklisted,
  };
}
