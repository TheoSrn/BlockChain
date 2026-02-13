/**
 * Service pour interagir avec l'Asset Registry
 * Encapsule la logique métier des contrats
 */

import { readContract, writeContract } from '@wagmi/core';
import { config } from '@/config/wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import FACTORY_ABI from '@/abi/Factory';

export interface AssetRecord {
  id: bigint;
  nft: string;
  token: string;
  pool: string;
  name: string;
  symbol: string;
  active: boolean;
}

export class AssetRegistryService {
  /**
   * Récupère tous les actifs enregistrés
   */
  static async getAllAssets(): Promise<AssetRecord[]> {
    try {
      const count = await readContract(config, {
        address: CONTRACT_ADDRESSES.ASSET_FACTORY as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: 'assetCount',
      });

      const assetCount = Number(count as bigint);
      const assets: AssetRecord[] = [];

      for (let i = 1; i <= assetCount; i++) {
        const asset = await readContract(config, {
          address: CONTRACT_ADDRESSES.ASSET_FACTORY as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: 'getAsset',
          args: [BigInt(i)],
        });

        const [id, nft, token, pool, name, symbol, active] = asset as any[];
        assets.push({
          id,
          nft,
          token,
          pool,
          name,
          symbol,
          active,
        });
      }

      return assets;
    } catch (error) {
      console.error('Error fetching all assets:', error);
      return [] as AssetRecord[];
    }
  }

  /**
   * Récupère les informations d'un actif
   */
  static async getAssetInfo(assetId: number): Promise<AssetRecord | null> {
    try {
      const asset = await readContract(config, {
        address: CONTRACT_ADDRESSES.ASSET_FACTORY as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: 'getAsset',
        args: [BigInt(assetId)],
      });

      const [id, nft, token, pool, name, symbol, active] = asset as any[];
      return {
        id,
        nft,
        token,
        pool,
        name,
        symbol,
        active,
      } as AssetRecord;
    } catch (error) {
      console.error('Error fetching asset info:', error);
      return null;
    }
  }

  /**
   * Crée un nouvel actif
   */
  static async createAsset(params: {
    tokenName: string;
    tokenSymbol: string;
    nftName: string;
    nftSymbol: string;
    treasury: string;
    initialSupply: bigint;
    location: string;
    surface: bigint;
    estimatedValue: bigint;
    description: string;
    documents: string;
    tokenUri: string;
  }): Promise<string> {
    try {
      const hash = await writeContract(config, {
        address: CONTRACT_ADDRESSES.ASSET_FACTORY as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: 'createAsset',
        args: [
          params.tokenName,
          params.tokenSymbol,
          params.nftName,
          params.nftSymbol,
          params.treasury as `0x${string}`,
          params.initialSupply,
          params.location,
          params.surface,
          params.estimatedValue,
          params.description,
          params.documents,
          params.tokenUri,
        ],
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
  static async isAssetRegistered(assetId: number): Promise<boolean> {
    try {
      const asset = await readContract(config, {
        address: CONTRACT_ADDRESSES.ASSET_FACTORY as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: 'getAsset',
        args: [BigInt(assetId)],
      });
      const [, , , , , , active] = asset as any[];
      return Boolean(active);
    } catch (error) {
      console.error('Error checking asset registration:', error);
      return false;
    }
  }
}
