'use client';

import { useReadContract, useAccount } from 'wagmi';
import { useChainId } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { FACTORY_ABI } from '@/abi/Factory';
import ASSET_NFT_ABI from '@/abi/AssetNFT';
import ASSET_ERC20_ABI from '@/abi/AssetERC20';
import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

interface AssetMetadata {
  location: string;
  surface: bigint;
  estimatedValue: bigint;
  description: string;
  documents: string;
}

interface Asset {
  id: bigint;
  name: string;
  symbol: string;
  nft: string;
  token: string;
  pool: string;
  active: boolean;
  imageUrl?: string;
  metadata?: AssetMetadata;
  totalSupply?: bigint;
  userBalance?: bigint;
  tokenPrice?: bigint;
}

export function useFactoryAssets() {
  const factoryAddress = CONTRACT_ADDRESSES.ASSET_FACTORY;
  const chainId = useChainId();
  const { address: userAddress } = useAccount();
  const hasFactory = factoryAddress !== '0x0000000000000000000000000000000000000000';
  const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || '';

  // Récupérer le nombre d'assets
  const { data: assetCount, refetch: refetchCount } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'assetCount',
    query: {
      enabled: hasFactory,
      refetchInterval: 3_000, // Refetch every 3 seconds for fresh data
      refetchOnMount: 'always',
      staleTime: 0,
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

        // Récupérer les tokenURI et métadonnées pour chaque asset
        const tokenUriPromises = [];
        const metadataPromises = [];
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result.status === 'fulfilled' && result.value) {
            const assetRecord = result.value as any;
            const nftAddress = assetRecord.nft;
            const assetId = BigInt(i + 1);
            
            // Récupérer le tokenURI du NFT
            tokenUriPromises.push(
              client.readContract({
                address: nftAddress as `0x${string}`,
                abi: ASSET_NFT_ABI,
                functionName: 'tokenURI',
                args: [assetId],
              }).catch((error) => {
                console.error(`[useFactoryAssets] Failed to fetch tokenURI for asset ${i + 1}:`, error);
                return '';
              })
            );

            // Récupérer les métadonnées du NFT
            metadataPromises.push(
              client.readContract({
                address: nftAddress as `0x${string}`,
                abi: ASSET_NFT_ABI,
                functionName: 'getMetadata',
              }).catch((error) => {
                console.error(`[useFactoryAssets] Failed to fetch metadata for asset ${i + 1}:`, error);
                return null;
              })
            );
          } else {
            tokenUriPromises.push(Promise.resolve(''));
            metadataPromises.push(Promise.resolve(null));
          }
        }

        const tokenUris = await Promise.all(tokenUriPromises);
        const metadatas = await Promise.all(metadataPromises);

        // Récupérer totalSupply et balance pour chaque token
        const supplyPromises = [];
        const balancePromises = [];
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result.status === 'fulfilled' && result.value) {
            const assetRecord = result.value as any;
            const tokenAddress = assetRecord.token;
            const nftAddress = assetRecord.nft;
            const assetId = BigInt(i + 1);
            
            // Check if this is a UNIQUE (NFT) or DIVISIBLE asset
            const metadata = metadatas[i] as any;
            const isUnique = metadata?.documents?.includes('UNIQUE');
            
            console.log(`[useFactoryAssets] Asset ${i + 1} - Name: ${assetRecord.name}, isUnique: ${isUnique}, documents: "${metadata?.documents}"`);
            
            // Récupérer le totalSupply
            supplyPromises.push(
              client.readContract({
                address: tokenAddress as `0x${string}`,
                abi: ASSET_ERC20_ABI,
                functionName: 'totalSupply',
              }).catch((error) => {
                console.error(`[useFactoryAssets] Failed to fetch totalSupply for asset ${i + 1}:`, error);
                return BigInt(0);
              })
            );

            // Récupérer le balance de l'utilisateur si connecté
            if (userAddress) {
              if (isUnique) {
                // For NFTs, check ownership with ownerOf instead of balanceOf
                console.log(`[useFactoryAssets] Checking NFT ownership for asset ${i + 1}, tokenId ${assetId}, NFT address: ${nftAddress}`);
                balancePromises.push(
                  client.readContract({
                    address: nftAddress as `0x${string}`,
                    abi: ASSET_NFT_ABI,
                    functionName: 'ownerOf',
                    args: [assetId],
                  }).then((owner: any) => {
                    const ownsNFT = (owner as string).toLowerCase() === userAddress.toLowerCase();
                    console.log(`[useFactoryAssets] Asset ${i + 1} NFT owner: ${owner}, userAddress: ${userAddress}, owns: ${ownsNFT}`);
                    // Return 1 if user owns the NFT, 0 otherwise
                    return ownsNFT ? BigInt(1) : BigInt(0);
                  }).catch((error) => {
                    console.error(`[useFactoryAssets] Failed to check NFT ownership for asset ${i + 1}:`, error);
                    return BigInt(0);
                  })
                );
              } else {
                // For divisible assets, use balanceOf on the ERC20 token
                balancePromises.push(
                  client.readContract({
                    address: tokenAddress as `0x${string}`,
                    abi: ASSET_ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [userAddress],
                  }).catch((error) => {
                    console.error(`[useFactoryAssets] Failed to fetch balance for asset ${i + 1}:`, error);
                    return BigInt(0);
                  })
                );
              }
            } else {
              balancePromises.push(Promise.resolve(BigInt(0)));
            }
          } else {
            supplyPromises.push(Promise.resolve(BigInt(0)));
            balancePromises.push(Promise.resolve(BigInt(0)));
          }
        }

        const totalSupplies = await Promise.all(supplyPromises);
        const userBalances = await Promise.all(balancePromises);

        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            const assetRecord = result.value as any;
            const metadata = metadatas[index] as any;
            
            // Si tokenURI est vide, utiliser documents comme fallback pour l'image
            let imageUrl = tokenUris[index] ? String(tokenUris[index]) : undefined;
            if (!imageUrl && metadata && metadata.documents) {
              imageUrl = metadata.documents;
            }
            
            console.log(`[useFactoryAssets] Asset ${index + 1}:`, { 
              name: assetRecord.name, 
              symbol: assetRecord.symbol, 
              active: assetRecord.active,
              imageUrl: imageUrl,
              metadata: metadata
            });

            const totalSupply = totalSupplies[index];
            const userBalance = userBalances[index];
            const estimatedValue = metadata?.estimatedValue || BigInt(0);
            const tokenPrice = totalSupply > 0 ? estimatedValue / totalSupply : BigInt(0);

            assetsData.push({
              id: BigInt(index + 1),
              name: assetRecord.name || `Asset ${index + 1}`,
              symbol: assetRecord.symbol || `A${index + 1}`,
              nft: assetRecord.nft || '0x0000000000000000000000000000000000000000',
              token: assetRecord.token || '0x0000000000000000000000000000000000000000',
              pool: assetRecord.pool || '0x0000000000000000000000000000000000000000',
              active: assetRecord.active !== undefined ? assetRecord.active : true,
              imageUrl: imageUrl,
              totalSupply: totalSupply,
              userBalance: userBalance,
              tokenPrice: tokenPrice,
              metadata: metadata ? {
                location: metadata.location || '',
                surface: metadata.surface || BigInt(0),
                estimatedValue: metadata.estimatedValue || BigInt(0),
                description: metadata.description || '',
                documents: metadata.documents || '',
              } : undefined,
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
  }, [hasFactory, assetCount, chainId, factoryAddress, rpcUrl, userAddress]);

  return {
    assets,
    isLoading,
    assetCount: assetCount ? Number(assetCount) : 0,
    refetchCount,
  };
}
