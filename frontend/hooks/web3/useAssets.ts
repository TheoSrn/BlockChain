/**
 * Hook pour récupérer les actifs tokenisés (RWA) depuis le registry
 * Récupère l'état réel on-chain sans mocking
 */

import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import type { TokenizedAsset } from '@/types';

// ABI minimal pour l'Asset Registry (à remplacer par votre ABI complet)
const ASSET_REGISTRY_ABI = [
  {
    inputs: [],
    name: 'getAllAssets',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'assetAddress', type: 'address' }],
    name: 'getAssetInfo',
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'totalSupply', type: 'uint256' },
      { name: 'valueUSD', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function useAssets() {
  const { data: assetAddresses, isLoading: addressesLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.ASSET_REGISTRY as `0x${string}`,
    abi: ASSET_REGISTRY_ABI,
    functionName: 'getAllAssets',
  });

  return {
    assetAddresses: (assetAddresses as string[]) || [],
    isLoading: addressesLoading,
  };
}

export function useAssetInfo(assetAddress: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.ASSET_REGISTRY as `0x${string}`,
    abi: ASSET_REGISTRY_ABI,
    functionName: 'getAssetInfo',
    args: assetAddress ? [assetAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!assetAddress,
    },
  });

  const assetInfo: TokenizedAsset | null = data
    ? {
        address: assetAddress!,
        name: (data as any)[0],
        symbol: (data as any)[1],
        totalSupply: (data as any)[2],
        valueUSD: (data as any)[3],
        isActive: (data as any)[4],
        assetType: 'OTHER',
        complianceRequired: true,
        createdAt: 0,
      }
    : null;

  return {
    asset: assetInfo,
    isLoading,
    error,
  };
}
