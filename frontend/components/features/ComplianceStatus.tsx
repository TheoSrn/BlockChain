'use client';

/**
 * Composant pour afficher le statut de conformité (KYC) de l'utilisateur
 */

import { useCompliance } from '@/hooks/web3/useCompliance';
import { useAccount } from 'wagmi';

export function ComplianceStatus() {
  const { isConnected } = useAccount();
  const { compliance, isLoading } = useCompliance();

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <p className="text-center text-gray-400">
          Connect your wallet to check compliance status
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <p className="text-gray-400">Checking compliance...</p>
        </div>
      </div>
    );
  }

  if (!compliance) {
    return null;
  }

  return (
    <div
      className={`rounded-xl border p-6 ${
        compliance.canTrade
          ? 'border-green-500/50 bg-green-500/10'
          : 'border-red-500/50 bg-red-500/10'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Compliance Status</h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            compliance.canTrade
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {compliance.canTrade ? 'Verified' : 'Not Verified'}
        </span>
      </div>

      <div className="space-y-2">
        {compliance.canTrade ? (
          <p className="text-sm text-gray-300">
            ✅ You are authorized to trade on this platform
          </p>
        ) : (
          <>
            <p className="text-sm text-red-400">{compliance.reason}</p>
            {compliance.restrictions.length > 0 && (
              <ul className="mt-2 space-y-1">
                {compliance.restrictions.map((restriction) => (
                  <li
                    key={restriction}
                    className="text-xs text-gray-400"
                  >
                    • {restriction}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
