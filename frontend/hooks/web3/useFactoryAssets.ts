'use client';

import { useReadContract } from 'wagmi';
import { useChainId } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { FACTORY_ABI } from '@/abi/Factory';
import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

interface Asset {
  id: bigint;
  name: string;
  symbol: string;
  nft: string;
  token: string;
  pool: string;
  active: boolean;
}

export function useFactoryAssets() {
  const factoryAddress = CONTRACT_ADDRESSES.ASSET_FACTORY;
  const chainId = useChainId();
  const hasFactory = factoryAddress !== '0x0000000000000000000000000000000000000000';
  const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || '';

  // Récupérer le nombre d'assets
  const { data: assetCount, refetch: refetchCount } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'assetCount',
    query: {
      enabled: hasFactory,
      refetchInterval: 5_000,
    },
  });

  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Récupérer les détails de chaque asset
  useEffect(() => {
    console.log('[useFactoryAssets] hasFactory:', hasFactory, 'assetCount:', assetCount, 'factoryAddress:', factoryAddress);
    
    if (!hasFactory || !assetCount || assetCount === BigInt(0)) {
      console.log('[useFactoryAssets] No factory or no assets found');
      setAssets([]);
      return;
    }

    const count = Number(assetCount);
    console.log('[useFactoryAssets] Fetching', count, 'assets');
    setIsLoading(true);

    const fetchAssets = async () => {
      try {
        // Créer un client viem avec la bonne RPC URL
        if (!rpcUrl) {
          console.warn('[useFactoryAssets] No RPC URL provided! Check NEXT_PUBLIC_SEPOLIA_RPC_URL');
        }
        console.log('[useFactoryAssets] Using RPC URL:', rpcUrl ? rpcUrl.substring(0, 50) + '...' : 'default');
        
        const transport = rpcUrl ? http(rpcUrl) : http();
        const client = createPublicClient({
          chain: chainId === 11155111 ? sepolia : undefined,
          transport,
        });

        const assetsData: Asset[] = [];

        // Récupérer tous les assets en parallèle
        const promises = [];
        for (let i = 1; i <= count; i++) {
          promises.push(
            client.readContract({
              address: factoryAddress as `0x${string}`,
              abi: FACTORY_ABI,
              functionName: 'getAsset',
              args: [BigInt(i)],
            })
          );
        }

        const results = await Promise.allSettled(promises);
        console.log('[useFactoryAssets] Results:', results.map((r, i) => ({ index: i, status: r.status })));

        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            const assetRecord = result.value as any;
            console.log(`[useFactoryAssets] Asset ${index + 1}:`, { 
              name: assetRecord.name, 
              symbol: assetRecord.symbol, 
              active: assetRecord.active 
            });
            assetsData.push({
              id: BigInt(index + 1),
              name: assetRecord.name || `Asset ${index + 1}`,
              symbol: assetRecord.symbol || `A${index + 1}`,
              nft: assetRecord.nft || '0x0000000000000000000000000000000000000000',
              token: assetRecord.token || '0x0000000000000000000000000000000000000000',
              pool: assetRecord.pool || '0x0000000000000000000000000000000000000000',
              active: assetRecord.active !== undefined ? assetRecord.active : true,
            });
          } else if (result.status === 'rejected') {
            console.error(`[useFactoryAssets] Asset ${index + 1} fetch failed:`, result.reason);
          }
        });

        console.log('[useFactoryAssets] Total assets fetched:', assetsData.length);
        setAssets(assetsData.sort((a, b) => Number(b.id) - Number(a.id))); // Latest first
      } catch (error) {
        console.error('[useFactoryAssets] Failed to fetch assets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, [hasFactory, assetCount, chainId, factoryAddress, rpcUrl]);

  return {
    assets,
    isLoading,
    assetCount: assetCount ? Number(assetCount) : 0,
    refetchCount,
  };
}
