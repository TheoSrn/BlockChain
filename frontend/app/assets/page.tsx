'use client';

import { useAccount, useReadContract } from 'wagmi';
import { useFactoryAssets } from '@/hooks/web3/useFactoryAssets';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { formatUnits, Address } from 'viem';

// NFT Ownership Verification Component
function UniqueAssetCardWithOwnership({ 
  asset, 
  userAddress, 
  onViewDetails 
}: { 
  asset: any; 
  userAddress: Address;
  onViewDetails: (asset: any) => void;
}) {
  const tokenId = BigInt(asset.id);
  const nftAddress = asset.nft as Address;

  // Verify NFT ownership with ownerOf
  const { data: nftOwner, refetch: refetchOwner } = useReadContract({
    address: nftAddress,
    abi: [
      {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "ownerOf",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'ownerOf',
    args: [tokenId],
    query: {
      enabled: !!nftAddress && !!tokenId,
      refetchInterval: 3_000, // Refetch every 3 seconds
      refetchOnMount: 'always',
      staleTime: 0,
    }
  });

  const nftOwnerAddress = nftOwner ? (nftOwner as Address).toLowerCase() : null;
  const isOwnedByUser = nftOwnerAddress === userAddress?.toLowerCase();

  // Debug logs
  useEffect(() => {
    if (nftOwnerAddress) {
      console.log(`[Assets Page] NFT #${asset.id} (${asset.symbol}):`, {
        owner: nftOwnerAddress,
        userAddress: userAddress?.toLowerCase(),
        isOwnedByUser,
      });
    }
  }, [nftOwnerAddress, userAddress, isOwnedByUser, asset.id, asset.symbol]);

  // Helper pour extraire le payment token
  const getPaymentToken = (documents: string) => {
    if (!documents) return '';
    const parts = documents.split('|').map(p => p.trim());
    if (parts.length >= 2 && (parts[0] === 'DIVISIBLE' || parts[0] === 'UNIQUE')) {
      return parts[1];
    }
    return '';
  };

  const paymentToken = getPaymentToken(asset.metadata?.documents || '');

  return (
    <div className="group overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20">
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
            <span className="rounded-full px-2 py-1 text-xs font-semibold bg-yellow-500/20 text-yellow-300">
              💎 Unique NFT
            </span>
            {asset.metadata?.location && (
              <span className="rounded-full bg-blue-500/20 px-2 py-1 text-blue-300">
                📍 {asset.metadata.location}
              </span>
            )}
            {asset.metadata?.surface > 0 && (
              <span className="rounded-full bg-green-500/20 px-2 py-1 text-green-300">
                {asset.metadata.surface.toString()} m²
              </span>
            )}
          </div>
        </div>

        {/* NFT Ownership Information */}
        <div className="mb-4 space-y-2 border-t border-gray-800 pt-4 text-xs">
          <div className="flex justify-between items-baseline">
            <span className="text-gray-500">Asset Value:</span>
            <span className="font-bold text-green-400">
              {asset.metadata?.estimatedValue ? (
                <>
                  ${Number(asset.metadata.estimatedValue).toLocaleString()}
                  {paymentToken && (
                    <span className="ml-1 text-xs text-gray-400">({paymentToken})</span>
                  )}
                </>
              ) : (
                '$--'
              )}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-gray-500">Ownership:</span>
            <span className={`font-semibold ${
              isOwnedByUser 
                ? 'text-green-400' 
                : 'text-gray-400'
            }`}>
              {isOwnedByUser ? '✓ Owned' : '✗ Not Owned'}
            </span>
          </div>
          {nftOwnerAddress && (
            <div className="mt-2 rounded-lg bg-blue-500/10 border border-blue-500/20 p-2">
              <p className="text-xs text-blue-400 mb-1">
                <span className="font-semibold">🔍 Current Owner:</span>
              </p>
              <code className="text-[10px] text-blue-300 break-all">
                {nftOwnerAddress}
              </code>
              {isOwnedByUser && (
                <p className="text-xs text-green-400 mt-1 font-semibold">
                  🎉 This is you!
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => onViewDetails(asset)}
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
  );
}

export default function AssetsPage() {
  const { isConnected, address: userAddress } = useAccount();
  const { assets, isLoading, assetCount, refetchCount } = useFactoryAssets();
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtrer les assets indésirables
  const filteredAssets = assets.filter(asset => 
    !asset.name.toLowerCase().includes('patate')
  );

  // Helper pour extraire le token type du champ documents (format: "DIVISIBLE|USDC" ou "UNIQUE|WETH")
  const getTokenType = (documents: string) => {
    if (!documents) return '';
    // Si c'est le nouveau format avec payment token, extraire la première partie
    const parts = documents.split('|').map(p => p.trim());
    const tokenType = parts[0];
    // Si c'est le nouveau format, retourner directement
    if (tokenType === 'DIVISIBLE' || tokenType === 'UNIQUE') return tokenType;
    // Sinon retourner tel quel (ancien format)
    return documents;
  };

  // Helper pour extraire le payment token du champ documents
  const getPaymentToken = (documents: string) => {
    if (!documents) return '';
    const parts = documents.split('|').map(p => p.trim());
    // Si on a au moins 2 parties et que la première est un token type valide
    if (parts.length >= 2 && (parts[0] === 'DIVISIBLE' || parts[0] === 'UNIQUE')) {
      return parts[1]; // USDC, USDT, ou WETH
    }
    return ''; // Pas de payment token spécifié
  };

  // Séparer les assets par type
  const divisibleAssets = filteredAssets.filter(asset => {
    const tokenType = getTokenType(asset.metadata?.documents || '');
    return tokenType === 'DIVISIBLE';
  });

  const uniqueAssets = filteredAssets.filter(asset => {
    const tokenType = getTokenType(asset.metadata?.documents || '');
    return tokenType === 'UNIQUE';
  });

  // Composant de rendu pour une carte d'asset
  const renderAssetCard = (asset: any) => {
    const tokenType = getTokenType(asset.metadata?.documents || '');
    const paymentToken = getPaymentToken(asset.metadata?.documents || '');
    const isDivisible = tokenType === 'DIVISIBLE';
    const isUnique = tokenType === 'UNIQUE';

    return (
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
                  {asset.metadata.documents && (() => {
                    const tokenType = getTokenType(asset.metadata.documents);
                    return (
                      <>
                        {tokenType && (
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            tokenType === 'DIVISIBLE' 
                              ? 'bg-blue-500/20 text-blue-300' 
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {tokenType === 'DIVISIBLE' ? '🔹 Divisible' : '💎 Unique NFT'}
                          </span>
                        )}
                      </>
                    );
                  })()}
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

          {/* Affichage différent selon le type */}
          {isDivisible ? (
            // Fractional Properties (DIVISIBLE)
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
                  {asset.metadata?.estimatedValue ? (
                    <>
                      ${Number(asset.metadata.estimatedValue).toLocaleString()}
                      {paymentToken && (
                        <span className="ml-1 text-xs text-gray-400">({paymentToken})</span>
                      )}
                    </>
                  ) : (
                    '$--'
                  )}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-gray-500">Your Share Value:</span>
                <span className="font-bold text-green-400">
                  {asset.userBalance !== undefined && asset.metadata?.estimatedValue ? (
                    `$${(Number(formatUnits(asset.userBalance, 18)) * Number(asset.metadata.estimatedValue)).toFixed(2)}`
                  ) : (
                    '$0.00'
                  )}
                </span>
              </div>
            </div>
          ) : isUnique ? (
            // Exclusive Properties (UNIQUE)
            <div className="mb-4 space-y-2 border-t border-gray-800 pt-4 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-500">Asset Value:</span>
                <span className="font-bold text-green-400">
                  {asset.metadata?.estimatedValue ? (
                    <>
                      ${Number(asset.metadata.estimatedValue).toLocaleString()}
                      {paymentToken && (
                        <span className="ml-1 text-xs text-gray-400">({paymentToken})</span>
                      )}
                    </>
                  ) : (
                    '$--'
                  )}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-gray-500">Ownership:</span>
                <span className={`font-semibold ${
                  asset.userBalance && asset.userBalance > BigInt(0) 
                    ? 'text-green-400' 
                    : 'text-gray-400'
                }`}>
                  {asset.userBalance && asset.userBalance > BigInt(0) ? '✓ Owned' : '✗ Not Owned'}
                </span>
              </div>
            </div>
          ) : (
            // Fallback pour les anciens assets
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
            </div>
          )}

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
    );
  };

  return (
    <div className="page-readable container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Tokenized Assets</h1>
          <p className="text-gray-400">
            {filteredAssets.length} total assets - 
            <span className="text-blue-400 ml-1">{divisibleAssets.length} fractional</span> & 
            <span className="text-yellow-400 ml-1">{uniqueAssets.length} exclusive</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={async () => {
              setIsRefreshing(true);
              await refetchCount();
              setTimeout(() => setIsRefreshing(false), 1000);
            }}
            disabled={isRefreshing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link href="/tokenize/new">
            <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-semibold">
              Create Asset
            </button>
          </Link>
        </div>
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
        <div className="space-y-12">
          {/* Section Divisible Assets (Shares) */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">🏢 Fractional Properties</h2>
                <p className="text-sm text-gray-400">Real estate divided into tradeable shares (ERC-20) - {divisibleAssets.length} available</p>
              </div>
            </div>
            
            {divisibleAssets.length === 0 ? (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-6 text-center">
                <p className="text-blue-400">No fractional properties created yet</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {divisibleAssets.map(renderAssetCard)}
              </div>
            )}
          </div>

          {/* Section Unique NFTs */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-yellow-500/10 p-2">
                <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">🏡 Exclusive Properties</h2>
                <p className="text-sm text-gray-400">Whole properties with single ownership (ERC-721) - {uniqueAssets.length} available</p>
              </div>
            </div>
            
            {uniqueAssets.length === 0 ? (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-6 text-center">
                <p className="text-yellow-400">No exclusive properties created yet</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {uniqueAssets.map(asset => (
                  <UniqueAssetCardWithOwnership 
                    key={asset.id.toString()} 
                    asset={asset} 
                    userAddress={userAddress as Address}
                    onViewDetails={setSelectedAsset}
                  />
                ))}
              </div>
            )}
          </div>
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
                    {selectedAsset.metadata.documents && (() => {
                      const tokenType = getTokenType(selectedAsset.metadata.documents);
                      return (
                        <>
                          {tokenType && (
                            <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
                              <p className="mb-1 text-sm text-gray-500">Token Type</p>
                              <p className={`text-lg font-semibold ${
                                tokenType === 'DIVISIBLE' ? 'text-blue-400' : 'text-yellow-400'
                              }`}>
                                {tokenType === 'DIVISIBLE' ? '🔹 Divisible (ERC-20)' : '💎 Unique NFT (ERC-721)'}
                              </p>
                              <p className="mt-1 text-xs text-gray-400">
                                {tokenType === 'DIVISIBLE' 
                                  ? 'Can be divided into multiple shares' 
                                  : 'Single indivisible asset'}
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}
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
                        <p className="mb-1 text-sm text-gray-500">Price</p>
                        <p className="text-lg font-semibold text-green-400">
                          ${Number(selectedAsset.metadata.estimatedValue).toLocaleString()}
                          {(() => {
                            const paymentToken = getPaymentToken(selectedAsset.metadata?.documents || '');
                            return paymentToken ? (
                              <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
                                {paymentToken}
                              </span>
                            ) : null;
                          })()}
                        </p>
                        {(() => {
                          const paymentToken = getPaymentToken(selectedAsset.metadata?.documents || '');
                          return paymentToken ? (
                            <p className="mt-1 text-xs text-gray-400">
                              Investors pay in {paymentToken} to purchase tokens
                            </p>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                  {selectedAsset.metadata.description && (
                    <div className="mt-6 rounded-lg border border-gray-800 bg-gray-800/50 p-4">
                      <p className="mb-2 text-sm text-gray-500">Description</p>
                      <p className="text-gray-300 whitespace-pre-line">{selectedAsset.metadata.description}</p>
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
