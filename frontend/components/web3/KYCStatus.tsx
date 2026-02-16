/**
 * Composant pour afficher le statut KYC d'un utilisateur
 * Usage: <KYCStatusBadge address={userAddress} />
 */

'use client';

import { useKYCStatus, useKYCBadge } from '@/hooks/web3/useKYC';

// Utiliser l'adresse depuis l'env ou le hook
const KYC_ADDRESS = process.env.NEXT_PUBLIC_KYC_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

interface KYCStatusBadgeProps {
  address?: `0x${string}`;
  showDetails?: boolean;
}

export function KYCStatusBadge({ address, showDetails = false }: KYCStatusBadgeProps) {
  const { isWhitelisted, isBlacklisted, isVerified, canTrade, isLoading } = useKYCStatus(address);
  const badge = useKYCBadge(address);

  if (!address) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm">
        <span>Connect wallet</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Badge principal */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
          badge.color === 'green'
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            : badge.color === 'red'
            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            : badge.color === 'blue'
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}
      >
        <span>{badge.icon}</span>
        <span>{badge.label}</span>
      </div>

      {/* Détails (optionnel) */}
      {showDetails && !isLoading && (
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div className="flex items-center gap-2">
            <span>{isWhitelisted ? '✅' : '❌'}</span>
            <span>Whitelisted: {isWhitelisted ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{isBlacklisted ? '🚫' : '✅'}</span>
            <span>Blacklisted: {isBlacklisted ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{canTrade ? '✅' : '❌'}</span>
            <span>Can Trade: {canTrade ? 'Yes' : 'No'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Composant pour bloquer l'accès si l'utilisateur n'est pas vérifié KYC
 */
interface KYCGuardProps {
  address?: `0x${string}`;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function KYCGuard({ address, children, fallback }: KYCGuardProps) {
  const { canTrade, isLoading } = useKYCStatus(address);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking KYC status...</p>
        </div>
      </div>
    );
  }

  if (!canTrade) {
    return (
      fallback || (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                KYC Verification Required
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                You need to complete KYC verification to access this feature. Only verified users
                can hold and trade tokenized assets.
              </p>
              <button className="btn btn-primary">
                Complete KYC Verification
              </button>
            </div>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}

/**
 * Exemple d'utilisation dans une page
 */
export function ExampleUsage() {
  const address = '0x...' as `0x${string}`;

  return (
    <div className="space-y-6">
      {/* Afficher le badge */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Your KYC Status</h2>
        <KYCStatusBadge address={address} showDetails />
      </div>

      {/* Protéger l'accès à une fonctionnalité */}
      <KYCGuard address={address}>
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Trade Assets</h3>
          <p className="text-gray-600 dark:text-gray-400">
            You can now buy, sell, and trade tokenized assets!
          </p>
          {/* Vos fonctionnalités de trading ici */}
        </div>
      </KYCGuard>
    </div>
  );
}
