'use client';

import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { useTransactions } from '@/hooks/web3/useTransactions';

export default function TransactionsPage() {
  const { address, isConnected } = useAccount();
  const { transactions, isLoading } = useTransactions();

  const formatAmount = (amount: bigint) => {
    const formatted = formatUnits(amount, 18);
    const numeric = Number(formatted);
    if (Number.isNaN(numeric)) return '0';
    return numeric.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    });
  };

  const shortAddress = (value: string) => {
    if (!value) return '—';
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  };

  return (
    <div className="page-readable container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Transaction History</h1>

      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            Please connect your wallet to view your transactions.
          </p>
        </div>
      ) : isLoading ? (
        <div className="bg-white border rounded-lg p-6">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No transactions yet.</p>
          <p className="text-gray-400 mt-2">Your transaction history will appear here.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hash</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Counterparty</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((tx) => {
                  const isOutgoing =
                    address && tx.from?.toLowerCase() === address.toLowerCase();
                  return (
                    <tr key={tx.hash} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(tx.timestamp * 1000).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                            isOutgoing
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {isOutgoing ? 'Sent' : 'Received'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">
                        {shortAddress(tx.hash)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {shortAddress(isOutgoing ? tx.to : tx.from)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        {formatAmount(tx.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                            tx.status === 'SUCCESS'
                              ? 'bg-blue-100 text-blue-800'
                              : tx.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
