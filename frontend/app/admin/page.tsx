'use client';

/**
 * Page Admin - Gestion KYC et Whitelist/Blacklist
 * Accès réservé aux admins on-chain
 */

import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { useIsAdmin, useKYCStatus, useKYCManager } from '@/hooks/web3/useKYCManager';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { Address, isAddress } from 'viem';

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();
  
  const [targetAddress, setTargetAddress] = useState<string>('');
  const [validAddress, setValidAddress] = useState<Address | undefined>();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: string;
    label: string;
    action: () => void;
  } | null>(null);

  const { status, refetch } = useKYCStatus(validAddress);
  const {
    addToWhitelist,
    removeFromWhitelist,
    addToBlacklist,
    removeFromBlacklist,
    verifyKYC,
    revokeKYC,
    isPending,
    isSuccess,
    error,
    hash,
    lastAction,
  } = useKYCManager();

  // Valider l'adresse saisie
  useEffect(() => {
    if (targetAddress && isAddress(targetAddress)) {
      setValidAddress(targetAddress as Address);
    } else {
      setValidAddress(undefined);
    }
  }, [targetAddress]);

  // Rafraîchir le statut après succès
  useEffect(() => {
    if (isSuccess) {
      refetch();
    }
  }, [isSuccess, refetch]);

  // Modal de confirmation
  const openConfirmModal = (type: string, label: string, action: () => void) => {
    setConfirmAction({ type, label, action });
    setShowConfirmModal(true);
  };

  const executeAction = () => {
    if (confirmAction) {
      confirmAction.action();
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  // Vérification de connexion
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-12 text-center">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h2 className="mb-4 text-2xl font-bold text-gray-800">Wallet Not Connected</h2>
          <p className="text-gray-600">Please connect your wallet to access the admin panel</p>
        </div>
      </div>
    );
  }

  // Vérification du rôle admin
  if (isLoadingAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white border rounded-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-12 text-center">
          <span className="text-6xl mb-4 block">🚫</span>
          <h2 className="mb-4 text-2xl font-bold text-red-800">Access Denied</h2>
          <p className="text-red-700 mb-4">
            You don't have admin permissions to access this page
          </p>
          <p className="text-sm text-red-600">
            Current address: {address?.slice(0, 10)}...{address?.slice(-8)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">
          Manage KYC verifications, whitelist, and blacklist
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-green-600 font-semibold">Admin access granted</span>
        </div>
      </div>

      {/* Dev Mode Warning */}
      {process.env.NEXT_PUBLIC_ADMIN_DEV_MODE === 'true' && (
        <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-orange-800 mb-1">Development Mode Active</h3>
              <p className="text-sm text-orange-700">
                Admin verification is bypassed. Set <code className="bg-orange-100 px-1 rounded">NEXT_PUBLIC_ADMIN_DEV_MODE=false</code> in production.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contract Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div className="flex-1">
            <h3 className="font-bold text-blue-800 mb-1">KYC Manager Contract</h3>
            <p className="text-sm text-blue-700 font-mono break-all">
              {CONTRACT_ADDRESSES.KYC_MANAGER}
            </p>
            {CONTRACT_ADDRESSES.KYC_MANAGER === '0x0000000000000000000000000000000000000000' && (
              <p className="text-xs text-orange-600 mt-2">
                ⚠️ Contract not deployed. Using mock data for testing. Real transactions will fail until a valid contract address is configured.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Address Lookup */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search Form */}
          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Check Address Status</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-semibold">
                Ethereum Address
              </label>
              <input
                type="text"
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                placeholder="0x..."
                className="w-full border rounded-lg px-4 py-3 text-lg font-mono"
              />
              {targetAddress && !validAddress && (
                <p className="text-red-600 text-sm mt-2">❌ Invalid Ethereum address</p>
              )}
              {validAddress && (
                <p className="text-green-600 text-sm mt-2">✅ Valid address</p>
              )}
            </div>
          </div>

          {/* Status Display */}
          {validAddress && (
            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Current Status</h2>
                {process.env.NEXT_PUBLIC_ADMIN_DEV_MODE === 'true' && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                    📊 Mock Data
                  </span>
                )}
              </div>
              
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className={`p-4 rounded-lg border-2 ${
                  status.isVerified 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="text-center">
                    <div className="text-3xl mb-2">
                      {status.isVerified ? '✅' : '❌'}
                    </div>
                    <p className="font-bold text-sm">KYC Verified</p>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border-2 ${
                  status.isWhitelisted 
                    ? 'bg-blue-50 border-blue-500' 
                    : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="text-center">
                    <div className="text-3xl mb-2">
                      {status.isWhitelisted ? '✅' : '❌'}
                    </div>
                    <p className="font-bold text-sm">Whitelisted</p>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border-2 ${
                  status.isBlacklisted 
                    ? 'bg-red-50 border-red-500' 
                    : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="text-center">
                    <div className="text-3xl mb-2">
                      {status.isBlacklisted ? '⚠️' : '✅'}
                    </div>
                    <p className="font-bold text-sm">
                      {status.isBlacklisted ? 'Blacklisted' : 'Not Blacklisted'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Admin Actions</h3>
                
                {/* KYC Actions */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-purple-700">KYC Management</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    <button
                      onClick={() => openConfirmModal(
                        'verifyKYC',
                        'Verify KYC',
                        () => verifyKYC(validAddress)
                      )}
                      disabled={isPending || status.isVerified}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ✅ Verify KYC
                    </button>
                    <button
                      onClick={() => openConfirmModal(
                        'revokeKYC',
                        'Revoke KYC',
                        () => revokeKYC(validAddress)
                      )}
                      disabled={isPending || !status.isVerified}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      🚫 Revoke KYC
                    </button>
                  </div>
                </div>

                {/* Whitelist Actions */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-blue-700">Whitelist Management</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    <button
                      onClick={() => openConfirmModal(
                        'addToWhitelist',
                        'Add to Whitelist',
                        () => addToWhitelist(validAddress)
                      )}
                      disabled={isPending || status.isWhitelisted}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ➕ Add to Whitelist
                    </button>
                    <button
                      onClick={() => openConfirmModal(
                        'removeFromWhitelist',
                        'Remove from Whitelist',
                        () => removeFromWhitelist(validAddress)
                      )}
                      disabled={isPending || !status.isWhitelisted}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ➖ Remove from Whitelist
                    </button>
                  </div>
                </div>

                {/* Blacklist Actions */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-red-700">Blacklist Management</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    <button
                      onClick={() => openConfirmModal(
                        'addToBlacklist',
                        'Add to Blacklist',
                        () => addToBlacklist(validAddress)
                      )}
                      disabled={isPending || status.isBlacklisted}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ⚠️ Add to Blacklist
                    </button>
                    <button
                      onClick={() => openConfirmModal(
                        'removeFromBlacklist',
                        'Remove from Blacklist',
                        () => removeFromBlacklist(validAddress)
                      )}
                      disabled={isPending || !status.isBlacklisted}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ✅ Remove from Blacklist
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Transaction Status */}
          {isPending && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="font-bold text-blue-800 mb-1">Transaction Pending</p>
                <p className="text-sm text-blue-700">
                  {lastAction === 'verifyKYC' && 'Verifying KYC...'}
                  {lastAction === 'revokeKYC' && 'Revoking KYC...'}
                  {lastAction === 'addToWhitelist' && 'Adding to whitelist...'}
                  {lastAction === 'removeFromWhitelist' && 'Removing from whitelist...'}
                  {lastAction === 'addToBlacklist' && 'Adding to blacklist...'}
                  {lastAction === 'removeFromBlacklist' && 'Removing from blacklist...'}
                </p>
              </div>
            </div>
          )}

          {isSuccess && hash && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-bold text-green-800 mb-2">Transaction Successful!</p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline break-all"
                >
                  View on Etherscan →
                </a>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="text-center">
                <div className="text-4xl mb-3">❌</div>
                <p className="font-bold text-red-800 mb-2">Transaction Failed</p>
                <p className="text-xs text-red-700">
                  {error.message.slice(0, 100)}...
                </p>
              </div>
            </div>
          )}

          {/* Admin Guide */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="font-bold text-purple-800 mb-3">Admin Guide</h3>
            <ul className="text-sm text-purple-700 space-y-2">
              <li>✅ <strong>Verify KYC</strong>: Grant access to protected features</li>
              <li>🚫 <strong>Revoke KYC</strong>: Remove verification status</li>
              <li>📝 <strong>Whitelist</strong>: Pre-approve addresses for faster access</li>
              <li>⚠️ <strong>Blacklist</strong>: Block suspicious addresses</li>
            </ul>
          </div>

          {/* Security Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-yellow-800 mb-1">Security Notice</h3>
                <p className="text-sm text-yellow-700">
                  All actions are recorded on-chain and irreversible. Double-check addresses before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold mb-4">Confirm Action</h3>
            <p className="text-gray-700 mb-2">
              You are about to perform the following action:
            </p>
            <p className="font-bold text-lg mb-4 text-purple-700">
              {confirmAction.label}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Target address: <br />
              <span className="font-mono text-xs">{validAddress}</span>
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
