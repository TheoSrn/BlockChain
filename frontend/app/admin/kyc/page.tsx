/**
 * Page Admin pour gérer le KYC
 * Route: /admin/kyc
 */

'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbiItem } from 'viem';
import { kycABI } from '@/abi/KYC';
import { KYCStatusBadge } from '@/components/web3/KYCStatus';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

// Adresse du contrat KYC depuis la config centralisée
const KYC_CONTRACT_ADDRESS = CONTRACT_ADDRESSES.KYC_MANAGER as `0x${string}`;

export default function KYCAdminPage() {
  const { address } = useAccount();
  const [targetAddress, setTargetAddress] = useState('');
  const [batchAddresses, setBatchAddresses] = useState('');
  const [operation, setOperation] = useState<'whitelist' | 'blacklist'>('whitelist');

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Whitelist/Blacklist une seule adresse
  const handleSingleOperation = async (action: 'add' | 'remove') => {
    if (!targetAddress) return;

    const functionName = operation === 'whitelist' ? 'setWhitelisted' : 'setBlacklisted';
    const status = action === 'add';

    try {
      writeContract({
        address: KYC_CONTRACT_ADDRESS,
        abi: kycABI,
        functionName,
        args: [targetAddress as `0x${string}`, status],
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Batch operation
  const handleBatchOperation = async (action: 'add' | 'remove') => {
    if (!batchAddresses) return;

    // Parse addresses (one per line)
    const addresses = batchAddresses
      .split('\n')
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0) as `0x${string}`[];

    if (addresses.length === 0) return;

    const functionName = operation === 'whitelist' ? 'setBatchWhitelisted' : 'setBatchBlacklisted';
    const status = action === 'add';

    try {
      writeContract({
        address: KYC_CONTRACT_ADDRESS,
        abi: kycABI,
        functionName,
        args: [addresses, status],
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">KYC Management</h1>

      {/* Admin Status */}
      <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Connected as Admin</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-2">{address}</p>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          ⚠️ Only KYC_ADMIN_ROLE can perform these operations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Single Address Operation */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Single Address Operation</h2>

          <div className="space-y-4">
            {/* Operation Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Operation Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="operation"
                    value="whitelist"
                    checked={operation === 'whitelist'}
                    onChange={(e) => setOperation(e.target.value as 'whitelist' | 'blacklist')}
                    className="radio"
                  />
                  <span>Whitelist</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="operation"
                    value="blacklist"
                    checked={operation === 'blacklist'}
                    onChange={(e) => setOperation(e.target.value as 'whitelist' | 'blacklist')}
                    className="radio"
                  />
                  <span>Blacklist</span>
                </label>
              </div>
            </div>

            {/* Target Address */}
            <div>
              <label className="block text-sm font-medium mb-2">Target Address</label>
              <input
                type="text"
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                placeholder="0x..."
                className="input w-full"
              />
            </div>

            {/* Current Status */}
            {targetAddress && (
              <div>
                <label className="block text-sm font-medium mb-2">Current Status</label>
                <KYCStatusBadge address={targetAddress as `0x${string}`} showDetails />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleSingleOperation('add')}
                disabled={!targetAddress || isPending || isConfirming}
                className="btn btn-primary flex-1"
              >
                {isPending || isConfirming ? 'Processing...' : `Add to ${operation}`}
              </button>
              <button
                onClick={() => handleSingleOperation('remove')}
                disabled={!targetAddress || isPending || isConfirming}
                className="btn btn-secondary flex-1"
              >
                {isPending || isConfirming ? 'Processing...' : `Remove from ${operation}`}
              </button>
            </div>

            {isSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-800 dark:text-green-200 text-sm">
                ✅ Transaction confirmed! Hash: {hash?.slice(0, 10)}...
              </div>
            )}
          </div>
        </div>

        {/* Batch Operation */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Batch Operation</h2>

          <div className="space-y-4">
            {/* Operation Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Operation Type</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Using: <span className="font-semibold">{operation}</span>
              </p>
            </div>

            {/* Batch Addresses */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Addresses (one per line)
              </label>
              <textarea
                value={batchAddresses}
                onChange={(e) => setBatchAddresses(e.target.value)}
                placeholder={'0x1234...\n0x5678...\n0x9abc...'}
                rows={8}
                className="textarea w-full font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {batchAddresses.split('\n').filter((a) => a.trim()).length} addresses
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleBatchOperation('add')}
                disabled={!batchAddresses || isPending || isConfirming}
                className="btn btn-primary flex-1"
              >
                {isPending || isConfirming ? 'Processing...' : `Batch Add to ${operation}`}
              </button>
              <button
                onClick={() => handleBatchOperation('remove')}
                disabled={!batchAddresses || isPending || isConfirming}
                className="btn btn-secondary flex-1"
              >
                {isPending || isConfirming ? 'Processing...' : `Batch Remove from ${operation}`}
              </button>
            </div>

            {isSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-800 dark:text-green-200 text-sm">
                ✅ Batch transaction confirmed! Hash: {hash?.slice(0, 10)}...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">ℹ️ Information</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>
            ✅ <strong>Whitelist:</strong> Allows users to hold and trade tokenized assets
          </li>
          <li>
            🚫 <strong>Blacklist:</strong> Blocks users from trading (overrides whitelist)
          </li>
          <li>
            📦 <strong>Batch operations:</strong> More gas-efficient for multiple addresses
          </li>
          <li>
            🔒 <strong>On-chain enforcement:</strong> All checks happen on the blockchain
          </li>
          <li>
            ⚡ <strong>Real-time:</strong> Changes take effect immediately after transaction
          </li>
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">🚀 Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              // Pre-fill with test addresses
              setBatchAddresses(
                '0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC\n0x90F79bf6EB2c4f870365E785982E1f101E93b906'
              );
              setOperation('whitelist');
            }}
            className="btn btn-outline"
          >
            Load Test Addresses
          </button>
          <button
            onClick={() => {
              setTargetAddress('');
              setBatchAddresses('');
            }}
            className="btn btn-outline"
          >
            Clear Form
          </button>
          <button
            onClick={() => {
              window.open('/admin/kyc/logs', '_blank');
            }}
            className="btn btn-outline"
          >
            View Audit Logs
          </button>
        </div>
      </div>
    </div>
  );
}
