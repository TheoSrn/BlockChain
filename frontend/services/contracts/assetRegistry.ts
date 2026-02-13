/**
 * Service pour interagir avec l'Asset Registry
 * Encapsule la logique métier des contrats
 */

import { readContract, writeContract } from '@wagmi/core';
import { config } from '@/config/wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import ASSET_REGISTRY_ABI from '@/abi/AssetRegistry';
import type { TokenizedAsset } from '@/types';

export class AssetRegistryService {
  /**
   * Récupère tous les actifs enregistrés
   */
  static async getAllAssets(): Promise<string[]> {
    try {
      const assets = await readContract(config, {
        address: CONTRACT_ADDRESSES.ASSET_REGISTRY as `0x${string}`,
        abi: ASSET_REGISTRY_ABI,
        functionName: 'getAllAssets',
      });
      return assets as string[];
    } catch (error) {
      console.error('Error fetching all assets:', error);
      return [];
    }
  }

  /**
   * Récupère les informations d'un actif
   */
  static async getAssetInfo(assetAddress: string): Promise<TokenizedAsset | null> {
    try {
      const info = await readContract(config, {
        address: CONTRACT_ADDRESSES.ASSET_REGISTRY as `0x${string}`,
        abi: ASSET_REGISTRY_ABI,
        functionName: 'getAssetInfo',
        args: [assetAddress as `0x${string}`],
      });

      const [name, symbol, totalSupply, valueUSD, assetType, isActive] = info as any[];

      return {
        address: assetAddress,
        name,
        symbol,
        totalSupply,
        valueUSD,
        assetType: 'OTHER', // Map from uint8
        isActive,
        complianceRequired: true,
        createdAt: 0,
      };
    } catch (error) {
      console.error('Error fetching asset info:', error);
      return null;
    }
  }

  /**
   * Crée un nouvel actif
   */
  static async createAsset(params: {
    name: string;
    symbol: string;
    assetType: number;
  }): Promise<string> {
    try {
      const hash = await writeContract(config, {
        address: CONTRACT_ADDRESSES.ASSET_REGISTRY as `0x${string}`,
        abi: ASSET_REGISTRY_ABI,
        functionName: 'createAsset',
        args: [params.name, params.symbol, params.assetType],
      });
      return hash;
    } catch (error) {
      console.error('Error creating asset:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un actif est enregistré
   */
  static async isAssetRegistered(assetAddress: string): Promise<boolean> {
    try {
      const registered = await readContract(config, {
        address: CONTRACT_ADDRESSES.ASSET_REGISTRY as `0x${string}`,
        abi: ASSET_REGISTRY_ABI,
        functionName: 'isAssetRegistered',
        args: [assetAddress as `0x${string}`],
      });
      return registered as boolean;
    } catch (error) {
      console.error('Error checking asset registration:', error);
      return false;
    }
  }
}
