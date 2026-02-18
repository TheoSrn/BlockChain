'use client';

/**
 * Page KYC - Interface de vérification d'identité
 * Affiche le statut de conformité et permet la soumission KYC
 */

import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { useKYCStatus } from '@/hooks/web3/useKYCStatus';
import { KYCStatusDisplay } from '@/components/web3/KYCStatusDisplay';
import { useEffect, useState } from 'react';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import KYC_MANAGER_ABI from '@/abi/KYCManager';

export default function KYCPage() {
  const { address, isConnected } = useAccount();
  const { kycStatus, isLoading, refetch } = useKYCStatus(undefined, {
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });
    useEffect(() => {
      if (isSuccess) {
        refetch();
      }
    }, [isSuccess, refetch]);

  const [formData, setFormData] = useState({
    fullName: '',
    country: '',
    documentType: '',
    documentNumber: '',
  });

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-12 text-center">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400">
            Please connect your wallet to complete KYC verification
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    // Submit KYC application (anyone can call this)
    writeContract({
      address: CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`,
      abi: KYC_MANAGER_ABI,
      functionName: 'submitKYC',
      args: [
        formData.fullName,
        formData.country,
        formData.documentType,
        formData.documentNumber,
      ],
      gas: 500000n, // Limite de gas appropriée pour Sepolia
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-white">
          KYC Verification
        </h1>
        <p className="text-gray-400">
          Complete your identity verification to trade on the platform
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* KYC Form */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-12 text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                <p className="text-gray-400">Checking verification status...</p>
              </div>
            </div>
          ) : kycStatus?.isKYCVerified ? (
            <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-12 text-center">
              <div className="mb-4 text-5xl">✅</div>
              <h2 className="mb-2 text-2xl font-bold text-white">
                KYC Verified
              </h2>
              <p className="mb-4 text-gray-300">
                Your identity has been successfully verified
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="mb-6 text-xl font-bold text-white">
                Identity Verification Form
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Country of Residence
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                  >
                    <option value="">Select a country...</option>
                    <option value="US">United States</option>
                    <option value="FR">France</option>
                    <option value="UK">United Kingdom</option>
                    <option value="DE">Germany</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Document Type
                  </label>
                  <select
                    value={formData.documentType}
                    onChange={(e) =>
                      setFormData({ ...formData, documentType: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                  >
                    <option value="">Select document type...</option>
                    <option value="passport">Passport</option>
                    <option value="id">National ID</option>
                    <option value="license">Driver's License</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Document Number
                  </label>
                  <input
                    type="text"
                    value={formData.documentNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, documentNumber: e.target.value })
                    }
                    placeholder="ABC123456"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
                  <p className="text-sm text-blue-400">
                    ℹ️ Your KYC application will be reviewed by an administrator.
                    You'll be notified once approved.
                  </p>
                </div>

                {writeError ? (
                  <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
                    <p className="text-sm text-red-400">
                      Transaction failed: {writeError.message}
                    </p>
                  </div>
                ) : null}

                {isSuccess ? (
                  <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                    <p className="text-sm text-green-400">
                      ✅ KYC application submitted! Waiting for admin approval.
                    </p>
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isPending || isConfirming}
                >
                  {isPending || isConfirming ? 'Submitting...' : 'Submit KYC Application'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Utilise le nouveau composant d'affichage KYC */}
          <KYCStatusDisplay />

          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="mb-4 text-lg font-bold text-white">
              Why KYC is Required
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>✓ Regulatory compliance</li>
              <li>✓ Platform security</li>
              <li>✓ Fraud prevention</li>
              <li>✓ Access to all features</li>
            </ul>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="mb-2 text-sm font-bold text-white">
              Your Wallet
            </h3>
            <p className="text-xs text-gray-400 break-all">{address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
