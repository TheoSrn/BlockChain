'use client';

import { useAccount } from 'wagmi';

export default function AnalyticsPage() {
  const { address, isConnected } = useAccount();

  // Données mockées d'analytics
  const stats = [
    { label: 'Total Portfolio Value', value: '$25,430', change: '+12.5%', positive: true },
    { label: 'Total Invested', value: '$20,000', change: null, positive: null },
    { label: 'Total Profit', value: '$5,430', change: '+27.2%', positive: true },
    { label: 'Active Assets', value: '8', change: '+2', positive: true },
  ];

  const performanceData = [
    { asset: 'RET-NYC', invested: '$5,000', current: '$6,250', profit: '+25%', allocation: '25%' },
    { asset: 'ACS', invested: '$3,000', current: '$4,200', profit: '+40%', allocation: '17%' },
    { asset: 'GEB', invested: '$8,000', current: '$9,100', profit: '+13.75%', allocation: '36%' },
    { asset: 'Others', invested: '$4,000', current: '$5,880', profit: '+47%', allocation: '22%' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Portfolio Analytics</h1>

      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Please connect your wallet to view analytics.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white border rounded-lg p-6">
                <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                {stat.change && (
                  <p className={`text-sm ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Performance Chart Placeholder */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Portfolio Performance</h2>
            <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-500">Chart visualization will be integrated with Chart.js</p>
            </div>
          </div>

          {/* Asset Performance Table */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-2xl font-bold">Asset Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Asset</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Invested</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Current Value</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Profit/Loss</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {performanceData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{item.asset}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.invested}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{item.current}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="text-green-600 font-semibold">{item.profit}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.allocation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
