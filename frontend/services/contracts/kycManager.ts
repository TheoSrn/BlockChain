/**
 * Service pour interagir avec le KYC Manager
 */

import { readContract, writeContract } from '@wagmi/core';
import { config } from '@/config/wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import KYC_MANAGER_ABI from '@/abi/KYCManager';
import type { ComplianceCheck } from '@/types';

export class KYCManagerService {
  /**
   * Vérifie le statut KYC d'un utilisateur
   */
  static async checkCompliance(address: string): Promise<ComplianceCheck> {
    try {
      const [isKYCVerified, isWhitelisted, isBlacklisted] = await Promise.all([
        readContract(config, {
          address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
          abi: KYC_MANAGER_ABI,
          functionName: 'isKYCVerified',
          args: [address as `0x${string}`],
        }),
        readContract(config, {
          address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
          abi: KYC_MANAGER_ABI,
          functionName: 'isWhitelisted',
          args: [address as `0x${string}`],
        }),
        readContract(config, {
          address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
          abi: KYC_MANAGER_ABI,
          functionName: 'isBlacklisted',
          args: [address as `0x${string}`],
        }),
      ]);

      const canTrade = isKYCVerified && isWhitelisted && !isBlacklisted;
      const restrictions = [];

      if (!isKYCVerified) restrictions.push('NO_KYC');
      if (isBlacklisted) restrictions.push('BLACKLISTED');
      if (!isWhitelisted) restrictions.push('NOT_WHITELISTED');

      return {
        address,
        canTrade,
        reason: !canTrade ? restrictions.join(', ') : undefined,
        restrictions,
      };
    } catch (error) {
      console.error('Error checking compliance:', error);
      return {
        address,
        canTrade: false,
        reason: 'Error checking compliance',
        restrictions: ['ERROR'],
      };
    }
  }

  /**
   * Définit le niveau KYC (admin only)
   */
  static async setKYCLevel(userAddress: string, level: number): Promise<string> {
    try {
      const hash = await writeContract(config, {
        address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
        abi: KYC_MANAGER_ABI,
        functionName: 'setKYCLevel',
        args: [userAddress as `0x${string}`, level],
      });
      return hash;
    } catch (error) {
      console.error('Error setting KYC level:', error);
      throw error;
    }
  }

  /**
   * Ajoute à la whitelist (admin only)
   */
  static async addToWhitelist(userAddress: string): Promise<string> {
    try {
      const hash = await writeContract(config, {
        address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
        abi: KYC_MANAGER_ABI,
        functionName: 'addToWhitelist',
        args: [userAddress as `0x${string}`],
      });
      return hash;
    } catch (error) {
      console.error('Error adding to whitelist:', error);
      throw error;
    }
  }

  /**
   * Retire de la whitelist (admin only)
   */
  static async removeFromWhitelist(userAddress: string): Promise<string> {
    try {
      const hash = await writeContract(config, {
        address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
        abi: KYC_MANAGER_ABI,
        functionName: 'removeFromWhitelist',
        args: [userAddress as `0x${string}`],
      });
      return hash;
    } catch (error) {
      console.error('Error removing from whitelist:', error);
      throw error;
    }
  }

  /**
   * Ajoute à la blacklist (admin only)
   */
  static async addToBlacklist(userAddress: string): Promise<string> {
    try {
      const hash = await writeContract(config, {
        address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
        abi: KYC_MANAGER_ABI,
        functionName: 'addToBlacklist',
        args: [userAddress as `0x${string}`],
      });
      return hash;
    } catch (error) {
      console.error('Error adding to blacklist:', error);
      throw error;
    }
  }
}
