/**
 * Hook useKYCManager - Gestion KYC et Whitelist/Blacklist
 * Permet aux admins de gérer les adresses KYC
 */

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { Address } from 'viem';

// ABI du contrat KYC Manager
const KYC_MANAGER_ABI = [
  // Views
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function isKYCVerified(address account) view returns (bool)',
  'function isWhitelisted(address account) view returns (bool)',
  'function isBlacklisted(address account) view returns (bool)',
  'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
  'function KYC_ADMIN_ROLE() view returns (bytes32)',
  
  // Write functions
  'function addToWhitelist(address account)',
  'function removeFromWhitelist(address account)',
  'function addToBlacklist(address account)',
  'function removeFromBlacklist(address account)',
  'function verifyKYC(address account)',
  'function revokeKYC(address account)',
  'function grantRole(bytes32 role, address account)',
  'function revokeRole(bytes32 role, address account)',
] as const;

export interface KYCStatus {
  isVerified: boolean;
  isWhitelisted: boolean;
  isBlacklisted: boolean;
}

/**
 * Hook pour vérifier si l'utilisateur connecté est admin
 */
export function useIsAdmin() {
  const { address } = useAccount();
  
  // Mode développement - Bypass la vérification admin
  const devMode = process.env.NEXT_PUBLIC_ADMIN_DEV_MODE === 'true';
  
  const { data: adminRoleBytes } = useReadContract({
    address: CONTRACT_ADDRESSES.KYC_MANAGER as Address,
    abi: KYC_MANAGER_ABI,
    functionName: 'DEFAULT_ADMIN_ROLE',
    query: {
      enabled: !devMode,
    },
  });

  const { data: isAdmin, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.KYC_MANAGER as Address,
    abi: KYC_MANAGER_ABI,
    functionName: 'hasRole',
    args: address && adminRoleBytes ? [adminRoleBytes, address] : undefined,
    query: {
      enabled: !devMode && !!address && !!adminRoleBytes,
    },
  });

  // En mode dev, tout le monde est admin
  if (devMode && address) {
    return {
      isAdmin: true,
      isLoading: false,
      refetch,
    };
  }

  return {
    isAdmin: isAdmin || false,
    isLoading,
    refetch,
  };
}

/**
 * Hook pour obtenir le statut KYC d'une adresse
 */
export function useKYCStatus(targetAddress?: Address) {
  // Mode développement - Retourne des données mockées
  const devMode = process.env.NEXT_PUBLIC_ADMIN_DEV_MODE === 'true';
  
  const { data: isVerified, refetch: refetchVerified } = useReadContract({
    address: CONTRACT_ADDRESSES.KYC_MANAGER as Address,
    abi: KYC_MANAGER_ABI,
    functionName: 'isKYCVerified',
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !devMode && !!targetAddress,
    },
  });

  const { data: isWhitelisted, refetch: refetchWhitelisted } = useReadContract({
    address: CONTRACT_ADDRESSES.KYC_MANAGER as Address,
    abi: KYC_MANAGER_ABI,
    functionName: 'isWhitelisted',
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !devMode && !!targetAddress,
    },
  });

  const { data: isBlacklisted, refetch: refetchBlacklisted } = useReadContract({
    address: CONTRACT_ADDRESSES.KYC_MANAGER as Address,
    abi: KYC_MANAGER_ABI,
    functionName: 'isBlacklisted',
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !devMode && !!targetAddress,
    },
  });

  const refetch = () => {
    refetchVerified();
    refetchWhitelisted();
    refetchBlacklisted();
  };

  // En mode dev, retourne des données mockées pour tester l'UI
  if (devMode && targetAddress) {
    // Simule différents états selon les derniers chiffres de l'adresse
    const lastChar = targetAddress.slice(-1).toLowerCase();
    const mockStatus = {
      isVerified: ['0', '1', '2', '3', '4', '5'].includes(lastChar),
      isWhitelisted: ['0', '2', '4', '6', '8', 'a', 'c', 'e'].includes(lastChar),
      isBlacklisted: ['f'].includes(lastChar),
    };
    
    return {
      status: mockStatus as KYCStatus,
      refetch,
    };
  }

  return {
    status: {
      isVerified: isVerified || false,
      isWhitelisted: isWhitelisted || false,
      isBlacklisted: isBlacklisted || false,
    } as KYCStatus,
    refetch,
  };
}

/**
 * Hook pour les actions admin KYC
 */
