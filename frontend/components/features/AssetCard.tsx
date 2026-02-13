'use client';

/**
 * Composant de carte pour afficher un actif tokenisé
 */

import { formatUnits } from 'viem';
import type { TokenizedAsset } from '@/types';

interface AssetCardProps {
  asset: TokenizedAsset;
  onClick?: () => void;
}

export function AssetCard({ asset, onClick }: AssetCardProps) {
  const formattedValue = formatUnits(asset.valueUSD, 6); // Assuming 6 decimals for USD

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-purple-500/50 hover:bg-gray-900"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{asset.name}</h3>
          <p className="text-sm text-gray-400">{asset.symbol}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            asset.isActive
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}
        >
          {asset.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Value */}
      <div className="mb-4">
        <p className="text-sm text-gray-400">Total Value</p>
        <p className="text-2xl font-bold text-white">${formattedValue}</p>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
        <div>
          <p className="text-xs text-gray-500">Type</p>
          <p className="text-sm font-medium text-gray-300">{asset.assetType}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Supply</p>
          <p className="text-sm font-medium text-gray-300">
            {formatUnits(asset.totalSupply, 18)}
          </p>
        </div>
      </div>

      {/* Hover indicator */}
      <div className="mt-4 flex items-center justify-end opacity-0 transition-opacity group-hover:opacity-100">
        <span className="text-sm text-purple-400">View Details →</span>
      </div>
    </div>
  );
}
