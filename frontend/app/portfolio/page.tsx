'use client';

/**
 * Page Portfolio - Affiche les investissements de l'utilisateur
 */

import { useAccount } from 'wagmi';
import { ComplianceStatus } from '@/components/features/ComplianceStatus';

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-12 text-center">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400">
            Please connect your wallet to view your portfolio
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-white">My Portfolio</h1>
        <p className="text-sm text-gray-400">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
      </div>

      {/* Compliance Status */}
      <div className="mb-8">
        <ComplianceStatus />
      </div>

      {/* Portfolio Summary */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <SummaryCard
          label="Total Value"
          value="$0.00"
          change="+0.00%"
          positive={true}
        />
        <SummaryCard
          label="Total Assets"
          value="0"
          change="0"
          positive={true}
        />
        <SummaryCard
          label="Total P&L"
          value="$0.00"
          change="+0.00%"
          positive={true}
        />
      </div>

      {/* Holdings */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Your Holdings</h2>
        <div className="text-center text-gray-400 py-12">
          <p>No holdings found</p>
          <p className="text-sm mt-2">
            Start investing in tokenized assets to see them here
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  change,
  positive,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <p className="mb-2 text-sm text-gray-400">{label}</p>
      <p className="mb-1 text-3xl font-bold text-white">{value}</p>
      <p
        className={`text-sm ${
          positive ? 'text-green-400' : 'text-red-400'
        }`}
      >
        {change}
      </p>
    </div>
  );
}
