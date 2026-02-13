'use client';

import { useAccount } from 'wagmi';

export default function AssetsPage() {
  const { isConnected } = useAccount();

  // Données mockées d'assets tokenisés
  const assets = [
    {
      id: '1',
      name: 'Manhattan Real Estate Token',
      symbol: 'RET-NYC',
      type: 'Real Estate',
      price: '$100',
      totalValue: '$5,000,000',
      shares: '50,000',
      apy: '8.5%',
      status: 'Active',
    },
    {
      id: '2',
      name: 'Art Collection Shares',
      symbol: 'ACS',
      type: 'Art',
      price: '$50',
      totalValue: '$2,500,000',
      shares: '50,000',
      apy: '12.3%',
      status: 'Active',
    },
    {
      id: '3',
      name: 'Green Energy Bonds',
      symbol: 'GEB',
      type: 'Renewable Energy',
      price: '$1,000',
      totalValue: '$10,000,000',
      shares: '10,000',
      apy: '6.7%',
      status: 'Active',
    },
    {
      id: '4',
      name: 'Gold-Backed Tokens',
      symbol: 'GBT',
      type: 'Commodities',
      price: '$200',
      totalValue: '$8,000,000',
      shares: '40,000',
      apy: '4.2%',
      status: 'Active',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Tokenized Assets</h1>
        <p className="text-gray-600">Browse all available tokenized real-world assets on the platform</p>
      </div>

      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Connect your wallet to view and invest in tokenized assets.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <div key={asset.id} className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">{asset.name}</h3>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">{asset.status}</span>
                </div>
                <p className="text-gray-600 mb-1">{asset.symbol}</p>
                <p className="text-sm text-gray-500">{asset.type}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per Token:</span>
                  <span className="font-semibold">{asset.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-semibold">{asset.totalValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Shares:</span>
                  <span className="font-semibold">{asset.shares}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">APY:</span>
                  <span className="font-semibold text-green-600">{asset.apy}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  View Details
                </button>
                <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Invest
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
