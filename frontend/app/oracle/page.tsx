'use client';

/**
 * Page Oracle - Prix en temps réel avec rafraîchissement automatique
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

export default function OraclePage() {
  const { isConnected } = useAccount();
  const [selectedAsset, setSelectedAsset] = useState<bigint>(BigInt(DEFAULT_ASSET_ID));

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

  const assetCount = Number(assetCountData ?? 0n);
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
        if (result.status !== 'success') return null;
        const [id, , , , name, symbol] = result.result as unknown as [
          bigint,
          string,
          string,
          string,
          string,
          string,
          boolean
        ];
        return { id, name, symbol };
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Oracle & Price Feeds</h1>
        <p className="text-gray-600">
          Real-time on-chain pricing data with automatic refresh
        </p>
      </div>

      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-yellow-800 mb-1">Wallet Not Connected</h3>
              <p className="text-yellow-700 text-sm">
                Connect your wallet to view real-time oracle data
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Asset Selector */}
      <div className="bg-white border rounded-xl p-6 mb-6">
        <label className="block text-gray-700 mb-3 font-semibold">Select Asset</label>
        <select
          value={selectedAsset.toString()}
          onChange={(e) => setSelectedAsset(BigInt(e.target.value))}
          className="w-full border rounded-lg px-4 py-3 text-lg"
        >
          {availableAssets.map((asset) => (
            <option key={asset.id.toString()} value={asset.id.toString()}>
              {asset.name} ({asset.symbol})
            </option>
          ))}
        </select>
      </div>

      {/* Price Display - Uses multiple components for each asset */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {availableAssets.map((asset) => (
          <PriceCard key={asset.id.toString()} asset={asset} />
        ))}
      </div>

      {/* Selected Asset Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PriceDetails assetId={selectedAsset} assets={availableAssets} />
        </div>

        <div className="space-y-6">
          {/* Oracle Status */}
          <div className="bg-white border rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">Oracle Status</h3>
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
                <span className="text-gray-600 text-sm">Contract</span>
                <span className="font-mono text-xs">
                  {CONTRACT_ADDRESSES.PRICE_ORACLE.slice(0, 6)}...
                  {CONTRACT_ADDRESSES.PRICE_ORACLE.slice(-4)}
                </span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-blue-800 mb-2">How it works</h3>
            <p className="text-sm text-blue-700 mb-3">
              The oracle smart contract fetches real-time prices from on-chain sources every 10 seconds.
            </p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Auto-refresh every 10s</li>
              <li>Timestamp verification</li>
              <li>Fallback on RPC errors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant pour afficher le prix d'un asset
function PriceCard({ asset }: { asset: AssetOption }) {
  const { priceData, isLoading, error } = useOracle(asset.id);

  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg">{asset.symbol}</h3>
          <p className="text-xs text-gray-500">{asset.name}</p>
        </div>
        {isLoading && (
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        )}
      </div>

      {error ? (
        <div className="text-center py-4">
          <p className="text-red-600 text-sm mb-1">❌ Error</p>
          <p className="text-xs text-gray-500">Oracle not deployed</p>
        </div>
      ) : isLoading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ) : priceData ? (
        <div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {priceData.formattedPrice}
          </p>
          <p className="text-xs text-gray-500">
            Updated: {new Date(priceData.timestamp * 1000).toLocaleTimeString()}
          </p>
        </div>
      ) : (
        <p className="text-gray-400 text-sm">No data available</p>
      )}
    </div>
  );
}

// Composant détaillé pour l'asset sélectionné
function PriceDetails({ assetId, assets }: { assetId: bigint; assets: AssetOption[] }) {
  const { priceData, isLoading, error } = useOracle(assetId);
  const { history } = usePriceHistory();
  const [timeAgo, setTimeAgo] = useState('');

  const asset = assets.find((a) => a.id === assetId);

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
      <h2 className="text-2xl font-bold mb-6">
        {asset?.name} Price Details
      </h2>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <p className="text-red-800 font-bold mb-2">❌ Connection Error</p>
          <p className="text-red-600 text-sm mb-4">
            {error.message || 'Failed to fetch oracle data'}
          </p>
          <div className="bg-white rounded p-4 text-left">
            <p className="text-xs font-semibold text-gray-700 mb-2">Possible causes:</p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Oracle contract not deployed (0x0000...)</li>
              <li>RPC endpoint unavailable</li>
              <li>Network connection issues</li>
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
          {/* Current Price */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Current Price</p>
            <p className="text-5xl font-bold text-gray-900 mb-3">
              {priceData.formattedPrice}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
              <span>•</span>
              <span>Updated {timeAgo}</span>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Raw Price</p>
              <p className="font-mono text-sm font-semibold">
                {priceData.price}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Timestamp</p>
              <p className="font-mono text-sm font-semibold">
                {priceData.timestamp}
              </p>
            </div>
          </div>

          {/* Full Timestamp */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-600 mb-2">Last Update</p>
            <p className="text-sm font-semibold">
              {new Date(priceData.timestamp * 1000).toLocaleString()}
            </p>
          </div>

          {/* Price History */}
          {history && history.length > 0 && (
            <div>
              <h3 className="font-bold mb-3">Recent Price History</h3>
              <div className="space-y-2">
                {history.slice(0, 5).map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-50 rounded p-3 text-sm"
                  >
                    <span className="font-semibold">${parseFloat(item.price).toFixed(2)}</span>
                    <span className="text-gray-600 text-xs">
                      {new Date(item.timestamp * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400">No price data available</p>
        </div>
      )}
    </div>
  );
}
