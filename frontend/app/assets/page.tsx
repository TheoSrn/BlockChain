'use client';

import { useAccount } from 'wagmi';
import { useFactoryAssets } from '@/hooks/web3/useFactoryAssets';
import Link from 'next/link';
import { useState } from 'react';
import { formatUnits } from 'viem';

export default function AssetsPage() {
  const { isConnected } = useAccount();
  const { assets, isLoading, assetCount } = useFactoryAssets();
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  // Filtrer les assets indésirables
  const filteredAssets = assets.filter(asset => 
    !asset.name.toLowerCase().includes('patate')
  );

  return (
    <div className="page-readable container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Tokenized Assets</h1>
          <p className="text-gray-400">Browse all available tokenized real-world assets on the platform ({filteredAssets.length} displayed)</p>
        </div>
        <Link href="/tokenize/new">
          <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-semibold">
            Create Asset
          </button>
        </Link>
      </div>

      {!isConnected ? (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-6">
          <p className="text-yellow-400">Connect your wallet to view and invest in tokenized assets.</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">Loading assets...</div>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="bg-purple-500/10 border border-purple-500/50 rounded-lg p-6 text-center">
          <p className="text-purple-400 mb-4">No assets created yet</p>
          <Link href="/tokenize/new">
            <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-semibold">
              Create the first asset
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset) => (
            <div key={asset.id.toString()} className="group overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20">
              {/* Image */}
              <div className="relative h-56 w-full overflow-hidden bg-gray-800">
                {asset.imageUrl ? (
                  <img
                    src={asset.imageUrl}
                    alt={asset.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center');
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center text-gray-600">
                      <svg className="mx-auto mb-2 h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">No image</p>
                    </div>
                  </div>
                )}
                {/* Badge Status */}
                <div className="absolute right-3 top-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${
                    asset.active
                      ? 'bg-green-500/90 text-white'
                      : 'bg-gray-500/90 text-white'
                  }`}>
                    {asset.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="mb-4">
                  <h3 className="mb-2 text-xl font-bold text-white">{asset.name}</h3>
                  
                  {/* Informations rapides */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-purple-500/30 px-2 py-1 font-semibold text-purple-300">
                      {asset.symbol}
                    </span>
                    {asset.metadata && (
                      <>
                        {asset.metadata.documents && (
                          <span className="rounded-full bg-purple-500/20 px-2 py-1 text-purple-300">
                            {asset.metadata.documents}
                          </span>
                        )}
                        {asset.metadata.location && (
                          <span className="rounded-full bg-blue-500/20 px-2 py-1 text-blue-300">
                            📍 {asset.metadata.location}
                          </span>
                        )}
                        {asset.metadata.surface > 0 && (
                          <span className="rounded-full bg-green-500/20 px-2 py-1 text-green-300">
                            {asset.metadata.surface.toString()} m²
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-4 space-y-2 border-t border-gray-800 pt-4 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-500">Your Ownership:</span>
                    <span className="font-mono font-semibold text-purple-300">
                      {asset.userBalance !== undefined && asset.totalSupply !== undefined ? (
                        <>
                          {formatUnits(asset.userBalance, 18)} / {formatUnits(asset.totalSupply, 18)}
                        </>
                      ) : (
                        '-- / --'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-500">Token Price:</span>
                    <span className="font-semibold text-blue-400">
                      {asset.totalSupply && asset.totalSupply > 0n && asset.metadata?.estimatedValue ? (
                        `$${(Number(asset.metadata.estimatedValue) / Number(formatUnits(asset.totalSupply, 18))).toFixed(2)}`
                      ) : (
                        '$--'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-500">Your Value:</span>
                    <span className="font-bold text-green-400">
                      {asset.userBalance !== undefined && asset.totalSupply !== undefined && asset.totalSupply > 0n && asset.metadata?.estimatedValue ? (
                        `$${((Number(formatUnits(asset.userBalance, 18)) / Number(formatUnits(asset.totalSupply, 18))) * Number(asset.metadata.estimatedValue)).toFixed(2)}`
                      ) : (
                        '$0.00'
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedAsset(asset)}
                    className="flex-1 rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                  >
                    View Details
                  </button>
                  <button className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700">
                    Trade
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de détails */}
      {selectedAsset && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedAsset(null)}
        >
          <div 
            className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton fermer */}
            <button
              onClick={() => setSelectedAsset(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-gray-800 p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Badge Active en dessous du bouton fermer */}
            <div className="absolute right-4 top-16 z-10">
              <span className={`rounded-full px-4 py-2 text-sm font-semibold backdrop-blur-sm ${
                selectedAsset.active
                  ? 'bg-green-500/90 text-white'
                  : 'bg-gray-500/90 text-white'
              }`}>
                {selectedAsset.active ? '● Active' : '● Inactive'}
              </span>
            </div>

            {/* Image en grand */}
            <div className="relative h-80 w-full overflow-hidden bg-gray-800">
              {selectedAsset.imageUrl ? (
                <img
                  src={selectedAsset.imageUrl}
                  alt={selectedAsset.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center text-gray-600">
                    <svg className="mx-auto mb-2 h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No image available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Contenu */}
            <div className="p-8">
              {/* En-tête */}
              <div className="mb-8">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h2 className="mb-2 text-3xl font-bold text-white">{selectedAsset.name}</h2>
                    <p className="text-lg text-purple-400">{selectedAsset.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Asset ID</p>
                    <p className="text-2xl font-bold text-white">#{selectedAsset.id.toString()}</p>
                  </div>
                </div>
              </div>

              {/* Informations principales */}
              {selectedAsset.metadata && (
                <div className="mb-8">
                  <h3 className="mb-4 text-xl font-bold text-white">Asset Information</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    {selectedAsset.metadata.documents && (
                      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
                        <p className="mb-1 text-sm text-gray-500">Type</p>
                        <p className="text-lg font-semibold text-white">{selectedAsset.metadata.documents}</p>
                      </div>
                    )}
                    {selectedAsset.metadata.location && (
                      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
                        <p className="mb-1 text-sm text-gray-500">Location</p>
                        <p className="text-lg font-semibold text-white">{selectedAsset.metadata.location}</p>
                      </div>
                    )}
                    {selectedAsset.metadata.surface > 0 && (
                      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
                        <p className="mb-1 text-sm text-gray-500">Surface</p>
                        <p className="text-lg font-semibold text-white">{selectedAsset.metadata.surface.toString()} m²</p>
                      </div>
                    )}
                    {selectedAsset.metadata.estimatedValue > 0 && (
                      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
                        <p className="mb-1 text-sm text-gray-500">Estimated Value</p>
                        <p className="text-lg font-semibold text-green-400">${selectedAsset.metadata.estimatedValue.toString()} USD</p>
                      </div>
                    )}
                  </div>
                  {selectedAsset.metadata.description && (
                    <div className="mt-6 rounded-lg border border-gray-800 bg-gray-800/50 p-4">
                      <p className="mb-2 text-sm text-gray-500">Description</p>
                      <p className="text-gray-300">{selectedAsset.metadata.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Contrats & Addresses */}
              <div className="mb-8">
                <h3 className="mb-4 text-xl font-bold text-white">Smart Contracts</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 p-4">
                    <span className="text-sm text-gray-500">ERC20 Token</span>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-gray-900 px-3 py-1 font-mono text-xs text-purple-400">{selectedAsset.token.slice(0, 6)}...{selectedAsset.token.slice(-4)}</code>
                      <a
                        href={`https://sepolia.etherscan.io/address/${selectedAsset.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 p-4">
                    <span className="text-sm text-gray-500">NFT Contract</span>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-gray-900 px-3 py-1 font-mono text-xs text-purple-400">{selectedAsset.nft.slice(0, 6)}...{selectedAsset.nft.slice(-4)}</code>
                      <a
                        href={`https://sepolia.etherscan.io/address/${selectedAsset.nft}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 p-4">
                    <span className="text-sm text-gray-500">Pool Contract</span>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-gray-900 px-3 py-1 font-mono text-xs text-purple-400">{selectedAsset.pool.slice(0, 6)}...{selectedAsset.pool.slice(-4)}</code>
                      <a
                        href={`https://sepolia.etherscan.io/address/${selectedAsset.pool}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button className="flex-1 rounded-lg bg-purple-600 py-3 font-semibold text-white transition-colors hover:bg-purple-700">
                  Trade Now
                </button>
                <a
                  href={`https://sepolia.etherscan.io/address/${selectedAsset.nft}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-lg border border-gray-700 bg-gray-800 py-3 text-center font-semibold text-white transition-colors hover:bg-gray-700"
                >
                  View on Explorer
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
