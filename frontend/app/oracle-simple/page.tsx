'use client';

/**
 * ============================================
 * ORACLE PAGE - Academic Project
 * ============================================
 * 
 * PURPOSE:
 * This page demonstrates an on-chain oracle that provides price data
 * for tokenized real-world assets or NFT collections.
 * 
 * WHAT IS AN ORACLE?
 * An oracle is a smart contract that stores and provides external data
 * (like asset prices) to other smart contracts on the blockchain.
 * 
 * FEATURES:
 * 1. Read current price from the oracle smart contract
 * 2. Display last update timestamp
 * 3. Admin function to update the price (requires wallet connection)
 * 
 * SMART CONTRACT FUNCTIONS USED:
 * - getPrice(assetId) → returns (price, timestamp)
 * - setPrice(assetId, newPrice) → updates the price (admin only)
 */

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { CONTRACT_ADDRESSES, DEFAULT_ASSET_ID } from '@/config/contracts';
import { formatUnits, parseUnits } from 'viem';
import ORACLE_ABI from '@/abi/Oracle';

export default function OracleSimplePage() {
  // ============================================
  // 1. STATE MANAGEMENT
  // ============================================
  
  // Track if component is mounted (prevents hydration errors)
  const [isMounted, setIsMounted] = useState(false);
  
  // New price input by admin
  const [newPrice, setNewPrice] = useState('');
  
  // The asset we're tracking (change this to track different assets)
  const assetId = DEFAULT_ASSET_ID;
  
  // Get connected wallet address
  const { address, isConnected } = useAccount();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ============================================
  // 2. READ PRICE FROM ORACLE (Blockchain Read)
  // ============================================
  
  /**
   * This hook reads the current price from the Oracle smart contract
   * Calls: getPrice(assetId) which returns [price, timestamp]
   * Refreshes every 10 seconds to show live updates
   */
  const { data: priceData, isLoading: isLoadingPrice, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.PRICE_ORACLE as `0x${string}`,
    abi: ORACLE_ABI,
    functionName: 'getPrice',
    args: [BigInt(assetId)],
    query: {
      refetchInterval: 10_000, // Auto-refresh every 10 seconds
    },
  });

  // Extract price and timestamp from contract response
  let currentPrice = '0.00';
  let lastUpdateTimestamp = 0;
  
  if (priceData) {
    const [price, timestamp] = priceData as [bigint, bigint];
    // Convert from 6 decimals (contract format) to human readable
    currentPrice = formatUnits(price, 6);
    lastUpdateTimestamp = Number(timestamp);
  }

  // ============================================
  // 3. UPDATE PRICE IN ORACLE (Blockchain Write)
  // ============================================
  
  /**
   * This hook writes a new price to the Oracle smart contract
   * Calls: setPrice(assetId, newPrice)
   * Only works if connected wallet has ORACLE_ADMIN_ROLE
   */
  const { 
    writeContract, 
    data: transactionHash,
    isPending: isWriting,
    error: writeError 
  } = useWriteContract();

  /**
   * Wait for the transaction to be confirmed on the blockchain
   */
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  /**
   * Handle the "Update Price" button click
   * Validates input and sends transaction to blockchain
   */
  const handleUpdatePrice = async () => {
    if (!newPrice || parseFloat(newPrice) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // Convert price to contract format (6 decimals)
      const priceInWei = parseUnits(newPrice, 6);
      
      // Send transaction to update price in smart contract
      writeContract({
        address: CONTRACT_ADDRESSES.PRICE_ORACLE as `0x${string}`,
        abi: ORACLE_ABI,
        functionName: 'setPrice',
        args: [BigInt(assetId), priceInWei],
      });
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  /**
   * After successful update, clear input and refresh price
   */
  useEffect(() => {
    if (isConfirmed) {
      setNewPrice('');
      // Refresh the price from blockchain
      setTimeout(() => refetch(), 2000);
    }
  }, [isConfirmed, refetch]);

  // ============================================
  // 4. RENDER UI
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <span>🔮</span>
            <span>On-Chain Oracle</span>
          </h1>
          <p className="text-gray-600">
            Real-time price feeds for tokenized real-world assets
          </p>
        </div>

        {/* ============================================ */}
        {/* SECTION 1: ORACLE OVERVIEW */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border-2 border-blue-100">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-900">
            <span>📊</span>
            <span>Oracle Overview</span>
          </h2>

          <div className="space-y-6">
            {/* Asset Name */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-semibold mb-1">Asset Name</p>
              <p className="text-xl font-bold text-blue-900">
                Tokenized Real-World Asset #{assetId}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Real estate, art, commodities, or NFT collection
              </p>
            </div>

            {/* Current Price */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-green-700 font-semibold">Current Price (Oracle)</p>
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-semibold text-green-600">LIVE</span>
                </div>
              </div>
              
              {isLoadingPrice ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-green-200 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-green-200 rounded w-1/3"></div>
                </div>
              ) : (
                <>
                  <p className="text-5xl font-bold text-green-900 mb-2">
                    ${parseFloat(currentPrice).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-sm text-green-700">
                    Price stored on-chain in Oracle smart contract
                  </p>
                </>
              )}
            </div>

            {/* Last Update Timestamp */}
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-semibold mb-1">Last Update</p>
              {isMounted && lastUpdateTimestamp > 0 ? (
                <>
                  <p className="text-lg font-bold text-purple-900">
                    {new Date(lastUpdateTimestamp * 1000).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {Math.floor((Date.now() / 1000 - lastUpdateTimestamp) / 60)} minutes ago
                  </p>
                </>
              ) : (
                <p className="text-gray-500">No updates yet</p>
              )}
            </div>

            {/* Oracle Contract Address */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <p className="text-sm text-gray-600 font-semibold mb-2">Oracle Smart Contract Address</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm bg-white p-3 rounded border flex-1 break-all text-blue-600">
                  {CONTRACT_ADDRESSES.PRICE_ORACLE}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(CONTRACT_ADDRESSES.PRICE_ORACLE);
                    alert('Address copied to clipboard!');
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                  📋 Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This address points to the Oracle contract on the blockchain
              </p>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* SECTION 2: ORACLE UPDATE (ADMIN ONLY) */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-orange-100">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-orange-900">
            <span>⚙️</span>
            <span>Update Oracle Price (Admin Only)</span>
          </h2>

          {/* Connection Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Wallet Status:</p>
            {isConnected ? (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <p className="font-mono text-sm text-green-700">
                  Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <p className="text-red-600 font-semibold">Not Connected</p>
                <p className="text-xs text-gray-500">(Please connect wallet to update)</p>
              </div>
            )}
          </div>

          {/* Price Input Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Enter new price (e.g., 50000.00)"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                disabled={!isConnected || isWriting || isConfirming}
              />
              <p className="text-xs text-gray-500 mt-1">
                This price will be stored on-chain and visible to all users
              </p>
            </div>

            {/* Update Button */}
            <button
              onClick={handleUpdatePrice}
              disabled={!isConnected || !newPrice || isWriting || isConfirming}
              className={`w-full py-4 rounded-lg font-bold text-lg transition ${
                !isConnected || !newPrice || isWriting || isConfirming
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
              }`}
            >
              {isWriting
                ? '📤 Sending Transaction...'
                : isConfirming
                ? '⏳ Confirming on Blockchain...'
                : '✅ Update Oracle Price'}
            </button>

            {/* Transaction Status Feedback */}
            <div className="min-h-[60px]">
              {isWriting && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-pulse">
                  <p className="text-blue-800 font-semibold">⏳ Transaction Pending...</p>
                  <p className="text-sm text-blue-600">Please confirm in your wallet</p>
                </div>
              )}

              {isConfirming && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-semibold">⏳ Confirming Transaction...</p>
                  <p className="text-sm text-yellow-600">Waiting for blockchain confirmation</p>
                  {transactionHash && (
                    <p className="text-xs font-mono mt-2 text-gray-600 break-all">
                      Tx: {transactionHash}
                    </p>
                  )}
                </div>
              )}

              {isConfirmed && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold">✅ Success!</p>
                  <p className="text-sm text-green-600">Oracle price updated on blockchain</p>
                  <p className="text-xs text-gray-600 mt-1">
                    New price will be visible in a few seconds
                  </p>
                </div>
              )}

              {writeError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-semibold">❌ Error</p>
                  <p className="text-sm text-red-600">
                    {writeError.message.includes('ORACLE_ADMIN_ROLE')
                      ? 'You do not have admin permissions to update the oracle'
                      : 'Transaction failed. Please try again.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Note */}
          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <strong>⚠️ Admin Note:</strong> Only accounts with ORACLE_ADMIN_ROLE can update prices.
              This ensures data integrity and prevents unauthorized price manipulation.
            </p>
          </div>
        </div>

        {/* ============================================ */}
        {/* SECTION 3: HOW IT WORKS (Educational) */}
        {/* ============================================ */}
        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl shadow-lg p-8 border-2 border-indigo-100">
          <h3 className="text-xl font-bold mb-4 text-indigo-900">📚 How This Oracle Works</h3>
          
          <div className="space-y-4 text-sm text-indigo-800">
            <div className="bg-white rounded-lg p-4">
              <p className="font-semibold mb-2">1️⃣ Reading Price (Blockchain Read)</p>
              <p className="text-gray-700">
                The page calls <code className="bg-gray-100 px-2 py-1 rounded">getPrice(assetId)</code> on the Oracle smart contract.
                This is a FREE operation that reads data from the blockchain.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <p className="font-semibold mb-2">2️⃣ Updating Price (Blockchain Write)</p>
              <p className="text-gray-700">
                Admin calls <code className="bg-gray-100 px-2 py-1 rounded">setPrice(assetId, newPrice)</code> which sends a transaction
                to the blockchain. This costs gas and requires ORACLE_ADMIN_ROLE permission.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <p className="font-semibold mb-2">3️⃣ Data Storage</p>
              <p className="text-gray-700">
                All price data is stored ON-CHAIN in the Oracle smart contract, making it transparent,
                immutable, and accessible to any other smart contract or application.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <p className="font-semibold mb-2">4️⃣ Use Cases</p>
              <p className="text-gray-700">
                Other DeFi protocols can read this oracle to determine collateral values, execute trades,
                calculate portfolio worth, or trigger automated actions based on asset prices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
