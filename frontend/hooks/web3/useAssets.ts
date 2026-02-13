/**
 * Hook pour récupérer les actifs tokenisés (RWA) depuis le registry
 * Récupère l'état réel on-chain sans mocking
 */

import { useReadContract, useReadContracts } from 'wagmi';
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

export function useAssets() {
  const factoryAddress = CONTRACT_ADDRESSES.ASSET_FACTORY as `0x${string}`;
  const hasFactory = factoryAddress !== '0x0000000000000000000000000000000000000000';

  const { data: assetCountData, isLoading: countLoading } = useReadContract({
    address: factoryAddress,
    abi: FACTORY_ABI,
    functionName: 'assetCount',
    query: {
      enabled: hasFactory,
    },
  });

  const assetCount = Number(assetCountData ?? 0n);
  const assetIds = Array.from({ length: assetCount }, (_, i) => BigInt(i + 1));

  const { data: assetsData, isLoading: assetsLoading } = useReadContracts({
    contracts: assetIds.map((id) => ({
      address: factoryAddress,
      abi: FACTORY_ABI,
      functionName: 'getAsset',
      args: [id],
    })),
    query: {
      enabled: hasFactory && assetCount > 0,
    },
  });

  const assets = (assetsData || [])
    .map((result) => {
      if (result.status !== 'success') return null;
      const [id, nft, token, pool, name, symbol, active] = result.result as unknown as [
        bigint,
        string,
        string,
        string,
        string,
        string,
        boolean
      ];
      return { id, nft, token, pool, name, symbol, active } as AssetRecord;
    })
    .filter(Boolean) as AssetRecord[];

  return {
    assets,
    isLoading: countLoading || assetsLoading,
  };
}

export function useAssetInfo(assetId: bigint | number | undefined) {
  const factoryAddress = CONTRACT_ADDRESSES.ASSET_FACTORY as `0x${string}`;
  const hasFactory = factoryAddress !== '0x0000000000000000000000000000000000000000';

  const { data, isLoading, error } = useReadContract({
    address: factoryAddress,
    abi: FACTORY_ABI,
    functionName: 'getAsset',
    args: assetId !== undefined ? [BigInt(assetId)] : undefined,
    query: {
      enabled: hasFactory && assetId !== undefined,
    },
  });

  const assetInfo: AssetRecord | null = data
    ? {
        id: (data as any)[0],
        nft: (data as any)[1],
        token: (data as any)[2],
        pool: (data as any)[3],
        name: (data as any)[4],
        symbol: (data as any)[5],
        active: (data as any)[6],
      }
    : null;

  return {
    asset: assetInfo,
    isLoading,
    error,
  };
}
