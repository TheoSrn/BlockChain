'use client';

/**
 * Page Oracle - On-Chain Oracle for Real-World Assets & NFT Collections
 * Provides real-time price feeds for tokenized assets
 */

import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { useState, useEffect, useMemo } from 'react';
import { useOracle, usePriceHistory } from '@/hooks/web3/useOracle';
import { CONTRACT_ADDRESSES, DEFAULT_ASSET_ID } from '@/config/contracts';
import FACTORY_ABI from '@/abi/Factory';

type AssetOption = {
  id: bigint;
  name: string;
  symbol: string;
};

type OracleStats = {
  totalAssets: number;
  lastUpdate: number;
  activeFeeds: number;
};

export default function OraclePage() {
  const { isConnected } = useAccount();
  const [selectedAsset, setSelectedAsset] = useState<bigint>(BigInt(DEFAULT_ASSET_ID));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const factoryAddress = CONTRACT_ADDRESSES.ASSET_FACTORY;
  const hasFactory = factoryAddress !== '0x0000000000000000000000000000000000000000';

  const { data: assetCountData } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'assetCount',
    query: {
      enabled: hasFactory,
      refetchInterval: 10_000,
    },
  });

  const assetCount = Number(assetCountData ?? BigInt(0));
  const assetIds = useMemo(() => {
    if (assetCount > 0) {
      return Array.from({ length: assetCount }, (_, i) => BigInt(i + 1));
    }
    return [BigInt(DEFAULT_ASSET_ID)];
  }, [assetCount]);

  const { data: assetsData } = useReadContracts({
    contracts: assetIds.map((id) => ({
      address: factoryAddress as `0x${string}`,
      abi: FACTORY_ABI,
      functionName: 'getAsset',
      args: [id],
    })),
    query: {
      enabled: hasFactory && assetCount > 0,
      refetchInterval: 10_000,
    },
  });

  const availableAssets: AssetOption[] = useMemo(() => {
    if (!assetsData || assetsData.length === 0) {
      return [
        {
          id: BigInt(DEFAULT_ASSET_ID),
          name: `Asset ${DEFAULT_ASSET_ID}`,
          symbol: `ASSET${DEFAULT_ASSET_ID}`,
        },
      ];
    }

    return assetsData
      .map((result) => {
        if (result.status !== 'success' || !result.result) return null;
        // result.result is an object with properties: id, nft, token, pool, name, symbol, active
        const asset = result.result as any;
        return { 
          id: asset.id || asset[0], 
          name: asset.name || asset[4],
          symbol: asset.symbol || asset[5]
        };
      })
      .filter(Boolean) as AssetOption[];
  }, [assetsData]);

  // Met à jour le timestamp toutes les secondes
  useEffect(() => {
    if (availableAssets.length > 0) {
      setSelectedAsset(availableAssets[0].id);
    }
  }, [availableAssets]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Oracle Information */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">🔮 On-Chain Oracle</h1>
            <p className="text-gray-600 text-lg">
              Real-time price feeds for tokenized real-world assets and NFT collections
            </p>
          </div>
          <div className="bg-green-100 border border-green-300 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-bold text-green-700">Oracle Active</span>
            </div>
          </div>
        </div>

        {/* Oracle Description Card */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-3 text-gray-900">📊 Oracle System Overview</h2>
          <p className="text-gray-700 mb-4">
            This on-chain oracle provides decentralized price data for tokenized real-world assets 
            (such as art, real estate, commodities) and NFT collections. Price data is stored 
            directly on-chain and updated by authorized oracle administrators.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-bold text-sm mb-1">Real-Time Updates</h3>
              <p className="text-xs text-gray-600">Automatic price refresh every 10 seconds</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="font-bold text-sm mb-1">On-Chain Security</h3>
              <p className="text-xs text-gray-600">All price data permanently stored on blockchain</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-bold text-sm mb-1">Multi-Asset Support</h3>
              <p className="text-xs text-gray-600">Tracks prices for multiple RWA tokens & NFTs</p>
            </div>
          </div>
        </div>

        {/* Contract Information */}
        <div className="bg-white border rounded-xl p-6 mb-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <span>📄</span>
            <span>Oracle Smart Contract</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Contract Address</p>
              <p className="font-mono text-sm bg-gray-50 p-2 rounded border break-all">
                {CONTRACT_ADDRESSES.PRICE_ORACLE}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Assets Tracked</p>
              <p className="text-3xl font-bold text-blue-600">
                {availableAssets.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-yellow-800 mb-1">Wallet Connection Required</h3>
              <p className="text-yellow-700 text-sm">
                Connect your wallet to view real-time oracle price feeds for tokenized assets
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Asset Selector */}
      <div className="bg-white border rounded-xl p-6 mb-6">
        <label className="block text-gray-700 mb-3 font-semibold flex items-center gap-2">
          <span>🎨</span>
          <span>Select Real-World Asset or NFT Collection</span>
        </label>
        <select
          value={selectedAsset.toString()}
          onChange={(e) => setSelectedAsset(BigInt(e.target.value))}
          className="w-full border rounded-lg px-4 py-3 text-lg hover:border-blue-400 transition-colors"
        >
          {availableAssets.map((asset) => (
            <option key={asset.id.toString()} value={asset.id.toString()}>
              🏷️ {asset.name} ({asset.symbol}) - Asset ID: {asset.id.toString()}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-2">
          Each asset has its own price feed provided by the on-chain oracle
        </p>
      </div>

      {/* Price Display - Grid of all assets */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>💰</span>
          <span>Live Price Feeds</span>
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {availableAssets.map((asset) => (
            <PriceCard key={asset.id.toString()} asset={asset} />
          ))}
        </div>
      </div>

      {/* Selected Asset Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PriceDetails assetId={selectedAsset} assets={availableAssets} />
        </div>

        <div className="space-y-6">
          {/* Oracle Status */}
          <div className="bg-white border rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>⚙️</span>
              <span>Oracle Status</span>
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Status</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-600 font-semibold">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Refresh Rate</span>
                <span className="font-semibold">10s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Assets Tracked</span>
                <span className="font-semibold text-blue-600">{availableAssets.length}</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <p className="text-xs text-gray-600 mb-1">Contract Address</p>
                <span className="font-mono text-xs bg-gray-50 p-2 rounded block break-all">
                  {CONTRACT_ADDRESSES.PRICE_ORACLE.slice(0, 10)}...
                  {CONTRACT_ADDRESSES.PRICE_ORACLE.slice(-8)}
                </span>
              </div>
            </div>
          </div>

          {/* Oracle Features */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
            <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
              <span>✨</span>
              <span>Oracle Features</span>
            </h3>
            <ul className="text-sm text-purple-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>On-chain price storage for transparency</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Automatic refresh every 10 seconds</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Timestamp verification for data freshness</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Support for RWA tokens & NFT collections</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Role-based access control (RBAC)</span>
              </li>
            </ul>
          </div>

          {/* Use Cases */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <span>💡</span>
              <span>Use Cases</span>
            </h3>
            <div className="text-sm text-blue-800 space-y-3">
              <div>
                <p className="font-semibold mb-1">🏛️ Real Estate Tokens</p>
                <p className="text-xs text-blue-700">Track property valuations for tokenized real estate</p>
              </div>
              <div>
                <p className="font-semibold mb-1">🎨 NFT Collections</p>
                <p className="text-xs text-blue-700">Monitor floor prices and valuations of NFT collections</p>
              </div>
              <div>
                <p className="font-semibold mb-1">💎 Commodities</p>
                <p className="text-xs text-blue-700">Price feeds for tokenized gold, silver, and other assets</p>
              </div>
              <div>
                <p className="font-semibold mb-1">🖼️ Art & Collectibles</p>
                <p className="text-xs text-blue-700">Valuation data for tokenized fine art and collectibles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant pour afficher le prix d'un asset
function PriceCard({ asset }: { asset: AssetOption }) {
  const { priceData, isLoading, error } = useOracle(asset.id);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-2xl mb-2">🏷️</div>
          <h3 className="font-bold text-lg">{asset.symbol}</h3>
          <p className="text-xs text-gray-500">{asset.name}</p>
          <p className="text-xs text-blue-600 mt-1">Asset ID: {asset.id.toString()}</p>
        </div>
        {isLoading && (
          <div className="flex flex-col items-end gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs text-blue-600">Updating...</span>
          </div>
        )}
      </div>

      {error ? (
        <div className="text-center py-4 bg-red-50 rounded-lg">
          <p className="text-red-600 text-sm mb-1">❌ Error</p>
          <p className="text-xs text-gray-500">Price feed unavailable</p>
        </div>
      ) : isLoading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ) : priceData ? (
        <div>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-3">
            <p className="text-xs text-gray-600 mb-1">Current Price</p>
            <p className="text-3xl font-bold text-gray-900">
              {priceData.formattedPrice}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Live feed
            </span>
            {isMounted && (
              <span className="text-gray-500">
                {new Date(priceData.timestamp * 1000).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-400 text-sm">No price data available</p>
          <p className="text-xs text-gray-400 mt-1">Waiting for oracle update</p>
        </div>
      )}
    </div>
  );
}

// Composant détaillé pour l'asset sélectionné
function PriceDetails({ assetId, assets }: { assetId: bigint; assets: AssetOption[] }) {
  const { priceData, isLoading, error } = useOracle(assetId);
  const { history } = usePriceHistory();
  const [timeAgo, setTimeAgo] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  const asset = assets.find((a) => a.id === assetId);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (priceData) {
      const updateTimeAgo = () => {
        const seconds = Math.floor(Date.now() / 1000 - priceData.timestamp);
        if (seconds < 60) setTimeAgo(`${seconds}s ago`);
        else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
        else setTimeAgo(`${Math.floor(seconds / 3600)}h ago`);
      };
      
      updateTimeAgo();
      const interval = setInterval(updateTimeAgo, 1000);
      return () => clearInterval(interval);
    }
  }, [priceData]);

  return (
    <div className="bg-white border rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <span>📈</span>
        <span>{asset?.name} - Detailed Price Feed</span>
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        On-chain oracle data for tokenized real-world asset
      </p>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <p className="text-red-800 font-bold mb-2 text-xl">❌ Oracle Connection Error</p>
          <p className="text-red-600 text-sm mb-4">
            {error.message || 'Failed to fetch oracle data from smart contract'}
          </p>
          <div className="bg-white rounded p-4 text-left">
            <p className="text-xs font-semibold text-gray-700 mb-2">Possible causes:</p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Oracle contract not deployed at address: {CONTRACT_ADDRESSES.PRICE_ORACLE}</li>
              <li>RPC endpoint unavailable or rate limited</li>
              <li>Network connection issues</li>
              <li>Price not set for this asset ID</li>
            </ul>
          </div>
        </div>
      ) : isLoading ? (
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : priceData ? (
        <div>
          {/* Current Price - Main Display */}
          <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl p-6 mb-6 border border-blue-200">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm text-gray-600">Current Market Price</p>
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold text-green-600">LIVE</span>
              </div>
            </div>
            <p className="text-5xl font-bold text-gray-900 mb-3">
              {priceData.formattedPrice}
            </p>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                🕐 Updated {timeAgo}
              </span>
            </div>
          </div>

          {/* Oracle Data Details */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6 border">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <span>🔍</span>
              <span>On-Chain Oracle Data</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <p className="text-xs text-gray-600 mb-1">Raw Price (On-Chain)</p>
                {isMounted ? (
                  <>
                    <p className="font-mono text-sm font-semibold text-blue-600 break-all">
                      {BigInt(priceData.price).toLocaleString('en-US')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      = ${(Number(priceData.price) / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (÷ 10⁶)
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-sm font-semibold text-blue-600 break-all">
                      {priceData.price}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Loading format...</p>
                  </>
                )}
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <p className="text-xs text-gray-600 mb-1">Block Timestamp</p>
                {isMounted ? (
                  <>
                    <p className="font-mono text-sm font-semibold text-purple-600">
                      {priceData.timestamp.toLocaleString('en-US')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Unix timestamp (seconds)</p>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-sm font-semibold text-purple-600">
                      {priceData.timestamp}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Loading format...</p>
                  </>
                )}
              </div>
              <div className="bg-white rounded-lg p-4 border col-span-2">
                <p className="text-xs text-gray-600 mb-1">Last Update (Full)</p>
                {isMounted && (
                  <p className="text-sm font-semibold">
                    📅 {new Date(priceData.timestamp * 1000).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Asset Information */}
          <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-900">
              <span>ℹ️</span>
              <span>Asset Information</span>
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-blue-600 mb-1">Asset Name</p>
                <p className="font-semibold text-blue-900">{asset?.name}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 mb-1">Symbol</p>
                <p className="font-semibold text-blue-900">{asset?.symbol}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 mb-1">Asset ID</p>
                <p className="font-semibold text-blue-900">{assetId.toString()}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 mb-1">Type</p>
                <p className="font-semibold text-blue-900">Real-World Asset (RWA)</p>
              </div>
            </div>
          </div>

          {/* How Oracle Works */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-green-900">
              <span>⚡</span>
              <span>How This Oracle Works</span>
            </h3>
            <ol className="text-sm text-green-800 space-y-2">
              <li className="flex gap-2">
                <span className="font-bold">1.</span>
                <span>Authorized oracle administrators update asset prices on-chain via the Oracle smart contract</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">2.</span>
                <span>Price data is permanently stored on the blockchain with a timestamp</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">3.</span>
                <span>This frontend queries the Oracle contract every 10 seconds via RPC</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">4.</span>
                <span>The price feed can be used by other smart contracts for DeFi operations, trading, and valuations</span>
              </li>
            </ol>
          </div>

          {/* Price History */}
          {history && history.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <span>📊</span>
                <span>Recent Price History</span>
              </h3>
              <div className="space-y-2">
                {history.slice(0, 5).map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-50 rounded p-3 text-sm border hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-semibold">${parseFloat(item.price).toFixed(2)}</span>
                    {isMounted && (
                      <span className="text-gray-600 text-xs">
                        {new Date(item.timestamp * 1000).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-400 text-lg mb-2">⏳ No price data available</p>
          <p className="text-sm text-gray-500">This asset has not been priced yet by the oracle</p>
        </div>
      )}
    </div>
  );
}
