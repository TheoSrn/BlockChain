/**
 * Hook pour récupérer les NFTs ERC721 possédés par l'utilisateur
 */

import { useAccount, useReadContract } from 'wagmi';
import { useState, useEffect } from 'react';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

// ERC721 ABI minimal
const ERC721_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface NFT {
  contractAddress: string;
  tokenId: bigint;
  tokenURI: string;
  name: string;
  symbol: string;
}

export function useNFTBalance(contractAddress: string | undefined) {
  const { address } = useAccount();

  // Récupérer le nombre de NFTs possédés
  const { data: balance, isLoading: isLoadingBalance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!(address && contractAddress),
      refetchInterval: 10000,
    },
  });

  // Récupérer le nom de la collection
  const { data: name } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'name',
    query: {
      enabled: !!contractAddress,
    },
  });

  // Récupérer le symbole de la collection
  const { data: symbol } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'symbol',
    query: {
      enabled: !!contractAddress,
    },
  });

  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);

  // Récupérer les tokenIds et tokenURIs de tous les NFTs possédés
  useEffect(() => {
    async function fetchNFTs() {
      if (!balance || !address || !contractAddress || balance === BigInt(0)) {
        setNfts([]);
        return;
      }

      setIsLoadingNFTs(true);

      try {
        const nftPromises = [];
        const count = Number(balance);

        // Limiter à 50 NFTs max pour éviter trop de requêtes
        const maxNFTs = Math.min(count, 50);

        for (let i = 0; i < maxNFTs; i++) {
          nftPromises.push(
            fetch('/api', {
              method: 'POST',
              body: JSON.stringify({
                method: 'eth_call',
                params: [
                  {
                    to: contractAddress,
                    data: `0x2f745c59${address.slice(2).padStart(64, '0')}${i.toString(16).padStart(64, '0')}`, // tokenOfOwnerByIndex selector
                  },
                  'latest',
                ],
              }),
            }).then((res) => res.json())
          );
        }

        const tokenIds = await Promise.all(nftPromises);

        // Récupérer les tokenURIs
        const nftData: NFT[] = [];
        for (let i = 0; i < tokenIds.length; i++) {
          if (tokenIds[i]?.result) {
            const tokenId = BigInt(tokenIds[i].result);
            // On pourrait aussi récupérer le tokenURI ici, mais ça ferait beaucoup de requêtes
            // Pour l'instant on ne stocke que l'ID
            nftData.push({
              contractAddress,
              tokenId,
              tokenURI: '',
              name: name as string || 'Unknown',
              symbol: symbol as string || 'NFT',
            });
          }
        }

        setNfts(nftData);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        setNfts([]);
      } finally {
        setIsLoadingNFTs(false);
      }
    }

    fetchNFTs();
  }, [balance, address, contractAddress, name, symbol]);

  return {
    balance: balance || BigInt(0),
    nfts,
    isLoading: isLoadingBalance || isLoadingNFTs,
    name: name as string,
    symbol: symbol as string,
  };
}

// Hook pour récupérer les NFTs de plusieurs collections
export function useMultiNFTBalance(contractAddresses: string[]) {
  const { address } = useAccount();
  const [allNFTs, setAllNFTs] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(BigInt(0));

  useEffect(() => {
    if (!address || contractAddresses.length === 0) {
      setAllNFTs([]);
      setTotalBalance(BigInt(0));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Utiliser le hook useNFTBalance pour chaque contrat
    // Note: Ce n'est pas optimal, idéalement on utiliserait useReadContracts
    // Pour l'instant on laisse ce placeholder
    setIsLoading(false);
  }, [address, contractAddresses]);

  return {
    nfts: allNFTs,
    totalBalance,
    isLoading,
  };
}
