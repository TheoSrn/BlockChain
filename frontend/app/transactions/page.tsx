'use client';

import { useAccount } from 'wagmi';

export default function TransactionsPage() {
  const { address, isConnected } = useAccount();

  // Données mockées de transactions
  const transactions = [
    { id: '1', type: 'Buy', asset: 'RET-NYC', amount: '10', price: '$100', total: '$1,000', date: '2026-02-10', status: 'Completed' },
    { id: '2', type: 'Sell', asset: 'ACS', amount: '5', price: '$50', total: '$250', date: '2026-02-09', status: 'Completed' },
    { id: '3', type: 'Buy', asset: 'GEB', amount: '2', price: '$1,000', total: '$2,000', date: '2026-02-08', status: 'Pending' },
    { id: '4', type: 'Buy', asset: 'RET-NYC', amount: '15', price: '$95', total: '$1,425', date: '2026-02-07', status: 'Completed' },
  ];

  return (
    <div className="page-readable container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Transaction History</h1>

      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Please connect your wallet to view your transactions.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Asset</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{tx.date}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                          tx.type === 'Buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{tx.asset}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tx.amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tx.price}</td>
                    <td className="px-6 py-4 text-sm font-semibold">{tx.total}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                          tx.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isConnected && transactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No transactions yet.</p>
          <p className="text-gray-400 mt-2">Your transaction history will appear here.</p>
        </div>
      )}
    </div>
  );
}
