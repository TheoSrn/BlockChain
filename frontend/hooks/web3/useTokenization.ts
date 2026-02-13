/**
 * Hook pour la tokenisation d'actifs
 * Créer, gérer et mint des actifs tokenisés
 */

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { parseUnits } from 'viem';

// ABI minimal pour Asset Factory
const ASSET_FACTORY_ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'assetType', type: 'uint8' },
      { name: 'totalSupply', type: 'uint256' },
      { name: 'valueUSD', type: 'uint256' },
    ],
    name: 'createAsset',
    outputs: [{ name: 'assetAddress', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'creator', type: 'address' }],
    name: 'getCreatedAssets',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface CreateAssetParams {
  name: string;
  symbol: string;
  assetType: number;
  totalSupply: string;
  valueUSD: string;
}

export function useTokenization() {
  const {
    writeContract,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createAsset = async (params: CreateAssetParams) => {
    try {
      const supply = parseUnits(params.totalSupply, 18);
      const value = parseUnits(params.valueUSD, 6); // USD has 6 decimals

      await writeContract({
        address: CONTRACT_ADDRESSES.ASSET_FACTORY as `0x${string}`,
        abi: ASSET_FACTORY_ABI,
        functionName: 'createAsset',
        args: [params.name, params.symbol, params.assetType, supply, value],
      });
    } catch (err) {
      console.error('Error creating asset:', err);
      throw err;
    }
  };

  return {
    createAsset,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}

export function useUserAssets(userAddress: string | undefined) {
  const { data: assets, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.ASSET_FACTORY as `0x${string}`,
    abi: ASSET_FACTORY_ABI,
    functionName: 'getCreatedAssets',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    assets: (assets as string[]) || [],
    isLoading,
  };
}
