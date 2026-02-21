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

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi';
import { useState, useEffect, useMemo } from 'react';
import { CONTRACT_ADDRESSES, DEFAULT_ASSET_ID } from '@/config/contracts';
import { formatUnits, parseUnits, Address } from 'viem';
import ORACLE_ABI from '@/abi/Oracle';
import FACTORY_ABI from '@/abi/Factory';
import ASSET_NFT_ABI from '@/abi/AssetNFT';
import { PRIMARY_SALE_NFT_ABI } from '@/abi/PrimarySaleNFT';

// Helper function to extract asset type from documents field
function getTokenType(documents: string): string {
  if (!documents) return 'DIVISIBLE';
  if (documents === 'DIVISIBLE' || documents === 'UNIQUE') return documents;
  const parts = documents.split('|').map((p: string) => p.trim());
  return parts[0] || documents;
}

// Adresse du contrat PrimarySaleNFT pour les NFTs (Exclusive Properties)
const PRIMARY_SALE_NFT_ADDRESS = (process.env.NEXT_PUBLIC_PRIMARY_SALE_NFT_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;

// ERC20 ABI minimal pour lire le balance et total supply
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

// ERC721 ABI minimal pour vérifier ownership
const ERC721_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Available currencies for price updates
const AVAILABLE_CURRENCIES = [
  { symbol: 'USDC', emoji: '💵', label: 'USDC (USD Coin)' },
  { symbol: 'USDT', emoji: '💲', label: 'USDT (Tether USD)' },
  { symbol: 'WETH', emoji: '🔷', label: 'WETH (Wrapped Ether)' },
  { symbol: 'USD', emoji: '💰', label: 'USD (Fiat)' },
] as const;

export default function OraclePage() {
  // ============================================
  // 1. STATE MANAGEMENT
  // ============================================
  
  // Track if component is mounted (prevents hydration errors)
  const [isMounted, setIsMounted] = useState(false);
  
  // New price input by admin
  const [newPrice, setNewPrice] = useState('');
  
  // Selected currency for price update
  const [selectedCurrency, setSelectedCurrency] = useState('USDC');
  
  // The asset we're tracking (can be changed by user)
  const [selectedAssetId, setSelectedAssetId] = useState<bigint>(BigInt(DEFAULT_ASSET_ID));
  
  // Get connected wallet address
  const { address, isConnected } = useAccount();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ============================================
  // 1.5 GET ALL AVAILABLE ASSETS FROM FACTORY
  // ============================================

  const factoryAddress = CONTRACT_ADDRESSES.ASSET_FACTORY;

  // Get total number of assets
  const { data: assetCountData } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'assetCount',
    query: {
      refetchInterval: 10_000,
    },
  });

  const assetCount = Number(assetCountData ?? BigInt(0));
  
  // Generate array of asset IDs
  const assetIds = useMemo(() => {
    if (assetCount > 0) {
      return Array.from({ length: assetCount }, (_, i) => BigInt(i + 1));
    }
    return [BigInt(DEFAULT_ASSET_ID)];
  }, [assetCount]);

  // Fetch all assets data
  const { data: assetsData } = useReadContracts({
    contracts: assetIds.map((id) => ({
      address: factoryAddress as `0x${string}`,
      abi: FACTORY_ABI,
      functionName: 'getAsset',
      args: [id],
    })),
    query: {
      enabled: assetCount > 0,
      refetchInterval: 10_000,
    },
  });

  // Parse assets data
  const availableAssets = useMemo(() => {
    if (!assetsData || assetsData.length === 0) {
      return [{
        id: BigInt(DEFAULT_ASSET_ID),
        name: `Asset ${DEFAULT_ASSET_ID}`,
        symbol: 'ASSET',
        nft: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        token: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      }];
    }

    return assetsData
      .map((result) => {
        if (result.status !== 'success' || !result.result) return null;
        const asset = result.result as any;
        return {
          id: asset.id || asset[0],
          name: asset.name || asset[4],
          symbol: asset.symbol || asset[5],
          nft: (asset.nft || asset[1]) as `0x${string}`,
          token: (asset.token || asset[2]) as `0x${string}`,
        };
      })
      .filter(Boolean) as Array<{
        id: bigint;
        name: string;
        symbol: string;
        nft: `0x${string}`;
        token: `0x${string}`;
      }>;
  }, [assetsData]);

  // Get selected asset details
  const selectedAsset = availableAssets.find((a) => a.id === selectedAssetId) || availableAssets[0];

  // Get NFT metadata to retrieve estimatedValue and payment token info
  const { data: nftMetadata } = useReadContract({
    address: selectedAsset?.nft,
    abi: ASSET_NFT_ABI,
    functionName: 'getMetadata',
    query: {
      enabled: !!selectedAsset?.nft && selectedAssetId > BigInt(0),
      refetchInterval: 10_000,
    },
  });

  // Extract documents from NFT metadata
  const assetDocuments = nftMetadata ? (nftMetadata as any).documents as string : '';

  // Get price info from documents (format: "DIVISIBLE|USDC" or "UNIQUE|USDT")
  let paymentTokenSymbol = 'USDC'; // Default fallback
  
  if (assetDocuments && assetDocuments.includes('|')) {
    const parts = assetDocuments.split('|');
    if (parts.length >= 2) {
      const tokenFromDocs = parts[1]?.trim();
      // Validate it's a known token (USDC, USDT, WETH)
      if (tokenFromDocs && (tokenFromDocs === 'USDC' || tokenFromDocs === 'USDT' || tokenFromDocs === 'WETH')) {
        paymentTokenSymbol = tokenFromDocs;
      }
    }
  }

  // Extract estimatedValue from metadata (this is the actual price)
  const estimatedValue = nftMetadata ? (nftMetadata as any).estimatedValue as bigint : BigInt(0);
  const assetTypeFromDocs = getTokenType(assetDocuments);

  // ============================================
  // 1.5 GET NFT LISTING PRICE FROM PRIMARY SALE
  // ============================================

  // For NFTs (UNIQUE assets), get the listing price from PrimarySaleNFT
  const { data: nftListingData } = useReadContract({
    address: PRIMARY_SALE_NFT_ADDRESS,
    abi: PRIMARY_SALE_NFT_ABI,
    functionName: 'getListing',
    args: selectedAsset?.nft && selectedAssetId ? [selectedAsset.nft, selectedAssetId] : undefined,
    query: {
      enabled: !!selectedAsset?.nft && selectedAssetId > BigInt(0) && assetTypeFromDocs === 'UNIQUE' && PRIMARY_SALE_NFT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 10_000,
    },
  });

  const nftListing = nftListingData as any;
  const isNFTListed = nftListing && nftListing.active;
  const nftListingPrice = isNFTListed && nftListing.price ? Number(formatUnits(nftListing.price, 18)) : 0;

  // ============================================
  // 1.55 CHECK ORACLE ADMIN ROLE
  // ============================================

  // Get ORACLE_ADMIN_ROLE constant from contract
  const { data: oracleAdminRole } = useReadContract({
    address: CONTRACT_ADDRESSES.PRICE_ORACLE as `0x${string}`,
    abi: ORACLE_ABI,
    functionName: 'ORACLE_ADMIN_ROLE',
  });

  // Check if connected user has ORACLE_ADMIN_ROLE
  const { data: hasOracleAdminRole } = useReadContract({
    address: CONTRACT_ADDRESSES.PRICE_ORACLE as `0x${string}`,
    abi: ORACLE_ABI,
    functionName: 'hasRole',
    args: address && oracleAdminRole ? [oracleAdminRole as `0x${string}`, address] : undefined,
    query: {
      enabled: !!address && !!oracleAdminRole,
      refetchInterval: 10_000,
    },
  });

  const userIsOracleAdmin = Boolean(hasOracleAdminRole);

  // ============================================
  // 1.6 GET USER BALANCES FOR SELECTED ASSET
  // ============================================

  // Get ERC20 token balance
  const { data: tokenBalance } = useReadContract({
    address: selectedAsset?.token,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!selectedAsset?.token,
      refetchInterval: 10_000,
    },
  });

  // Get ERC20 total supply
  const { data: totalSupply } = useReadContract({
    address: selectedAsset?.token,
    abi: ERC20_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!selectedAsset?.token,
      refetchInterval: 10_000,
    },
  });

  // Get ERC20 decimals
  const { data: tokenDecimals } = useReadContract({
    address: selectedAsset?.token,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!selectedAsset?.token,
    },
  });

  // Get NFT balance (number of NFTs owned)
  const { data: nftBalance } = useReadContract({
    address: selectedAsset?.nft,
    abi: ERC721_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!selectedAsset?.nft,
      refetchInterval: 10_000,
    },
  });

  const decimals = Number(tokenDecimals ?? 18);
  const userTokenBalance = tokenBalance ? formatUnits(tokenBalance as bigint, decimals) : '0';
  const tokenTotalSupply = totalSupply ? formatUnits(totalSupply as bigint, decimals) : '0';
  const userNftBalance = Number(nftBalance ?? BigInt(0));

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
    args: selectedAssetId ? [selectedAssetId] : undefined,
    query: {
      refetchInterval: 10_000, // Auto-refresh every 10 seconds
    },
  });

  // Extract price, timestamp and currency from contract response
  let currentPrice = '0.00';
  let lastUpdateTimestamp = 0;
  let oracleCurrency = '';
  
  if (priceData) {
    const [price, timestamp, currency] = priceData as [bigint, bigint, string];
    // Convert from 6 decimals (contract format) to human readable
    currentPrice = formatUnits(price, 6);
    lastUpdateTimestamp = Number(timestamp);
    oracleCurrency = currency || '';
  }

  // Determine display currency: use Oracle currency if available, otherwise metadata paymentToken
  const displayCurrency = oracleCurrency || paymentTokenSymbol || 'USDC';

  // Price priority: Oracle > NFT Listing > estimatedValue
  // This ensures Oracle updates are immediately visible
  let pricePerUnit = 0;
  let priceSource = 'None';
  const oraclePrice = parseFloat(currentPrice);
  
  if (oraclePrice > 0) {
    // Priority 1: Use Oracle price if available (this is what gets updated via Update Price button)
    pricePerUnit = oraclePrice;
    priceSource = '🔮 Oracle (On-Chain)';
  } else if (assetTypeFromDocs === 'UNIQUE' && nftListingPrice > 0) {
    // Priority 2: For NFTs, use listing price from PrimarySaleNFT
    pricePerUnit = nftListingPrice;
    priceSource = '💸 NFT Listing Price';
  } else if (estimatedValue > BigInt(0)) {
    // Priority 3: Fallback to estimatedValue from NFT metadata
    pricePerUnit = Number(estimatedValue);
    priceSource = '📋 Asset Metadata (estimatedValue)';
  } else {
    // Priority 4: Default fallback
    pricePerUnit = 0;
    priceSource = '⚠️ No Price Set';
  }

  // Calculate user's total value (for ERC20 tokens)
  const userTotalValue = parseFloat(userTokenBalance) * pricePerUnit;
  const nftValue = pricePerUnit;

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
      
      // Send transaction to update price in smart contract with currency
      writeContract({
        address: CONTRACT_ADDRESSES.PRICE_ORACLE as `0x${string}`,
        abi: ORACLE_ABI,
        functionName: 'setPrice',
        args: [selectedAssetId, priceInWei, selectedCurrency],
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Page Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center justify-center gap-2">
            <span>🔮</span>
            <span>On-Chain Oracle</span>
          </h1>
          <p className="text-sm text-gray-600">
            Real-time price feeds for tokenized real-world assets
          </p>
        </div>

        {/* ============================================ */}
        {/* SECTION 1: ORACLE OVERVIEW */}
        {/* ============================================ */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-blue-100">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-blue-900">
            <span>📊</span>
            <span>Oracle Overview</span>
          </h2>

          <div className="space-y-3">
            {/* Asset Selector */}
            <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
              <label className="block text-xs text-indigo-600 font-semibold mb-1">
                Select Asset
              </label>
              <select
                value={selectedAssetId.toString()}
                onChange={(e) => setSelectedAssetId(BigInt(e.target.value))}
                className="w-full px-3 py-2 border border-indigo-300 rounded focus:border-indigo-500 focus:outline-none text-sm bg-white"
              >
                {availableAssets.map((asset) => (
                  <option key={asset.id.toString()} value={asset.id.toString()}>
                    {asset.name} ({asset.symbol}) - Asset ID: {asset.id.toString()}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                Choose which tokenized asset you want to view pricing for
              </p>
            </div>

            {/* Asset Name + Last Update on same line */}
            <div className="grid grid-cols-2 gap-3">
              {/* Asset Name */}
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-semibold mb-1">Asset Name</p>
                <p className="text-lg font-bold text-blue-900">
                  {selectedAsset?.name || 'Unknown Asset'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Symbol: {selectedAsset?.symbol} | Asset ID: {selectedAssetId.toString()}
                </p>
              </div>

              {/* Last Update Timestamp */}
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-purple-600 font-semibold mb-1">Last Update</p>
                {isMounted && lastUpdateTimestamp > 0 ? (
                  <>
                    <p className="text-sm font-bold text-purple-900">
                      {new Date(lastUpdateTimestamp * 1000).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {Math.floor((Date.now() / 1000 - lastUpdateTimestamp) / 60)} minutes ago
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500">No updates yet</p>
                )}
              </div>
            </div>

            {/* Current Price per Token + Your Holdings on same line for ERC20 */}
            {assetTypeFromDocs !== 'UNIQUE' && isConnected ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Current Price per Token */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-green-700 font-semibold">Current Price per Token</p>
                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-semibold text-green-600">LIVE</span>
                    </div>
                  </div>
                  
                  {isLoadingPrice ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-green-200 rounded w-2/3 mb-1"></div>
                      <div className="h-3 bg-green-200 rounded w-1/3"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-green-900 mb-1">
                        {pricePerUnit.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} {displayCurrency}
                      </p>
                      <p className="text-xs text-green-700">
                        📊 Source: {priceSource}
                      </p>
                    </>
                  )}
                </div>

                {/* User Holdings - ERC20 */}
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <p className="text-xs text-yellow-700 font-semibold mb-2">Your Holdings</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Tokens Owned:</span>
                      <span className="font-bold text-base text-gray-900">
                        {parseFloat(userTokenBalance).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} / {parseFloat(tokenTotalSupply).toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded p-2 border border-yellow-300">
                      <span className="text-sm text-gray-700 font-semibold">Total Value:</span>
                      <span className="font-bold text-xl text-green-700">
                        {userTotalValue.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} {displayCurrency}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Based on asset price of {pricePerUnit.toLocaleString()} {displayCurrency} per token
                    </p>
                  </div>
                </div>
              </div>
            ) : assetTypeFromDocs !== 'UNIQUE' && !isConnected ? (
              // Show only price if not connected for ERC20
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-green-700 font-semibold">Current Price per Token</p>
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold text-green-600">LIVE</span>
                  </div>
                </div>
                
                {isLoadingPrice ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-green-200 rounded w-2/3 mb-1"></div>
                    <div className="h-3 bg-green-200 rounded w-1/3"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-green-900 mb-1">
                      {pricePerUnit.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} {displayCurrency}
                    </p>
                    <p className="text-xs text-green-700">
                      📊 Source: {priceSource}
                    </p>
                  </>
                )}
              </div>
            ) : null}

            {/* User Holdings for NFT - Full width when it's an NFT */}
            {assetTypeFromDocs === 'UNIQUE' && isConnected && (
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <p className="text-xs text-yellow-700 font-semibold mb-2">Your Holdings</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-semibold">Ownership:</span>
                    <span className={`font-bold text-sm px-3 py-1 rounded-full ${
                      userNftBalance > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {userNftBalance > 0 ? '✅ OWNED' : '❌ NOT OWNED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded p-2 border border-yellow-300">
                    <span className="text-sm text-gray-700 font-semibold">NFT Price:</span>
                    <span className="font-bold text-xl text-green-700">
                      {nftValue.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} {displayCurrency}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Oracle Contract Address */}
            <div className="bg-gray-50 rounded-lg p-3 border">
              <p className="text-xs text-gray-600 font-semibold mb-1">Oracle Smart Contract Address</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs bg-white p-2 rounded border flex-1 break-all text-blue-600">
                  {CONTRACT_ADDRESSES.PRICE_ORACLE}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(CONTRACT_ADDRESSES.PRICE_ORACLE);
                    alert('Address copied to clipboard!');
                  }}
                  className="bg-blue-500 text-white px-3 py-1 text-xs rounded hover:bg-blue-600 transition"
                >
                  📋 Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This address points to the Oracle contract on the blockchain
              </p>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* SECTION 2: ORACLE UPDATE (ADMIN ONLY) */}
        {/* ============================================ */}
        <div className="bg-white rounded-xl shadow-lg p-4 border border-orange-100">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-orange-900">
            <span>⚙️</span>
            <span>Update Oracle Price (Admin Only)</span>
          </h2>

          {/* Connection Status */}
          <div className="mb-3 p-2 bg-gray-50 rounded">
            <p className="text-xs text-gray-600 mb-1">Wallet Status:</p>
            {isConnected ? (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <p className="font-mono text-xs text-green-700">
                  Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <p className="text-xs text-red-600 font-semibold">Not Connected</p>
                <p className="text-xs text-gray-500">(Please connect wallet to update)</p>
              </div>
            )}
          </div>

          {/* Admin Role Status */}
          {isConnected && (
            <div className={`mb-3 p-2 rounded border ${
              userIsOracleAdmin 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <p className="text-xs font-semibold mb-1">
                {userIsOracleAdmin ? '✅ Admin Access' : '🚫 No Admin Access'}
              </p>
              <p className="text-xs text-gray-700">
                {userIsOracleAdmin 
                  ? 'You have ORACLE_ADMIN_ROLE and can update prices for all assets'
                  : 'You do NOT have ORACLE_ADMIN_ROLE. Only the contract admin can update prices.'
                }
              </p>
              {!userIsOracleAdmin && (
                <p className="text-xs text-gray-600 mt-1 italic">
                  💡 Owning tokens does not grant permission to update the Oracle price. This is centralized control.
                </p>
              )}
            </div>
          )}

          {/* Price Input Form */}
          <div className="space-y-3">
            {/* Currency Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none text-sm bg-white"
                disabled={!isConnected || !userIsOracleAdmin || isWriting || isConfirming}
              >
                {AVAILABLE_CURRENCIES.map((currency) => (
                  <option key={currency.symbol} value={currency.symbol}>
                    {currency.emoji} {currency.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select the currency in which you want to set the price
              </p>
            </div>

            {/* Price Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {AVAILABLE_CURRENCIES.find(c => c.symbol === selectedCurrency)?.emoji} New Price ({selectedCurrency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder={`Enter price in ${selectedCurrency} (e.g., ${selectedCurrency === 'WETH' ? '0.5' : '50000.00'})`}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none text-sm"
                disabled={!isConnected || !userIsOracleAdmin || isWriting || isConfirming}
              />
              <p className="text-xs text-gray-500 mt-1">
                {!userIsOracleAdmin && isConnected
                  ? '⚠️ You need ORACLE_ADMIN_ROLE to update prices'
                  : `This price will be stored on-chain in ${selectedCurrency} and visible to all users`}
              </p>
              {userIsOracleAdmin && (
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                  <p className="text-xs text-blue-800">
                    <strong>✨ Priority Update:</strong> Oracle prices are now displayed first! Your update will be visible immediately on all pages.
                  </p>
                </div>
              )}
            </div>

            {/* Update Button */}
            <button
              onClick={handleUpdatePrice}
              disabled={!isConnected || !userIsOracleAdmin || !newPrice || isWriting || isConfirming}
              className={`w-full py-3 rounded font-bold text-sm transition ${
                !isConnected || !userIsOracleAdmin || !newPrice || isWriting || isConfirming
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
              }`}
            >
              {!userIsOracleAdmin && isConnected
                ? '🚫 No Admin Permission'
                : isWriting
                ? '📤 Sending Transaction...'
                : isConfirming
                ? '⏳ Confirming on Blockchain...'
                : '✅ Update Oracle Price'}
            </button>

            {/* Transaction Status Feedback */}
            <div className="min-h-[40px]">
              {isWriting && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <p className="text-sm text-blue-800 font-semibold">⏳ Transaction Pending...</p>
                  <p className="text-xs text-blue-600">Please confirm in your wallet</p>
                </div>
              )}

              {isConfirming && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                  <p className="text-sm text-yellow-800 font-semibold">⏳ Confirming Transaction...</p>
                  <p className="text-xs text-yellow-600">Waiting for blockchain confirmation</p>
                  {transactionHash && (
                    <p className="text-xs font-mono mt-1 text-gray-600 break-all">
                      Tx: {transactionHash}
                    </p>
                  )}
                </div>
              )}

              {isConfirmed && (
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <p className="text-sm text-green-800 font-semibold">✅ Success!</p>
                  <p className="text-xs text-green-600">Oracle price updated on blockchain</p>
                  <p className="text-xs text-gray-600 mt-1">
                    New price will be visible in a few seconds
                  </p>
                </div>
              )}

              {writeError && (
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <p className="text-sm text-red-800 font-semibold">❌ Error</p>
                  <p className="text-xs text-red-600">
                    {writeError.message.includes('ORACLE_ADMIN_ROLE')
                      ? 'You do not have admin permissions to update the oracle'
                      : 'Transaction failed. Please try again.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Note */}
          <div className="mt-3 bg-orange-50 border border-orange-200 rounded p-3">
            <p className="text-xs text-orange-800 mb-2">
              <strong>⚠️ Centralized Governance:</strong> Only accounts with ORACLE_ADMIN_ROLE can update prices.
            </p>
            <ul className="text-xs text-orange-700 space-y-1 ml-4 list-disc">
              <li>The admin role was assigned during contract deployment (usually the deployer address)</li>
              <li>Token holders do NOT have permission to update prices</li>
              <li>This prevents price manipulation but creates centralization</li>
              <li>For decentralized pricing, consider implementing governance voting or using Chainlink</li>
            </ul>
          </div>
        </div>

        {/* ============================================ */}
        {/* SECTION 3: HOW IT WORKS (Educational) */}
        {/* ============================================ */}
        <div className="mt-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl shadow-lg p-4 border border-indigo-100">
          <h3 className="text-lg font-bold mb-3 text-indigo-900">📚 How This Oracle Works</h3>
          
          <div className="space-y-2 text-xs text-indigo-800">
            <div className="bg-white rounded p-3">
              <p className="font-semibold mb-1">1️⃣ Reading Price (Blockchain Read)</p>
              <p className="text-gray-700">
                The page calls <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">getPrice(assetId)</code> on the Oracle smart contract.
                This is a FREE operation that reads data from the blockchain.
              </p>
            </div>

            <div className="bg-white rounded p-3">
              <p className="font-semibold mb-1">2️⃣ Updating Price (Blockchain Write)</p>
              <p className="text-gray-700">
                Admin calls <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">setPrice(assetId, newPrice)</code> which sends a transaction
                to the blockchain. This costs gas and requires ORACLE_ADMIN_ROLE permission.
              </p>
            </div>

            <div className="bg-white rounded p-3">
              <p className="font-semibold mb-1">3️⃣ Data Storage</p>
              <p className="text-gray-700">
                All price data is stored ON-CHAIN in the Oracle smart contract, making it transparent,
                immutable, and accessible to any other smart contract or application.
              </p>
            </div>

            <div className="bg-white rounded p-3">
              <p className="font-semibold mb-1">4️⃣ Use Cases</p>
              <p className="text-gray-700">
                Other DeFi protocols can read this oracle to determine collateral values, execute trades,
                calculate portfolio worth, or trigger automated actions based on asset prices.
              </p>
            </div>

            <div className="bg-white rounded p-3">
              <p className="font-semibold mb-1">5️⃣ Price Source Priority</p>
              <p className="text-gray-700 mb-2">
                The displayed price comes from multiple sources in this priority order:
              </p>
              <ol className="text-gray-700 ml-4 space-y-1" style={{listStyleType: 'decimal'}}>
                <li><strong>🔮 Oracle Price</strong>: If an admin has set a price via Update Price, this is shown first</li>
                <li><strong>💸 NFT Listing</strong>: For NFTs, active listing prices from marketplace</li>
                <li><strong>📋 Asset Metadata</strong>: estimatedValue stored when the asset was created</li>
              </ol>
              <p className="text-gray-700 mt-2">
                <strong>⚡ This means:</strong> When you update the Oracle price, it becomes visible immediately across all pages!
              </p>
            </div>

            <div className="bg-white rounded p-3">
              <p className="font-semibold mb-1">6️⃣ Currency Selection</p>
              <p className="text-gray-700">
                The Oracle contract stores only the <strong>numeric price value</strong>, not the currency denomination.
                The currency selection (USDC, USDT, WETH, USD) is a UI convention to help interpret the stored number.
                Applications reading the oracle must agree on which currency the price represents.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
