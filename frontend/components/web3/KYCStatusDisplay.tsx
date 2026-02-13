'use client';

/**
 * Composant d'affichage détaillé du statut KYC
 * Version améliorée avec UX claire et indicateurs visuels
 */

import { useAccount } from 'wagmi';
import { useKYCStatus } from '@/hooks/web3/useKYCStatus';
import Link from 'next/link';

export function KYCStatusDisplay() {
  const { isConnected, address } = useAccount();
  const { kycStatus, isLoading } = useKYCStatus();

  // Wallet non connecté
  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800 p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
            <svg
              className="h-8 w-8 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-bold text-white">
            Wallet Not Connected
          </h3>
          <p className="text-sm text-gray-400">
            Connect your wallet to check compliance status
          </p>
        </div>
      </div>
    );
  }

  // Chargement
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800 p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          <p className="text-gray-400">Checking compliance status...</p>
        </div>
      </div>
    );
  }

  // Pas de statut (problème technique)
  if (!kycStatus) {
    return (
      <div className="rounded-2xl border border-yellow-800 bg-gradient-to-br from-yellow-900/20 to-gray-900 p-6">
        <p className="text-yellow-400">⚠️ Unable to retrieve compliance status</p>
      </div>
    );
  }

  // Affichage selon le statut
  const statusColor = kycStatus.isBlacklisted
    ? 'red'
    : kycStatus.canTrade
    ? 'green'
    : 'yellow';

  return (
    <div
      className={`rounded-2xl border p-6 ${getStatusClasses(statusColor)}`}
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="mb-1 text-xl font-bold text-white">
            Compliance Status
          </h3>
          <p className="text-sm text-gray-400">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
        
        {/* Badge statut principal */}
        <StatusBadge
          canTrade={kycStatus.canTrade}
          isBlacklisted={kycStatus.isBlacklisted}
        />
      </div>

      {/* Indicateurs détaillés */}
      <div className="space-y-3">
        {/* KYC Verification */}
        <StatusRow
          icon={
            kycStatus.isKYCVerified ? (
              <CheckIcon className="text-green-400" />
            ) : (
              <XIcon className="text-gray-500" />
            )
          }
          label="KYC Verification"
          status={kycStatus.isKYCVerified ? 'Verified' : 'Not Verified'}
          isPositive={kycStatus.isKYCVerified}
        />

        {/* Whitelist */}
        <StatusRow
          icon={
            kycStatus.isWhitelisted ? (
              <CheckIcon className="text-green-400" />
            ) : (
              <XIcon className="text-gray-500" />
            )
          }
          label="Whitelist Status"
          status={kycStatus.isWhitelisted ? 'Whitelisted' : 'Not Whitelisted'}
          isPositive={kycStatus.isWhitelisted}
        />

        {/* Blacklist */}
        <StatusRow
          icon={
            kycStatus.isBlacklisted ? (
              <AlertIcon className="text-red-400" />
            ) : (
              <CheckIcon className="text-green-400" />
            )
          }
          label="Blacklist Status"
          status={kycStatus.isBlacklisted ? 'Blacklisted' : 'Clear'}
          isPositive={!kycStatus.isBlacklisted}
        />
      </div>

      {/* Message et action */}
      <div className="mt-6 border-t border-gray-800 pt-6">
        {kycStatus.canTrade ? (
          <div className="rounded-lg bg-green-500/10 p-4">
            <p className="text-sm font-medium text-green-400">
              ✅ You are authorized to trade on this platform
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-red-500/10 p-4">
              <p className="mb-2 text-sm font-medium text-red-400">
                {kycStatus.reason}
              </p>
              {!kycStatus.isKYCVerified && (
                <Link
                  href="/kyc"
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-500"
                >
                  Complete KYC Verification
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============== Composants auxiliaires ==============

function getStatusClasses(color: 'red' | 'green' | 'yellow') {
  const classes = {
    red: 'border-red-500/50 bg-gradient-to-br from-red-900/20 to-gray-900',
    green: 'border-green-500/50 bg-gradient-to-br from-green-900/20 to-gray-900',
    yellow: 'border-yellow-500/50 bg-gradient-to-br from-yellow-900/20 to-gray-900',
  };
  return classes[color];
}

function StatusBadge({
  canTrade,
  isBlacklisted,
}: {
  canTrade: boolean;
  isBlacklisted: boolean;
}) {
  if (isBlacklisted) {
    return (
      <span className="rounded-full bg-red-500/20 px-4 py-2 text-sm font-bold text-red-400">
        🚫 Blacklisted
      </span>
    );
  }

  if (canTrade) {
    return (
      <span className="rounded-full bg-green-500/20 px-4 py-2 text-sm font-bold text-green-400">
        ✅ Verified
      </span>
    );
  }

  return (
    <span className="rounded-full bg-yellow-500/20 px-4 py-2 text-sm font-bold text-yellow-400">
      ⚠️ Pending
    </span>
  );
}

function StatusRow({
  icon,
  label,
  status,
  level,
  isPositive,
}: {
  icon: React.ReactNode;
  label: string;
  status: string;
  level?: string;
  isPositive: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900">
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-300">{label}</span>
      </div>
      <div className="text-right">
        <span
          className={`text-sm font-semibold ${
            isPositive ? 'text-white' : 'text-gray-500'
          }`}
        >
          {status}
        </span>
        {level && (
          <span className="ml-2 rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
            {level}
          </span>
        )}
      </div>
    </div>
  );
}

// ============== Icônes ==============

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}
