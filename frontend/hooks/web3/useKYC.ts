/**
 * Hook pour gérer le statut KYC d'un utilisateur
 * Usage: const { isVerified, isWhitelisted, isBlacklisted, canTrade } = useKYCStatus(address);
 */

import { useReadContract } from 'wagmi';
import { kycABI } from '@/abi/KYC';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

// Adresse du contrat KYC depuis la config centralisée
const KYC_CONTRACT_ADDRESS = CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`;

export function useKYCStatus(address?: `0x${string}`) {
  const { data: isWhitelisted, isLoading: isLoadingWhitelist } = useReadContract({
    address: KYC_CONTRACT_ADDRESS,
    abi: kycABI,
    functionName: 'isWhitelisted',
    args: address ? [address] : undefined,
  });

  const { data: isBlacklisted, isLoading: isLoadingBlacklist } = useReadContract({
    address: KYC_CONTRACT_ADDRESS,
    abi: kycABI,
    functionName: 'isBlacklisted',
    args: address ? [address] : undefined,
  });

  const { data: isVerified, isLoading: isLoadingVerified } = useReadContract({
    address: KYC_CONTRACT_ADDRESS,
    abi: kycABI,
    functionName: 'isVerified',
    args: address ? [address] : undefined,
  });

  const isLoading = isLoadingWhitelist || isLoadingBlacklist || isLoadingVerified;

  return {
    isWhitelisted: isWhitelisted ?? false,
    isBlacklisted: isBlacklisted ?? false,
    isVerified: isVerified ?? false,
    canTrade: isVerified ?? false,
    isLoading,
    kycAddress: KYC_CONTRACT_ADDRESS,
  };
}

/**
 * Hook pour afficher un badge de statut KYC
 */
export function useKYCBadge(address?: `0x${string}`) {
  const { isVerified, isWhitelisted, isBlacklisted, isLoading } = useKYCStatus(address);

  if (isLoading) {
    return {
      label: 'Loading...',
      color: 'gray',
      icon: '⏳',
    };
  }

  if (isBlacklisted) {
    return {
      label: 'Blacklisted',
      color: 'red',
      icon: '🚫',
    };
  }

  if (isVerified) {
    return {
      label: 'Verified',
      color: 'green',
      icon: '✅',
    };
  }

  if (isWhitelisted) {
    return {
      label: 'Whitelisted',
      color: 'blue',
      icon: '📝',
    };
  }

  return {
    label: 'Not Verified',
    color: 'gray',
    icon: '❌',
  };
}

/**
 * Hook pour vérifier si un utilisateur peut effectuer une action
 */
export function useCanTrade(address?: `0x${string}`) {
  const { isVerified, isLoading } = useKYCStatus(address);

  return {
    canTrade: isVerified,
    isLoading,
    reason: !isVerified ? 'KYC verification required to trade' : undefined,
  };
}
