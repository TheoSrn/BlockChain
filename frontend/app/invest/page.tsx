'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function InvestPage() {
  const { address, isConnected } = useAccount();
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  // Données mockées d'assets disponibles à l'investissement
  const availableAssets = [
    { id: '1', name: 'Real Estate Token NYC', symbol: 'RET-NYC', apy: '8.5%', minInvest: '1000', price: '100' },
    { id: '2', name: 'Art Collection Shares', symbol: 'ACS', apy: '12.3%', minInvest: '500', price: '50' },
    { id: '3', name: 'Green Energy Bonds', symbol: 'GEB', apy: '6.7%', minInvest: '2000', price: '1000' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Invest in Tokenized Assets</h1>

      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Please connect your wallet to view investment opportunities.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedAsset(asset.id)}
              >
                <h3 className="text-xl font-bold mb-2">{asset.name}</h3>
                <p className="text-gray-600 mb-4">{asset.symbol}</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">APY:</span>
                    <span className="font-semibold text-green-600">{asset.apy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold">${asset.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min. Investment:</span>
                    <span className="font-semibold">${asset.minInvest}</span>
                  </div>
                </div>
                <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Invest Now
                </button>
              </div>
            ))}
          </div>

          {selectedAsset && (
            <div className="bg-white border rounded-lg p-6 mt-6">
              <h2 className="text-2xl font-bold mb-4">Investment Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Amount (USD)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Enter amount"
                  />
                </div>
                <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold">
                  Confirm Investment
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
