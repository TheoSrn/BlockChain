'use client';

/**
 * Page Dashboard - Vue d'ensemble de l'utilisateur
 * Affiche soldes ERC20, NFTs ERC721, valeur estimée, transactions indexer
 * ➕ Synchronisation on-chain en temps réel
 */

import { useAccount, useReadContract } from 'wagmi';
import Link from 'next/link';
import { useTokenBalances } from '@/hooks/web3/useTokenBalances';
import { useNFTBalance } from '@/hooks/web3/useNFTs';
import { useIndexer, useUserActivity } from '@/hooks/web3/useIndexer';
import { CONTRACT_ADDRESSES, DEFAULT_ASSET_ID } from '@/config/contracts';
import { IndexerSyncService, EventType } from '@/services/indexer/indexer';
import FACTORY_ABI from '@/abi/Factory';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  const factoryAddress = CONTRACT_ADDRESSES.ASSET_FACTORY;
  const hasFactory = factoryAddress !== '0x0000000000000000000000000000000000000000';
  const assetId = BigInt(DEFAULT_ASSET_ID);

  const { data: assetRecord } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'getAsset',
    args: [assetId],
    query: {
      enabled: hasFactory,
      refetchInterval: 10_000,
    },
  });

  const assetTokenAddress = assetRecord ? (assetRecord as any[])[2] as string : undefined;
  const assetNftAddress = assetRecord ? (assetRecord as any[])[1] as string : undefined;

  // Récupérer les balances des tokens ERC20
  const tokenAddresses = [
    CONTRACT_ADDRESSES.USDC,
    CONTRACT_ADDRESSES.USDT,
    assetTokenAddress,
    // Ajouter d'autres tokens ici
  ].filter(addr => addr && addr !== '0x0000000000000000000000000000000000000000') as string[];

  const { balances, totalUsdValue, isLoading: isLoadingBalances } = useTokenBalances(tokenAddresses);

  // Récupérer les NFTs ERC721 (Asset Registry)
  const assetRegistryAddress = assetNftAddress && assetNftAddress !== '0x0000000000000000000000000000000000000000'
    ? assetNftAddress
    : undefined;

  const {
    balance: nftBalance,
    nfts,
    isLoading: isLoadingNFTs,
    name: nftCollectionName,
  } = useNFTBalance(assetRegistryAddress);

  // Récupérer les dernières transactions avec le nouveau hook useIndexer
  const {
    events,
    isLoading: isLoadingEvents,
    isConnected: isIndexerConnected,
    totalEvents,
    lastUpdate,
  } = useIndexer({
    eventTypes: 'ALL',
    userOnly: true,
    maxEvents: 20,
  });

  // Statistiques d'activité utilisateur
  const { summary: activitySummary } = useUserActivity();

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-12 text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-800">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to access your dashboard</p>
        </div>
      </div>
    );
  }

  // Calculer les stats
  const totalTokens = balances.length;
  const totalNFTs = Number(nftBalance);
  const portfolioValue = parseFloat(totalUsdValue);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <div className="bg-white border rounded-lg p-6">
          <p className="text-gray-600 text-sm mb-2">Portfolio Value</p>
          <p className="text-3xl font-bold">
            {isLoadingBalances ? (
              <span className="animate-pulse text-gray-300">...</span>
            ) : (
              `$${portfolioValue.toFixed(2)}`
            )}
          </p>
          <p className="text-green-600 text-sm mt-1">
            {portfolioValue > 0 ? '↗ Active' : '—'}
          </p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <p className="text-gray-600 text-sm mb-2">ERC20 Tokens</p>
          <p className="text-3xl font-bold">
            {isLoadingBalances ? (
              <span className="animate-pulse text-gray-300">...</span>
            ) : (
              totalTokens
            )}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {balances.filter(b => parseFloat(b.formattedBalance) > 0).length} with balance
          </p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <p className="text-gray-600 text-sm mb-2">NFTs Owned</p>
          <p className="text-3xl font-bold">
            {isLoadingNFTs ? (
              <span className="animate-pulse text-gray-300">...</span>
            ) : (
              totalNFTs
            )}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {nftCollectionName || 'ERC721 Assets'}
          </p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <p className="text-gray-600 text-sm mb-2">Recent Events</p>
          <p className="text-3xl font-bold">
            {isLoadingEvents ? (
              <span className="animate-pulse text-gray-300">...</span>
            ) : (
              totalEvents
            )}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className={`h-2 w-2 rounded-full ${isIndexerConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <p className="text-gray-500 text-sm">
              {isIndexerConnected ? 'Live' : 'Polling'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* ERC20 Token Balances */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">ERC20 Token Balances</h2>
              <Link href="/portfolio" className="text-blue-600 hover:text-blue-700 text-sm">
                View All →
              </Link>
            </div>

            {isLoadingBalances ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : balances.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No ERC20 tokens configured</p>
                <p className="text-sm mt-2">Add token addresses in .env.local</p>
              </div>
            ) : (
              <div className="space-y-3">
                {balances.map((token) => (
                  <div
                    key={token.address}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{token.symbol}</p>
                        <span className="text-xs text-gray-500">{token.name}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Balance: {parseFloat(token.formattedBalance).toFixed(4)}
                      </p>
                    </div>
                    {token.usdValue && (
                      <div className="text-right">
                        <p className="font-semibold text-lg">${token.usdValue}</p>
                        <p className="text-xs text-gray-500">USD Value</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NFTs Section */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">NFT Assets (ERC721)</h2>
              <Link href="/portfolio" className="text-blue-600 hover:text-blue-700 text-sm">
                View All →
              </Link>
            </div>

            {isLoadingNFTs ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 bg-gray-200 rounded-lg mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : !assetRegistryAddress ? (
              <div className="text-center py-8 text-gray-500">
                <p>No NFT contract configured</p>
                <p className="text-sm mt-2">Add ASSET_FACTORY and DEFAULT_ASSET_ID in .env.local</p>
              </div>
            ) : nfts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No NFTs owned</p>
                <p className="text-sm mt-2">Start by tokenizing your first asset</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {nfts.slice(0, 6).map((nft) => (
                  <div
                    key={`${nft.contractAddress}-${nft.tokenId}`}
                    className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg h-32 mb-3 flex items-center justify-center">
                      <p className="text-4xl font-bold text-purple-600">#{nft.tokenId.toString()}</p>
                    </div>
                    <p className="font-semibold text-sm truncate">{nft.symbol}</p>
                    <p className="text-xs text-gray-500">Token ID: {nft.tokenId.toString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/tokenize/new"
                className="block bg-blue-600 text-white px-4 py-3 rounded-lg text-center font-semibold hover:bg-blue-700 transition-colors"
              >
                Tokenize Asset
              </Link>
              <Link
                href="/trade"
                className="block border border-blue-600 text-blue-600 px-4 py-3 rounded-lg text-center font-semibold hover:bg-blue-50 transition-colors"
              >
                Trade
              </Link>
              <Link
                href="/assets"
                className="block border border-gray-300 text-gray-700 px-4 py-3 rounded-lg text-center font-semibold hover:bg-gray-50 transition-colors"
              >
                Browse Assets
              </Link>
            </div>
          </div>

          {/* Indexer Events - Synchronisation temps réel */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Recent Transactions</h3>
              {isIndexerConnected && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-600 font-semibold">Live</span>
                </div>
              )}
            </div>

            {/* Activity Summary */}
            {activitySummary && (
              <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Swaps</p>
                  <p className="text-lg font-bold text-blue-600">{activitySummary.swaps}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Transfers</p>
                  <p className="text-lg font-bold text-green-600">{activitySummary.transfers}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Mints</p>
                  <p className="text-lg font-bold text-purple-600">{activitySummary.mints}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Burns</p>
                  <p className="text-lg font-bold text-red-600">{activitySummary.burns}</p>
                </div>
              </div>
            )}

            {isLoadingEvents ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">No recent transactions</p>
                <p className="text-xs mt-1">
                  {isIndexerConnected 
                    ? 'Waiting for on-chain events...' 
                    : 'Indexer not available'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {events.slice(0, 10).map((event) => {
                  const formatted = IndexerSyncService.formatEvent(event);
                  return (
                    <div
                      key={event.id}
                      className={`border-l-4 border-${formatted.color}-500 pl-3 py-2 hover:bg-gray-50 rounded transition-colors`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{formatted.icon}</span>
                            <p className="font-semibold text-sm">{formatted.title}</p>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{formatted.description}</p>
                          <p className="text-xs text-gray-500 font-mono truncate">
                            {event.transactionHash.slice(0, 10)}...{event.transactionHash.slice(-8)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400 block">
                            {lastUpdate && new Date(event.timestamp * 1000).toLocaleTimeString()}
                          </span>
                          <span className="text-xs text-gray-400">
                            #{event.blockNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {lastUpdate && (
              <div className="mt-4 pt-3 border-t text-xs text-gray-500 text-center">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
