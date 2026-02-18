'use client';

import { useAccount } from 'wagmi';
import { useFactoryAssets } from '@/hooks/web3/useFactoryAssets';
import Link from 'next/link';

export default function AssetsPage() {
  const { isConnected } = useAccount();
  const { assets, isLoading, assetCount } = useFactoryAssets();

  return (
    <div className="page-readable container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Tokenized Assets</h1>
          <p className="text-gray-600">Browse all available tokenized real-world assets on the platform ({assetCount} total)</p>
        </div>
        <Link href="/tokenize/new">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Create Asset
          </button>
        </Link>
      </div>

      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Connect your wallet to view and invest in tokenized assets.</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading assets...</div>
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800 mb-4">No assets created yet</p>
          <Link href="/tokenize/new">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Create the first asset
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <div key={asset.id.toString()} className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">{asset.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    asset.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {asset.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-gray-600 mb-1">{asset.symbol}</p>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID:</span>
                  <span className="font-mono font-semibold">{asset.id.toString()}</span>
                </div>
                <div className="flex justify-between break-all">
                  <span className="text-gray-600">Token:</span>
                  <span className="font-mono text-xs">{asset.token.slice(0, 10)}...</span>
                </div>
                <div className="flex justify-between break-all">
                  <span className="text-gray-600">NFT:</span>
                  <span className="font-mono text-xs">{asset.nft.slice(0, 10)}...</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  View Details
                </button>
                <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                  Trade
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