export function useKYCManager() {
  const { address } = useAccount();
  const { isAdmin } = useIsAdmin();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const [lastAction, setLastAction] = useState<string>('');

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Reset lastAction après succès
  useEffect(() => {
    if (isSuccess) {
      setLastAction('');
    }
  }, [isSuccess]);

  /**
   * Ajoute une adresse à la whitelist
   */
  const addToWhitelist = (targetAddress: Address) => {
    if (!isAdmin) {
      throw new Error('Not authorized: Admin role required');
    }

    setLastAction('addToWhitelist');
    writeContract({
      address: CONTRACT_ADDRESSES.KYC_MANAGER as Address,
      abi: KYC_MANAGER_ABI,
      functionName: 'addToWhitelist',
      args: [targetAddress],
    });
  };

  /**
   * Retire une adresse de la whitelist
   */
  const removeFromWhitelist = (targetAddress: Address) => {
    if (!isAdmin) {
      throw new Error('Not authorized: Admin role required');
    }

    setLastAction('removeFromWhitelist');
    writeContract({
      address: CONTRACT_ADDRESSES.KYC_MANAGER as Address,
      abi: KYC_MANAGER_ABI,
      functionName: 'removeFromWhitelist',
      args: [targetAddress],
    });
  };

  /**
   * Ajoute une adresse à la blacklist
   */
  const addToBlacklist = (targetAddress: Address) => {
    if (!isAdmin) {
      throw new Error('Not authorized: Admin role required');
    }

    setLastAction('addToBlacklist');
    writeContract({
      address: CONTRACT_ADDRESSES.KYC_MANAGER as Address,
      abi: KYC_MANAGER_ABI,
      functionName: 'addToBlacklist',
      args: [targetAddress],
    });
  };

  /**
   * Retire une adresse de la blacklist
   */
  const removeFromBlacklist = (targetAddress: Address) => {
    if (!isAdmin) {
      throw new Error('Not authorized: Admin role required');
    }

    setLastAction('removeFromBlacklist');
    writeContract({
      address: CONTRACT_ADDRESSES.KYC_MANAGER as Address,
      abi: KYC_MANAGER_ABI,
      functionName: 'removeFromBlacklist',
      args: [targetAddress],
    });
  };

  /**
   * Vérifie le KYC d'une adresse
   */
  const verifyKYC = (targetAddress: Address) => {
    if (!isAdmin) {
      throw new Error('Not authorized: Admin role required');
    }

    setLastAction('verifyKYC');
    writeContract({
      address: CONTRACT_ADDRESSES.KYC_MANAGER as Address,
      abi: KYC_MANAGER_ABI,
      functionName: 'verifyKYC',
      args: [targetAddress],
    });
  };

  /**
   * Révoque le KYC d'une adresse
   */
  const revokeKYC = (targetAddress: Address) => {
    if (!isAdmin) {
      throw new Error('Not authorized: Admin role required');
    }

    setLastAction('revokeKYC');
    writeContract({
      address: CONTRACT_ADDRESSES.KYC_MANAGER as Address,
      abi: KYC_MANAGER_ABI,
      functionName: 'revokeKYC',
      args: [targetAddress],
    });
  };

  /**
   * Accorde un rôle à une adresse
   */
  const grantRole = (roleBytes: `0x${string}`, targetAddress: Address) => {
    if (!isAdmin) {
      throw new Error('Not authorized: Admin role required');
    }

    setLastAction('grantRole');
    writeContract({
      address: CONTRACT_ADDRESSES.KYC_MANAGER as Address,
      abi: KYC_MANAGER_ABI,
      functionName: 'grantRole',
      args: [roleBytes, targetAddress],
    });
  };

  /**
   * Révoque un rôle d'une adresse
   */
  const revokeRole = (roleBytes: `0x${string}`, targetAddress: Address) => {
    if (!isAdmin) {
      throw new Error('Not authorized: Admin role required');
    }

    setLastAction('revokeRole');
    writeContract({
      address: CONTRACT_ADDRESSES.KYC_MANAGER as Address,
      abi: KYC_MANAGER_ABI,
      functionName: 'revokeRole',
      args: [roleBytes, targetAddress],
    });
  };

  return {
    // State
    isAdmin,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
    lastAction,

    // Actions
    addToWhitelist,
    removeFromWhitelist,
    addToBlacklist,
    removeFromBlacklist,
    verifyKYC,
    revokeKYC,
    grantRole,
    revokeRole,
  };
}
