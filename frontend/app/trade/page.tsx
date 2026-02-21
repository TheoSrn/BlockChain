'use client';

/**
 * Page Trade - Swap et Ajout de Liquidité via Uniswap V2
 * Avec vérification KYC et interface DeFi moderne
 */

import { useAccount, useReadContract, useBalance } from 'wagmi';
import { useState, useEffect } from 'react';
import { useKYCStatus } from '@/hooks/web3/useKYCStatus';
import { useTradingPool, useTradingPoolWrite } from '@/hooks/web3/useTradingPool';
import { useSwapWrite } from '@/hooks/web3/useSwap'; // Keep for createPool only
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { Address, formatUnits, parseUnits } from 'viem';
import FACTORY_ABI from '@/abi/Factory';
import ASSET_NFT_ABI from '@/abi/AssetNFT';
import ORACLE_ABI from '@/abi/Oracle';
import { ASSET_POOL_ABI } from '@/abi/AssetPool';
import { PRIMARY_SALE_ABI } from '@/abi/PrimarySale';
import { PRIMARY_SALE_NFT_ABI } from '@/abi/PrimarySaleNFT';
import { useWriteContract } from 'wagmi';

// ERC20 ABI pour lire symbol et decimals
const ERC20_ABI = [
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Uniswap V2 Factory ABI
const UNISWAP_V2_FACTORY_ABI = [
  {
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' }
    ],
    name: 'getPair',
    outputs: [{ name: 'pair', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Tokens disponibles pour swap
const AVAILABLE_TOKENS = [
  { address: CONTRACT_ADDRESSES.USDC, symbol: 'USDC' },
  { address: CONTRACT_ADDRESSES.USDT, symbol: 'USDT' },
];

// Adresses de test temporaires pour simulation (à remplacer par vraies adresses)
const TEST_TOKENS = [
  { address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', symbol: 'USDC' },
  { address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0', symbol: 'USDT' },
  { address: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6', symbol: 'WETH' },
];

// Tokens réels déployés sur Sepolia
// Note: Les TestERC20 utilisent 18 decimals (valeur par défaut), pas 6
const REAL_TOKENS = [
  { address: CONTRACT_ADDRESSES.USDC, symbol: 'USDC', decimals: 18 },
  { address: CONTRACT_ADDRESSES.USDT, symbol: 'USDT', decimals: 18 },
  { address: CONTRACT_ADDRESSES.WETH, symbol: 'WETH', decimals: 18 },
];

// Adresse du contrat PrimarySale (à mettre à jour après déploiement)
const PRIMARY_SALE_ADDRESS = (process.env.NEXT_PUBLIC_PRIMARY_SALE_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;

// Adresse du contrat PrimarySaleNFT pour les NFTs (Exclusive Properties)
const PRIMARY_SALE_NFT_ADDRESS = (process.env.NEXT_PUBLIC_PRIMARY_SALE_NFT_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;

// Helper function to extract asset type from documents field
function getTokenType(documents: string): string {
  if (!documents) return 'DIVISIBLE';
  if (documents === 'DIVISIBLE' || documents === 'UNIQUE') return documents;
  const parts = documents.split('|').map((p: string) => p.trim());
  return parts[0] || documents;
}

type Tab = 'swap' | 'liquidity' | 'mintwrap' | 'buyassets' | 'pendingorders';

export default function TradePage() {
  const { address, isConnected } = useAccount();
  const { kycStatus } = useKYCStatus();
  const [activeTab, setActiveTab] = useState<Tab>('swap');

  if (!isConnected) {
    return (
      <div className="page-readable container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-12 text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-800">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to start trading</p>
        </div>
      </div>
    );
  }

  // Vérification KYC : Seuls les utilisateurs whitelisted peuvent trader
  const canTrade = kycStatus?.canTrade ?? false;

  return (
    <div className="page-readable container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Trade</h1>
        <p className="text-gray-600">Swap tokens and manage liquidity on Uniswap</p>
      </div>

      {/* KYC Warning */}
      {!canTrade && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div className="flex-1">
              <h3 className="font-bold text-red-800 mb-2">Trading Restricted - Whitelisted Users Only</h3>
              <p className="text-red-700 text-sm mb-3">
                Only verified and whitelisted users can trade. Complete KYC verification and wait for admin approval to access trading features.
              </p>
              <div className="space-y-2 mb-3">
                <p className="text-xs text-red-600">• KYC Verified: {kycStatus?.isKYCVerified ? '✅' : '❌'}</p>
                <p className="text-xs text-red-600">• Whitelisted: {kycStatus?.isWhitelisted ? '✅' : '❌'}</p>
                <p className="text-xs text-red-600">• Blacklisted: {kycStatus?.isBlacklisted ? '🚫' : '✅'}</p>
              </div>
              <a
                href="/kyc"
                className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
              >
                Go to KYC Page
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('swap')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'swap'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            🔄 Swap
          </button>
          <button
            onClick={() => setActiveTab('liquidity')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'liquidity'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            💧 Liquidity
          </button>
          <button
            onClick={() => setActiveTab('mintwrap')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'mintwrap'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            🪙 Mint/Wrap
          </button>
          <button
            onClick={() => setActiveTab('buyassets')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'buyassets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            🏠 Buy Assets
          </button>
          <button
            onClick={() => setActiveTab('pendingorders')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'pendingorders'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            📬 Pending Orders
          </button>
        </div>
      </div>

      {/* Layout: Content principal + Balances à droite */}
      <div className={`flex flex-col gap-6 ${canTrade ? 'lg:flex-row' : ''}`}>
        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === 'swap' ? (
            <SwapTab canTrade={canTrade} userAddress={address!} />
          ) : activeTab === 'liquidity' ? (
            <LiquidityTab canTrade={canTrade} userAddress={address!} />
          ) : activeTab === 'mintwrap' ? (
            <MintWrapTab userAddress={address!} canTrade={canTrade} />
          ) : activeTab === 'buyassets' ? (
            <BuyAssetsTab userAddress={address!} canTrade={canTrade} />
          ) : (
            <PendingOrdersTab userAddress={address!} canTrade={canTrade} />
          )}
        </div>

        {/* Token Balances - VISIBLE UNIQUEMENT SI WHITELISTÉ */}
        {canTrade && (
          <div className="lg:w-80">
            <TokenBalancesTable userAddress={address!} />
          </div>
        )}
      </div>
    </div>
  );
}

// ===== SWAP TAB =====
function SwapTab({ canTrade, userAddress }: { canTrade: boolean; userAddress: string }) {
  const [tokenInAddress, setTokenInAddress] = useState<Address>(REAL_TOKENS[0].address as Address);
  const [tokenOutAddress, setTokenOutAddress] = useState<Address>(REAL_TOKENS[1].address as Address);
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState(0.5);

  // Lire les informations des tokens
  const { data: decimalsIn } = useReadContract({
    address: tokenInAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  const { data: decimalsOut } = useReadContract({
    address: tokenOutAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  const { data: symbolIn } = useReadContract({
    address: tokenInAddress,
    abi: ERC20_ABI,
    functionName: 'symbol',
  });

  const { data: symbolOut } = useReadContract({
    address: tokenOutAddress,
    abi: ERC20_ABI,
    functionName: 'symbol',
  });

  // Lire les balances
  const { data: balanceIn, refetch: refetchBalanceIn, isLoading: isLoadingBalanceIn, isFetching: isFetchingBalanceIn } = useReadContract({
    address: tokenInAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress as Address],
    query: {
      enabled: !!tokenInAddress && !!userAddress && tokenInAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 5_000,
      gcTime: 0, // Don't cache
      staleTime: 0, // Consider data immediately stale
    }
  });

  const { data: balanceOut, refetch: refetchBalanceOut, isLoading: isLoadingBalanceOut, isFetching: isFetchingBalanceOut } = useReadContract({
    address: tokenOutAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress as Address],
    query: {
      enabled: !!tokenOutAddress && !!userAddress && tokenOutAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 5_000,
      gcTime: 0, // Don't cache
      staleTime: 0, // Consider data immediately stale
    }
  });

  // Hook TradingPool pour les calculs (avec vérification KYC on-chain)
  const {
    expectedOutput,
    priceImpact,
    pairAddress,
    needsApproval,
    refetchAllowance,
    canTrade: canTradeOnChain,
    tradingPoolAddress,
  } = useTradingPool(
    tokenInAddress,
    tokenOutAddress,
    amountIn,
    decimalsIn as number || 18,
    decimalsOut as number || 18
  );

  const {
    approveToken,
    executeSwap,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  } = useTradingPoolWrite();

  // Reset amount when token changes
  useEffect(() => {
    setAmountIn('');
    // Force refetch of balances when tokens change
    refetchBalanceIn();
    refetchBalanceOut();
  }, [tokenInAddress, tokenOutAddress, refetchBalanceIn, refetchBalanceOut]);

  // Refetch balances and allowance when transaction succeeds
  useEffect(() => {
    if (isSuccess) {
      console.log('✅ Transaction successful! Refreshing data...');
      setTimeout(() => {
        refetchBalanceIn();
        refetchBalanceOut();
        refetchAllowance(); // Refetch allowance after approval
      }, 2000); // Wait 2s for blockchain to confirm
    }
  }, [isSuccess, refetchBalanceIn, refetchBalanceOut, refetchAllowance]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 SwapTab Debug:', {
      tokenInAddress,
      tokenOutAddress,
      symbolIn,
      symbolOut,
      decimalsIn,
      decimalsOut,
      balanceIn: balanceIn?.toString(),
      balanceOut: balanceOut?.toString(),
      isLoadingBalanceIn,
      isLoadingBalanceOut,
      userAddress,
    });
  }, [balanceIn, balanceOut, tokenInAddress, tokenOutAddress, symbolIn, symbolOut, decimalsIn, decimalsOut, isLoadingBalanceIn, isLoadingBalanceOut, userAddress]);

  const handleSwap = () => {
    if (!canTrade) {
      alert('❌ Trading Restricted: Only whitelisted users can trade. Please complete KYC verification and wait for admin approval.');
      return;
    }

    if (!amountIn || parseFloat(amountIn) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Vérifier le balance
    const balanceInFormatted = balanceIn 
      ? parseFloat(formatUnits(balanceIn as bigint, decimalsIn as number || 18))
      : 0;

    if (parseFloat(amountIn) > balanceInFormatted) {
      alert(`Insufficient balance. You have ${balanceInFormatted.toFixed(4)} ${symbolIn}`);
      return;
    }

    if (!pairAddress || pairAddress === '0x0000000000000000000000000000000000000000') {
      alert('⚠️ No liquidity pool found for this pair. Please choose different tokens or add liquidity first.');
      return;
    }

    if (needsApproval) {
      // Approve first
      approveToken(tokenInAddress, amountIn, decimalsIn as number || 18);
    } else {
      // Execute swap via TradingPool (KYC enforced on-chain)
      const minOutput = (parseFloat(expectedOutput) * (100 - slippage)) / 100;
      executeSwap(
        tokenInAddress,
        tokenOutAddress,
        amountIn,
        minOutput.toString(),
        decimalsIn as number || 18,
        decimalsOut as number || 18
      );
    }
  };

  const handleMaxClick = () => {
    if (balanceIn && decimalsIn) {
      const max = formatUnits(balanceIn as bigint, decimalsIn as number);
      setAmountIn(max);
    }
  };

  const exchangeRate =
    amountIn && parseFloat(amountIn) > 0 && parseFloat(expectedOutput) > 0
      ? (parseFloat(expectedOutput) / parseFloat(amountIn)).toFixed(6)
      : '0';

  const balanceInFormatted = isLoadingBalanceIn || isFetchingBalanceIn
    ? '⏳...'
    : balanceIn !== undefined && decimalsIn !== undefined
    ? parseFloat(formatUnits(balanceIn as bigint, decimalsIn as number)).toFixed(4)
    : decimalsIn === undefined
    ? '🔄...'  // Loading decimals
    : '0.0000';

  const balanceOutFormatted = isLoadingBalanceOut || isFetchingBalanceOut
    ? '⏳...'
    : balanceOut !== undefined && decimalsOut !== undefined
    ? parseFloat(formatUnits(balanceOut as bigint, decimalsOut as number)).toFixed(4)
    : decimalsOut === undefined
    ? '🔄...'  // Loading decimals
    : '0.0000';

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white border rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Swap Tokens</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Slippage:</span>
            <span className="font-semibold text-blue-600">{slippage}%</span>
          </div>
        </div>

        {/* Token In */}
        <div className="mb-2">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-700 text-sm font-semibold">From</label>
            <div className="text-xs text-gray-500">
              Balance: <span className="font-semibold text-gray-900">{balanceInFormatted}</span> {symbolIn}
            </div>
          </div>
          <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50 hover:border-blue-300 transition-colors">
            <div className="flex justify-between items-center mb-3">
              <input
                type="number"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                placeholder="0.0"
                className="text-3xl font-bold bg-transparent outline-none w-full"
                step="any"
              />
              <button
                onClick={handleMaxClick}
                disabled={!balanceIn || parseFloat(balanceInFormatted) === 0}
                className={`ml-2 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  balanceIn && parseFloat(balanceInFormatted) > 0
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between items-center">
              <select
                value={tokenInAddress}
                onChange={(e) => setTokenInAddress(e.target.value as Address)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm cursor-pointer hover:bg-blue-700 transition-colors"
              >
                {REAL_TOKENS.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </select>
              {amountIn && parseFloat(amountIn) > 0 && (
                <span className="text-sm text-gray-600">
                  ≈ ${(parseFloat(amountIn) * 1).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center my-3">
          <button
            onClick={() => {
              const temp = tokenInAddress;
              setTokenInAddress(tokenOutAddress);
              setTokenOutAddress(temp);
              setAmountIn('');
            }}
            className="bg-white border-2 border-gray-300 rounded-full p-3 hover:bg-gray-50 transition-all hover:border-blue-400 hover:shadow-md group"
          >
            <svg 
              className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* Token Out */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-700 text-sm font-semibold">To (estimated)</label>
            <div className="text-xs text-gray-500">
              Balance: <span className="font-semibold text-gray-900">{balanceOutFormatted}</span> {symbolOut}
            </div>
          </div>
          <div className="border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="flex justify-between items-center mb-3">
              <div className="text-3xl font-bold text-gray-800">
                {expectedOutput && parseFloat(expectedOutput) > 0 
                  ? parseFloat(expectedOutput).toFixed(6) 
                  : '0.0'}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <select
                value={tokenOutAddress}
                onChange={(e) => setTokenOutAddress(e.target.value as Address)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm cursor-pointer hover:bg-purple-700 transition-colors"
              >
                {REAL_TOKENS.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </select>
              {expectedOutput && parseFloat(expectedOutput) > 0 && (
                <span className="text-sm text-gray-600">
                  ≈ ${(parseFloat(expectedOutput) * 1).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Swap Details */}
        {pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000' && amountIn && parseFloat(amountIn) > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6 space-y-3 border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 text-sm">Exchange Rate</span>
              <span className="font-bold text-gray-900">
                1 {symbolIn} = {exchangeRate} {symbolOut}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 text-sm">Price Impact</span>
              <span className={`font-bold ${priceImpact > 5 ? 'text-red-600' : priceImpact > 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                {priceImpact > 0 ? `~${priceImpact.toFixed(2)}%` : 'Calculating...'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 text-sm">Min. Received</span>
              <span className="font-bold text-gray-900">
                {((parseFloat(expectedOutput) * (100 - slippage)) / 100).toFixed(6)} {symbolOut}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 text-sm">Network Fee</span>
              <span className="font-bold text-gray-900">~0.3%</span>
            </div>
          </div>
        )}

        {/* Slippage Settings */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-3 text-sm font-semibold">Slippage Tolerance</label>
          <div className="flex gap-2">
            {[0.1, 0.5, 1.0, 3.0].map((value) => (
              <button
                key={value}
                onClick={() => setSlippage(value)}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                  slippage === value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Your transaction will revert if the price changes unfavorably by more than this percentage.
          </p>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!canTrade || isPending || isConfirming || !amountIn || parseFloat(amountIn) <= 0}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            canTrade && amountIn && parseFloat(amountIn) > 0 && !isPending && !isConfirming
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {!canTrade
            ? '🔒 KYC Required'
            : isPending
            ? '⏳ Waiting for approval...'
            : isConfirming
            ? '⏳ Confirming transaction...'
            : needsApproval
            ? `✓ Approve ${symbolIn} first`
            : '🔄 Swap Tokens'}
        </button>

        {/* Transaction Status */}
        {hash && (
          <div className="mt-4 bg-blue-50 border border-blue-300 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-semibold mb-1">Transaction Submitted</p>
            <a
              href={`https://sepolia.etherscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-700 hover:text-blue-900 underline font-mono"
            >
              {hash.slice(0, 10)}...{hash.slice(-8)} ↗
            </a>
          </div>
        )}

        {isSuccess && (
          <div className="mt-4 bg-green-50 border border-green-300 rounded-lg p-4">
            <p className="text-sm text-green-900 font-bold">✅ Swap executed successfully!</p>
            <p className="text-xs text-green-700 mt-1">Your tokens have been swapped.</p>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-300 rounded-lg p-4">
            <p className="text-sm text-red-900 font-bold">❌ Transaction Failed</p>
            <p className="text-xs text-red-700 mt-1">{error.message}</p>
          </div>
        )}

        {/* Pool Info */}
        {!pairAddress || pairAddress === '0x0000000000000000000000000000000000000000' ? (
          <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
            <p className="text-sm text-yellow-900 font-bold mb-1">⚠️ No Liquidity Pool</p>
            <p className="text-xs text-yellow-800">
              No liquidity pool exists for this token pair. Please choose different tokens or create a pool in the Liquidity tab.
            </p>
          </div>
        ) : (
          <div className="mt-6 p-4 bg-purple-50 border border-purple-300 rounded-xl">
            <p className="text-xs text-purple-900 font-semibold mb-1">Liquidity Pool Address:</p>
            <a
              href={`https://sepolia.etherscan.io/address/${pairAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-purple-700 hover:text-purple-900 underline"
            >
              {pairAddress.slice(0, 20)}...{pairAddress.slice(-18)} ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== LIQUIDITY TAB =====
function LiquidityTab({ canTrade, userAddress }: { canTrade: boolean; userAddress: string }) {
  const [tokenAAddress, setTokenAAddress] = useState<Address>(REAL_TOKENS[0].address as Address);
  const [tokenBAddress, setTokenBAddress] = useState<Address>(REAL_TOKENS[1].address as Address);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [slippage, setSlippage] = useState(0.5);

  const { data: decimalsA } = useReadContract({
    address: tokenAAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  const { data: decimalsB } = useReadContract({
    address: tokenBAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  const { data: symbolA } = useReadContract({
    address: tokenAAddress,
    abi: ERC20_ABI,
    functionName: 'symbol',
  });

  const { data: symbolB } = useReadContract({
    address: tokenBAddress,
    abi: ERC20_ABI,
    functionName: 'symbol',
  });

  // Lire les balances
  const { data: balanceA, isLoading: isLoadingBalanceA, refetch: refetchBalanceA } = useReadContract({
    address: tokenAAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress as Address],
    query: {
      enabled: !!tokenAAddress && !!userAddress,
      refetchInterval: 5_000,
    }
  });

  const { data: balanceB, isLoading: isLoadingBalanceB, refetch: refetchBalanceB } = useReadContract({
    address: tokenBAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress as Address],
    query: {
      enabled: !!tokenBAddress && !!userAddress,
      refetchInterval: 5_000,
    }
  });

  // Obtenir l'adresse du TradingPool pour les approvals
  const TRADING_POOL_ADDRESS = CONTRACT_ADDRESSES.TRADING_POOL as Address;

  // Vérifier si le pool existe
  const { data: pairAddress, refetch: refetchPair } = useReadContract({
    address: CONTRACT_ADDRESSES.UNISWAP_FACTORY as Address,
    abi: UNISWAP_V2_FACTORY_ABI,
    functionName: 'getPair',
    args: [tokenAAddress, tokenBAddress],
    query: {
      enabled: !!tokenAAddress && !!tokenBAddress,
      refetchInterval: 5_000, // Rafraîchir toutes les 5 secondes
    },
  });

  const poolExists = pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000';

  // Lire les allowances pour vérifier si les tokens sont approuvés (pour TRADING_POOL)
  const { data: allowanceA, refetch: refetchAllowanceA } = useReadContract({
    address: tokenAAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress as Address, TRADING_POOL_ADDRESS],
    query: {
      enabled: !!tokenAAddress && !!userAddress,
      refetchInterval: 3_000,
    }
  });

  const { data: allowanceB, refetch: refetchAllowanceB } = useReadContract({
    address: tokenBAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress as Address, TRADING_POOL_ADDRESS],
    query: {
      enabled: !!tokenBAddress && !!userAddress,
      refetchInterval: 3_000,
    }
  });

  // Hook TradingPool pour addLiquidity (avec vérification KYC on-chain)
  const { 
    addLiquidity, 
    approveToken, 
    hash: tradingPoolHash, 
    isPending: isTradingPoolPending, 
    isConfirming: isTradingPoolConfirming, 
    isSuccess: isTradingPoolSuccess, 
    error: tradingPoolError 
  } = useTradingPoolWrite();

  // Hook Uniswap direct pour createPool uniquement (Factory ne supporte pas de middleman)
  const { 
    createPool, 
    hash: createPoolHash, 
    isPending: isCreatePoolPending, 
    isConfirming: isCreatePoolConfirming, 
    isSuccess: isCreatePoolSuccess, 
    error: createPoolError 
  } = useSwapWrite();

  // Combiner les états pour l'UI
  const hash = tradingPoolHash || createPoolHash;
  const isPending = isTradingPoolPending || isCreatePoolPending;
  const isConfirming = isTradingPoolConfirming || isCreatePoolConfirming;
  const isSuccess = isTradingPoolSuccess || isCreatePoolSuccess;
  const error = tradingPoolError || createPoolError;

  // Reset amounts when tokens change
  useEffect(() => {
    setAmountA('');
    setAmountB('');
  }, [tokenAAddress, tokenBAddress]);

  // Force refetch after successful transaction
  useEffect(() => {
    if (isSuccess) {
      console.log('✅ Liquidity operation successful! Refreshing data...');
      setTimeout(() => {
        refetchPair();
        refetchBalanceA();
        refetchBalanceB();
        refetchAllowanceA(); // Refetch allowances after approval
        refetchAllowanceB();
      }, 2000); // Wait 2s for blockchain to confirm
    }
  }, [isSuccess, refetchPair, refetchBalanceA, refetchBalanceB, refetchAllowanceA, refetchAllowanceB]);

  // Format balances
  const balanceAFormatted = isLoadingBalanceA
    ? '⏳...'
    : balanceA !== undefined && decimalsA !== undefined
    ? parseFloat(formatUnits(balanceA as bigint, decimalsA as number)).toFixed(4)
    : '0.0000';

  const balanceBFormatted = isLoadingBalanceB
    ? '⏳...'
    : balanceB !== undefined && decimalsB !== undefined
    ? parseFloat(formatUnits(balanceB as bigint, decimalsB as number)).toFixed(4)
    : '0.0000';

  // Handlers pour les boutons MAX
  const handleMaxA = () => {
    if (balanceA && decimalsA) {
      const maxAmount = formatUnits(balanceA as bigint, decimalsA as number);
      setAmountA(maxAmount);
    }
  };

  const handleMaxB = () => {
    if (balanceB && decimalsB) {
      const maxAmount = formatUnits(balanceB as bigint, decimalsB as number);
      setAmountB(maxAmount);
    }
  };

  const handleCreatePool = () => {
    if (!canTrade) {
      alert('❌ KYC Required: Only whitelisted users can create pools. Please complete KYC verification first.');
      return;
    }

    if (tokenAAddress === tokenBAddress) {
      alert('Cannot create pool with same tokens');
      return;
    }

    if (window.confirm(`Create liquidity pool for ${symbolA}/${symbolB}?\n\nThis will create a new trading pair on Uniswap V2.`)) {
      createPool(tokenAAddress, tokenBAddress);
    }
  };

  // Vérifier si les tokens sont suffisamment approuvés
  const amountABigInt = amountA && decimalsA ? parseUnits(amountA, decimalsA as number) : BigInt(0);
  const amountBBigInt = amountB && decimalsB ? parseUnits(amountB, decimalsB as number) : BigInt(0);

  const needsApprovalA = allowanceA !== undefined && amountABigInt > BigInt(0)
    ? (allowanceA as bigint) < amountABigInt
    : false;

  const needsApprovalB = allowanceB !== undefined && amountBBigInt > BigInt(0)
    ? (allowanceB as bigint) < amountBBigInt
    : false;

  const handleApproveA = () => {
    if (!amountA || parseFloat(amountA) <= 0) {
      alert('Please enter amount for Token A first');
      return;
    }
    approveToken(tokenAAddress, amountA, decimalsA as number || 18);
  };

  const handleApproveB = () => {
    if (!amountB || parseFloat(amountB) <= 0) {
      alert('Please enter amount for Token B first');
      return;
    }
    approveToken(tokenBAddress, amountB, decimalsB as number || 18);
  };

  const handleAddLiquidity = () => {
    if (!canTrade) {
      alert('❌ Trading Restricted: Only whitelisted users can add liquidity. Please complete KYC verification and wait for admin approval.');
      return;
    }

    if (!amountA || !amountB || parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0) {
      alert('Please enter valid amounts');
      return;
    }

    // Vérifier le pool
    if (!poolExists) {
      alert('⚠️ No liquidity pool found for this pair. The pool needs to be created first. Run the createLiquidityPools.ts script or choose different tokens.');
      return;
    }

    // Vérifier les balances
    if (balanceA && decimalsA) {
      const balanceANum = parseFloat(formatUnits(balanceA as bigint, decimalsA as number));
      if (parseFloat(amountA) > balanceANum) {
        alert(`Insufficient ${symbolA} balance. You have ${balanceANum.toFixed(4)} ${symbolA}`);
        return;
      }
    }

    if (balanceB && decimalsB) {
      const balanceBNum = parseFloat(formatUnits(balanceB as bigint, decimalsB as number));
      if (parseFloat(amountB) > balanceBNum) {
        alert(`Insufficient ${symbolB} balance. You have ${balanceBNum.toFixed(4)} ${symbolB}`);
        return;
      }
    }

    // Ajouter la liquidité via TradingPool (KYC enforced on-chain)
    addLiquidity(
      tokenAAddress,
      tokenBAddress,
      amountA,
      amountB,
      decimalsA as number || 18,
      decimalsB as number || 18,
      slippage
    );
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white border rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Add Liquidity</h2>

        {/* Token A */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-700 text-sm font-semibold">Token A</label>
            <div className="text-xs text-gray-500">
              Balance: <span className="font-semibold text-gray-900">{balanceAFormatted}</span> {symbolA}
            </div>
          </div>
          <div className="border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-br from-green-50 to-blue-50">
            <div className="flex justify-between items-center mb-3">
              <input
                type="number"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                placeholder="0.0"
                className="text-3xl font-bold bg-transparent outline-none w-full"
              />
              <button
                onClick={handleMaxA}
                disabled={!balanceA || balanceA === BigInt(0)}
                className={`ml-2 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  balanceA && balanceA > BigInt(0)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between items-center">
              <select
                value={tokenAAddress}
                onChange={(e) => setTokenAAddress(e.target.value as Address)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm cursor-pointer hover:bg-blue-700 transition-colors"
              >
                {REAL_TOKENS.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </select>
              {amountA && parseFloat(amountA) > 0 && (
                <span className="text-sm text-gray-600">
                  ≈ ${(parseFloat(amountA) * 1).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center my-3">
          <button
            onClick={() => {
              const temp = tokenAAddress;
              const tempAmount = amountA;
              setTokenAAddress(tokenBAddress);
              setTokenBAddress(temp);
              setAmountA(amountB);
              setAmountB(tempAmount);
            }}
            className="bg-white border-2 border-gray-200 rounded-full p-3 hover:bg-gray-50 transition-colors shadow-sm hover:shadow"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* Token B */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-700 text-sm font-semibold">Token B</label>
            <div className="text-xs text-gray-500">
              Balance: <span className="font-semibold text-gray-900">{balanceBFormatted}</span> {symbolB}
            </div>
          </div>
          <div className="border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="flex justify-between items-center mb-3">
              <input
                type="number"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                placeholder="0.0"
                className="text-3xl font-bold bg-transparent outline-none w-full"
              />
              <button
                onClick={handleMaxB}
                disabled={!balanceB || balanceB === BigInt(0)}
                className={`ml-2 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  balanceB && balanceB > BigInt(0)
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between items-center">
              <select
                value={tokenBAddress}
                onChange={(e) => setTokenBAddress(e.target.value as Address)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm cursor-pointer hover:bg-purple-700 transition-colors"
              >
                {REAL_TOKENS.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </select>
              {amountB && parseFloat(amountB) > 0 && (
                <span className="text-sm text-gray-600">
                  ≈ ${(parseFloat(amountB) * 1).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Liquidity Details */}
        {amountA && amountB && parseFloat(amountA) > 0 && parseFloat(amountB) > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Price Ratio</span>
              <span className="font-semibold">
                1 {symbolA} = {(parseFloat(amountB) / parseFloat(amountA)).toFixed(6)} {symbolB}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Slippage Tolerance</span>
              <span className="font-semibold">{slippage}%</span>
            </div>
          </div>
        )}

        {/* Slippage Settings */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-2 text-sm font-semibold">Slippage Tolerance</label>
          <div className="flex gap-2">
            {[0.1, 0.5, 1.0, 3.0].map((value) => (
              <button
                key={value}
                onClick={() => setSlippage(value)}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  slippage === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        {!poolExists && tokenAAddress !== tokenBAddress ? (
          // Create Pool Button (when pool doesn't exist)
          <button
            onClick={handleCreatePool}
            disabled={!canTrade || isPending || isConfirming}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
              canTrade && !isPending && !isConfirming
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isPending ? 'Creating Pool...' : isConfirming ? 'Confirming...' : '🏊 Create Liquidity Pool'}
          </button>
        ) : poolExists && needsApprovalA ? (
          // Approve Token A
          <button
            onClick={handleApproveA}
            disabled={!canTrade || isPending || isConfirming || !amountA || parseFloat(amountA) <= 0}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
              canTrade && amountA && parseFloat(amountA) > 0 && !isPending && !isConfirming
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isPending ? 'Approving...' : isConfirming ? 'Confirming...' : `✓ Approve ${symbolA} (Step 1/2)`}
          </button>
        ) : poolExists && needsApprovalB ? (
          // Approve Token B
          <button
            onClick={handleApproveB}
            disabled={!canTrade || isPending || isConfirming || !amountB || parseFloat(amountB) <= 0}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
              canTrade && amountB && parseFloat(amountB) > 0 && !isPending && !isConfirming
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isPending ? 'Approving...' : isConfirming ? 'Confirming...' : `✓ Approve ${symbolB} (Step 2/2)`}
          </button>
        ) : poolExists ? (
          // Add Liquidity Button (when both tokens are approved)
          <button
            onClick={handleAddLiquidity}
            disabled={
              !canTrade ||
              isPending ||
              isConfirming ||
              !amountA ||
              !amountB ||
              parseFloat(amountA) <= 0 ||
              parseFloat(amountB) <= 0
            }
            className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
              canTrade && amountA && amountB && !isPending && !isConfirming
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isPending ? 'Adding Liquidity...' : isConfirming ? 'Confirming...' : '💧 Add Liquidity'}
          </button>
        ) : null}

        {/* Pool Status Warning */}
        {!poolExists && tokenAAddress !== tokenBAddress && (
          <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-400 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏊</span>
              <div>
                <p className="font-bold text-blue-800 mb-1">Create New Pool</p>
                <p className="text-sm text-blue-700 mb-2">
                  This token pair doesn't have a liquidity pool yet. Click the button above to create it! 
                </p>
                <p className="text-xs text-blue-600">
                  💡 After creating the pool, you'll be able to add liquidity and enable trading for this pair.
                </p>
              </div>
            </div>
          </div>
        )}

        {poolExists && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✅ Pool exists: {pairAddress?.slice(0, 10)}...{pairAddress?.slice(-8)}
            </p>
          </div>
        )}

        {/* Transaction Status */}
        {hash && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
            </p>
          </div>
        )}

        {isSuccess && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 font-semibold">✅ Liquidity added successfully!</p>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">❌ {error.message}</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Adding liquidity will give you LP tokens that represent your share of the
            pool. You'll earn 0.3% of all trades proportional to your share.
          </p>
        </div>

        {/* Your Liquidity Positions */}
        {poolExists && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-3">Your Liquidity Positions</h3>
            <YourLiquidityPositions 
              userAddress={userAddress}
              poolAddress={pairAddress as Address}
              symbolA={symbolA as string}
              symbolB={symbolB as string}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ===== YOUR LIQUIDITY POSITIONS =====
const PAIR_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getReserves',
    outputs: [
      { name: 'reserve0', type: 'uint112' },
      { name: 'reserve1', type: 'uint112' },
      { name: 'blockTimestampLast', type: 'uint32' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token0',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token1',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

function YourLiquidityPositions({ 
  userAddress, 
  poolAddress, 
  symbolA, 
  symbolB 
}: { 
  userAddress: string; 
  poolAddress: Address;
  symbolA: string;
  symbolB: string;
}) {
  // Lire le balance de LP tokens
  const { data: lpBalance, isLoading: isLoadingLpBalance } = useReadContract({
    address: poolAddress,
    abi: PAIR_ABI,
    functionName: 'balanceOf',
    args: [userAddress as Address],
    query: {
      enabled: !!poolAddress && !!userAddress,
      refetchInterval: 5_000, // Rafraîchir toutes les 5 secondes
    }
  });

  // Lire le total supply de LP tokens
  const { data: totalSupply } = useReadContract({
    address: poolAddress,
    abi: PAIR_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!poolAddress,
      refetchInterval: 5_000,
    }
  });

  // Lire les réserves du pool
  const { data: reserves } = useReadContract({
    address: poolAddress,
    abi: PAIR_ABI,
    functionName: 'getReserves',
    query: {
      enabled: !!poolAddress,
      refetchInterval: 5_000,
    }
  });

  // Lire token0  
  const { data: token0 } = useReadContract({
    address: poolAddress,
    abi: PAIR_ABI,
    functionName: 'token0',
    query: {
      enabled: !!poolAddress,
    }
  });

  if (isLoadingLpBalance) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-500">⏳ Loading your positions...</p>
      </div>
    );
  }

  if (!lpBalance || lpBalance === BigInt(0)) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-500">No liquidity positions yet</p>
      </div>
    );
  }

  const lpBalanceFormatted = formatUnits(lpBalance as bigint, 18);
  const poolShare = totalSupply 
    ? (Number(lpBalance) * 100 / Number(totalSupply)).toFixed(4)
    : '0';

  // Calculer votre part des réserves
  let reserve0Formatted = '0';
  let reserve1Formatted = '0';
  if (reserves && totalSupply && lpBalance) {
    const reservesArray = reserves as [bigint, bigint, number];
    const userShare = Number(lpBalance) / Number(totalSupply);
    reserve0Formatted = (Number(formatUnits(reservesArray[0], 18)) * userShare).toFixed(4);
    reserve1Formatted = (Number(formatUnits(reservesArray[1], 18)) * userShare).toFixed(4);
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border-2 border-purple-200">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Your LP Tokens</span>
          <span className="font-bold text-lg">{parseFloat(lpBalanceFormatted).toFixed(6)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Pool Share</span>
          <span className="font-semibold text-purple-700">{poolShare}%</span>
        </div>

        <div className="pt-3 border-t border-purple-200">
          <p className="text-xs text-gray-600 mb-2">Your Pooled Tokens:</p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">{symbolA}</span>
              <span className="font-semibold">{reserve0Formatted}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">{symbolB}</span>
              <span className="font-semibold">{reserve1Formatted}</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-purple-200">
          <p className="text-xs text-gray-600">
            💰 Earning 0.3% fees on all trades proportional to your share
          </p>
        </div>
      </div>
    </div>
  );
}

// ===== TOKEN BALANCES TABLE =====
import { useMemo } from 'react';

function TokenBalancesTable({ userAddress }: { userAddress: string }) {
  // Helper hooks to know if user owns assets of each type
  const FractionalSection = () => {
    const [show, setShow] = useState(false);
    return <AssetBalances userAddress={userAddress} type="DIVISIBLE" onHasAssets={setShow} renderSection={show} sectionTitle="Fractional Properties" sectionIcon="🏢" sectionColor="blue" />;
  };
  const ExclusiveSection = () => {
    const [show, setShow] = useState(false);
    return <AssetBalances userAddress={userAddress} type="UNIQUE" onHasAssets={setShow} renderSection={show} sectionTitle="Exclusive Properties" sectionIcon="🏡" sectionColor="yellow" />;
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm lg:sticky lg:top-4">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span>💰</span>
        <span>Your Balances</span>
      </h3>
      <div className="space-y-3">
        {/* ETH Balance */}
        <TokenBalanceRow 
          address={null} 
          symbol="ETH" 
          decimals={18}
          userAddress={userAddress} 
        />
        {/* ERC20 Tokens */}
        {REAL_TOKENS.map((token) => (
          <TokenBalanceRow
            key={token.address}
            address={token.address as Address}
            symbol={token.symbol}
            decimals={token.decimals}
            userAddress={userAddress}
          />
        ))}
      </div>
      {/* Fractional Properties Section (conditionally rendered) */}
      <FractionalSection />
      {/* Exclusive Properties Section (conditionally rendered) */}
      <ExclusiveSection />
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Balances update automatically
        </p>
      </div>
    </div>
  );
}

// ===== ASSET BALANCES (TOKENIZED ASSETS) =====
function AssetBalances({ userAddress, type, onHasAssets, renderSection = true, sectionTitle, sectionIcon, sectionColor }: {
  userAddress: string,
  type: 'DIVISIBLE' | 'UNIQUE',
  onHasAssets?: (has: boolean) => void,
  renderSection?: boolean,
  sectionTitle?: string,
  sectionIcon?: string,
  sectionColor?: string
}) {
  const factoryAddress = CONTRACT_ADDRESSES.ASSET_FACTORY as Address;
  const [ownedAssets, setOwnedAssets] = useState<number[]>([]);
  const [hasChecked, setHasChecked] = useState(false);

  // Get total number of assets
  const { data: assetCount } = useReadContract({
    address: factoryAddress,
    abi: FACTORY_ABI,
    functionName: 'assetCount',
    query: {
      enabled: factoryAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 30_000,
    }
  });
  const totalAssets = assetCount ? Number(assetCount) : 0;

  // Hook pour chaque asset pour vérifier s'il correspond au type et si user a balance > 0
  useEffect(() => {
    if (totalAssets > 0 && userAddress && !hasChecked) {
      setHasChecked(true);
      // On va simplement lister les IDs d'assets et laisser AssetBalanceRow gérer l'affichage
      const assetIds = Array.from({ length: totalAssets }, (_, i) => i + 1);
      setOwnedAssets(assetIds);
      if (onHasAssets) onHasAssets(assetIds.length > 0);
    } else if (totalAssets === 0) {
      setOwnedAssets([]);
      if (onHasAssets) onHasAssets(false);
    }
  }, [totalAssets, userAddress, hasChecked, onHasAssets]);

  if (!renderSection) return null;
  if (totalAssets === 0) {
    return null;
  }

  return (
    <div className={`mt-4 pt-4 border-t border-${sectionColor}-300`}>
      <h4 className={`text-sm font-semibold text-${sectionColor}-600 mb-3 flex items-center gap-2`}>
        <span>{sectionIcon}</span>
        <span>{sectionTitle}</span>
      </h4>
      <div className="space-y-2">
        {ownedAssets.map(assetId => (
          <AssetBalanceRowByType 
            key={assetId} 
            assetId={BigInt(assetId)} 
            userAddress={userAddress} 
            filterType={type}
          />
        ))}
      </div>
    </div>
  );
}

// ===== ASSET BALANCE ROW =====
function AssetBalanceRow({ 
  assetId, 
  userAddress,
  onHasBalance 
}: { 
  assetId: bigint; 
  userAddress: string;
  onHasBalance?: (has: boolean) => void;
}) {
  const factoryAddress = CONTRACT_ADDRESSES.ASSET_FACTORY as Address;

  // Récupérer les infos de l'asset
  const { data: assetData } = useReadContract({
    address: factoryAddress,
    abi: FACTORY_ABI,
    functionName: 'getAsset',
    args: [assetId],
    query: {
      enabled: factoryAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 30_000,
    }
  });

  // Extract token address and symbol from assetData
  // AssetRecord: { id, nft, token, pool, name, symbol, active }
  const tokenAddress = assetData ? (assetData as any).token as Address : null;
  const tokenSymbol = assetData ? (assetData as any).symbol as string : '';
  const isActive = assetData ? (assetData as any).active as boolean : false;

  // Récupérer le balance du token
  const { data: balance } = useReadContract({
    address: tokenAddress as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress as Address],
    query: {
      enabled: !!tokenAddress,
      refetchInterval: 10_000,
    }
  });

  // Récupérer les decimals du token
  const { data: decimals } = useReadContract({
    address: tokenAddress as Address,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress,
    }
  });

  // Calculer le balance en entier (int) - AVANT les return conditionnels
  const balanceInt = balance && decimals
    ? Number(formatUnits(balance as bigint, decimals as number))
    : 0;

  // Notifier le parent qu'on a un asset avec balance > 0 - HOOK TOUJOURS APPELÉ
  useEffect(() => {
    if (balanceInt > 0 && onHasBalance) {
      onHasBalance(true);
    }
  }, [balanceInt, onHasBalance]);

  // Conditions de non-affichage APRÈS tous les hooks
  if (!tokenAddress || !isActive) {
    return null;
  }

  // Ne pas afficher si balance = 0
  if (balanceInt === 0) {
    return null;
  }

  // Formater en entier avec séparateurs de milliers
  const displayBalance = Math.floor(balanceInt).toLocaleString('en-US');

  return (
    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg hover:from-purple-100 hover:to-blue-100 transition-colors border border-purple-200">
      <div className="flex items-center gap-2">
        <span className="text-xl">🏢</span>
        <div>
          <p className="font-semibold text-gray-800 text-sm">{tokenSymbol}</p>
          <p className="text-xs text-gray-500">Asset #{assetId.toString()}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono text-sm font-semibold text-purple-900">
          {displayBalance}
        </p>
      </div>
    </div>
  );
}

// ===== TOKEN BALANCE ROW =====
function TokenBalanceRow({ 
  address, 
  symbol, 
  decimals,
  userAddress 
}: { 
  address: Address | null; 
  symbol: string; 
  decimals: number;
  userAddress: string;
}) {
  // Pour ETH natif
  const { data: ethBalance } = useBalance({
    address: userAddress as Address,
    query: {
      enabled: address === null,
      refetchInterval: 10_000, // Rafraîchir toutes les 10s
    }
  });

  // Pour les tokens ERC20
  const { data: tokenBalance } = useReadContract({
    address: address as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress as Address],
    query: {
      enabled: address !== null,
      refetchInterval: 10_000,
    }
  });

  // Formater le balance
  const formattedBalance = address === null 
    ? ethBalance ? formatUnits(ethBalance.value, ethBalance.decimals) : '0'
    : tokenBalance 
      ? formatUnits(tokenBalance as bigint, decimals)
      : '0';

  const displayBalance = formattedBalance 
    ? parseFloat(formattedBalance).toFixed(4)
    : '0.0000';

  // Icône selon le token
  const getIcon = () => {
    if (symbol === 'ETH') return '💎';
    if (symbol === 'WETH') return '🔷';
    if (symbol === 'USDC') return '💵';
    if (symbol === 'USDT') return '💲';
    return '🪙';
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-xl">{getIcon()}</span>
        <span className="font-semibold text-gray-800">{symbol}</span>
      </div>
      <div className="text-right">
        <p className="font-mono text-sm font-semibold text-gray-900">
          {displayBalance}
        </p>
      </div>
    </div>
  );
}

// ===== ASSET OPTION (pour dropdown dans Buy Assets) =====
function AssetOption({ assetId, factoryAddress }: { assetId: number; factoryAddress: Address }) {
  const { data: assetData } = useReadContract({
    address: factoryAddress,
    abi: FACTORY_ABI,
    functionName: 'getAsset',
    args: [BigInt(assetId)],
    query: {
      enabled: factoryAddress !== '0x0000000000000000000000000000000000000000',
    }
  });

  const assetSymbol = assetData ? (assetData as any).symbol as string : '';
  const assetName = assetData ? (assetData as any).name as string : '';

  return `${assetSymbol || `Asset #${assetId}`} - ${assetName || `Asset #${assetId}`}`;
}

// ===== ASSET DROPDOWN =====
function AssetDropdown({ 
  assets, 
  selectedAssetId, 
  onSelect, 
  factoryAddress,
  filterType
}: { 
  assets: any[]; 
  selectedAssetId: string; 
  onSelect: (id: string) => void;
  factoryAddress: Address;
  filterType: 'DIVISIBLE' | 'UNIQUE';
}) {
  const [assetNames, setAssetNames] = useState<{ [key: number]: { symbol: string; name: string } }>({});

  // Load asset data for all assets
  useEffect(() => {
    const loadAssetData = async () => {
      const names: { [key: number]: { symbol: string; name: string } } = {};
      for (const asset of assets) {
        // This is a workaround - ideally we'd use batch calls
        names[asset.id] = { symbol: `Asset #${asset.id}`, name: '' };
      }
      setAssetNames(names);
    };
    if (assets.length > 0) {
      loadAssetData();
    }
  }, [assets]);

  return (
    <select
      value={selectedAssetId}
      onChange={e => onSelect(e.target.value)}
      className="w-full px-4 py-3 border rounded-lg text-lg"
    >
      <option value="">-- Choose an asset --</option>
      {assets.map(asset => (
        <AssetOptionWrapper 
          key={asset.id} 
          assetId={asset.id} 
          factoryAddress={factoryAddress}
          filterType={filterType}
        />
      ))}
    </select>
  );
}

// Wrapper component to fetch and render each option
function AssetOptionWrapper({ 
  assetId, 
  factoryAddress,
  filterType
}: { 
  assetId: number; 
  factoryAddress: Address;
  filterType: 'DIVISIBLE' | 'UNIQUE';
}) {
  const { data: assetData } = useReadContract({
    address: factoryAddress,
    abi: FACTORY_ABI,
    functionName: 'getAsset',
    args: [BigInt(assetId)],
    query: {
      enabled: factoryAddress !== '0x0000000000000000000000000000000000000000',
    }
  });

  const assetSymbol = assetData ? (assetData as any).symbol as string : '';
  const assetName = assetData ? (assetData as any).name as string : '';
  const nftAddress = assetData ? (assetData as any).nft as Address : null;

  // Récupérer les métadonnées du NFT pour obtenir le champ documents
  const { data: metadataData } = useReadContract({
    address: nftAddress as Address,
    abi: ASSET_NFT_ABI,
    functionName: 'getMetadata',
    query: {
      enabled: !!nftAddress,
    }
  });

  const documents = metadataData ? (metadataData as any).documents as string : '';
  const assetType = getTokenType(documents);

  // Ne pas afficher si ne correspond pas au type filtré
  if (assetType !== filterType) {
    return null;
  }

  const displayText = assetName || assetSymbol || `Asset #${assetId}`;

  return (
    <option value={assetId}>
      {displayText}
    </option>
  );
}

// ===== BUY ASSETS TAB =====
function BuyAssetsTab({ userAddress, canTrade }: { userAddress: Address; canTrade: boolean }) {
  const factoryAddress = CONTRACT_ADDRESSES.ASSET_FACTORY as Address;
  const [assetType, setAssetType] = useState<'DIVISIBLE' | 'UNIQUE'>('DIVISIBLE');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [sellerAddress, setSellerAddress] = useState<string>('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Force quantity to 1 for UNIQUE assets
  useEffect(() => {
    if (assetType === 'UNIQUE') {
      setQuantity('1');
    }
  }, [assetType]);

  // Get total number of assets
  const { data: assetCount } = useReadContract({
    address: factoryAddress,
    abi: FACTORY_ABI,
    functionName: 'assetCount',
    query: {
      enabled: factoryAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 30_000,
    }
  });
  const totalAssets = assetCount ? Number(assetCount) : 0;

  // Liste des assets disponibles (on va les filtrer côté client)
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);

  useEffect(() => {
    const fetchAvailableAssets = async () => {
      const assets: any[] = [];
      for (let i = 1; i <= totalAssets; i++) {
        // Note: ideally use useReadContract in a loop or batch call
        // For now we'll just list all IDs
        assets.push({ id: i });
      }
      setAvailableAssets(assets);
    };
    if (totalAssets > 0) {
      fetchAvailableAssets();
    }
  }, [totalAssets]);

  // Get selected asset data
  const { data: selectedAssetData } = useReadContract({
    address: factoryAddress,
    abi: FACTORY_ABI,
    functionName: 'getAsset',
    args: selectedAssetId ? [BigInt(selectedAssetId)] : undefined,
    query: {
      enabled: !!selectedAssetId && factoryAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 30_000,
    }
  });

  const assetTokenAddress = selectedAssetData ? (selectedAssetData as any).token as Address : null;
  const assetPoolAddress = selectedAssetData ? (selectedAssetData as any).pool as Address : null;
  const assetSymbol = selectedAssetData ? (selectedAssetData as any).symbol as string : '';
  const assetNFTAddress = selectedAssetData ? (selectedAssetData as any).nft as Address : null;

  // Get NFT metadata to retrieve estimatedValue and payment token info
  const { data: nftMetadata } = useReadContract({
    address: assetNFTAddress as Address,
    abi: ASSET_NFT_ABI,
    functionName: 'getMetadata',
    query: {
      enabled: !!assetNFTAddress,
      refetchInterval: 30_000,
    }
  });

  // Extract documents from NFT metadata (not from AssetRecord which doesn't have it)
  const assetDocuments = nftMetadata ? (nftMetadata as any).documents as string : '';
  const assetTypeFromDocs = getTokenType(assetDocuments);

  // Get price info from documents (format: "DIVISIBLE|USDC" or "UNIQUE|USDT")
  // Documents are stored as "tokenType|paymentToken" during asset creation
  let paymentTokenSymbolFromMetadata = 'USDC'; // Default fallback
  
  if (assetDocuments && assetDocuments.includes('|')) {
    const parts = assetDocuments.split('|');
    if (parts.length >= 2) {
      const tokenFromDocs = parts[1]?.trim();
      // Validate it's a known token (USDC, USDT, WETH)
      if (tokenFromDocs && (tokenFromDocs === 'USDC' || tokenFromDocs === 'USDT' || tokenFromDocs === 'WETH')) {
        paymentTokenSymbolFromMetadata = tokenFromDocs;
        console.log('✅ Payment token from asset NFT metadata:', paymentTokenSymbolFromMetadata, '| Full documents:', assetDocuments);
      } else {
        console.warn('⚠️ Unknown payment token in documents:', tokenFromDocs, '| Full documents:', assetDocuments, '- Using default USDC');
      }
    } else {
      console.warn('⚠️ Documents split failed, parts:', parts, '| Full documents:', assetDocuments);
    }
  } else {
    console.warn('⚠️ Asset documents not in expected format (tokenType|paymentToken):', assetDocuments, '- Using default USDC');
  }

  // Get total supply to calculate price per token
  const { data: tokenTotalSupply } = useReadContract({
    address: assetTokenAddress as Address,
    abi: ERC20_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!assetTokenAddress,
      refetchInterval: 30_000,
    }
  });

  // Extract estimatedValue from metadata
  const estimatedValue = nftMetadata ? (nftMetadata as any).estimatedValue as bigint : BigInt(0);
  
  // Get Oracle price (priority over estimatedValue)
  const { data: oraclePriceData } = useReadContract({
    address: CONTRACT_ADDRESSES.PRICE_ORACLE as `0x${string}`,
    abi: ORACLE_ABI,
    functionName: 'getPrice',
    args: selectedAssetId ? [BigInt(selectedAssetId)] : undefined,
    query: {
      enabled: !!selectedAssetId,
      refetchInterval: 10_000,
    },
  });

  let oraclePrice = 0;
  let oracleCurrency = '';
  if (oraclePriceData) {
    const [price, , currency] = oraclePriceData as [bigint, bigint, string];
    if (price > BigInt(0)) {
      oraclePrice = parseFloat(formatUnits(price, 6));
      oracleCurrency = currency || '';
    }
  }

  // IMPORTANT: Use Oracle currency for payment token if available (reflects admin updates)
  // Otherwise fallback to metadata payment token (set during asset creation)
  const paymentTokenSymbol = oracleCurrency || paymentTokenSymbolFromMetadata;
  const paymentTokenAddress = REAL_TOKENS.find(t => t.symbol === paymentTokenSymbol)?.address || REAL_TOKENS[0].address;

  // Determine display currency: use Oracle currency if available, otherwise metadata paymentToken
  const displayCurrency = oracleCurrency || paymentTokenSymbolFromMetadata || 'USDC';
  
  // Debug logs (can be removed later)
  if (selectedAssetId && nftMetadata) {
    console.log('Asset Debug Info:', {
      assetId: selectedAssetId,
      assetSymbol: assetSymbol,
      assetDocuments: assetDocuments,
      assetType: assetTypeFromDocs,
      paymentTokenFromMetadata: paymentTokenSymbolFromMetadata,
      oracleCurrency: oracleCurrency,
      paymentTokenFinal: paymentTokenSymbol,
      paymentTokenAddress: paymentTokenAddress,
      estimatedValue: estimatedValue.toString(),
      estimatedValueNumber: Number(estimatedValue),
      totalSupply: tokenTotalSupply?.toString(),
      oraclePrice: oraclePrice,
      displayCurrency: displayCurrency,
    });
  }
  
  // Calculate price per token
  // Priority: Oracle price > estimatedValue (to reflect admin updates via Oracle page)
  let pricePerUnit = 100; // Default fallback
  
  if (oraclePrice > 0) {
    // Priority 1: Use Oracle price if available
    pricePerUnit = oraclePrice;
  } else if (estimatedValue > BigInt(0)) {
    const estimatedValueNumber = Number(estimatedValue); // Raw number, not wei
    
    if (assetTypeFromDocs === 'UNIQUE') {
      // For unique assets, the price is the full estimated value
      pricePerUnit = estimatedValueNumber;
    } else if (tokenTotalSupply && tokenTotalSupply > BigInt(0)) {
      // For divisible assets, price = estimatedValue
      pricePerUnit = estimatedValueNumber;
    }
  }

  const handleMaxQuantity = () => {
    if (maxAffordable > 0) {
      setQuantity(maxAffordable.toString());
    }
  };

  // Hook pour les transactions
  const { writeContract } = useWriteContract();

  // Vérifier l'allowance pour PrimarySale (ERC20)
  const { 
    data: currentAllowanceERC20, 
    refetch: refetchAllowanceERC20 
  } = useReadContract({
    address: paymentTokenAddress as Address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress as Address, PRIMARY_SALE_ADDRESS],
    query: {
      enabled: !!paymentTokenAddress && !!userAddress && PRIMARY_SALE_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 10_000,
    }
  });

  // Vérifier l'allowance pour PrimarySaleNFT (NFT)
  const { 
    data: currentAllowanceNFT, 
    refetch: refetchAllowanceNFT 
  } = useReadContract({
    address: paymentTokenAddress as Address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress as Address, PRIMARY_SALE_NFT_ADDRESS],
    query: {
      enabled: !!paymentTokenAddress && !!userAddress && PRIMARY_SALE_NFT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 10_000,
    }
  });

  // Vérifier si l'asset est listé sur PrimarySale
  const { data: listingData, refetch: refetchListing } = useReadContract({
    address: PRIMARY_SALE_ADDRESS,
    abi: PRIMARY_SALE_ABI,
    functionName: 'getListing',
    args: [assetTokenAddress as Address],
    query: {
      enabled: !!assetTokenAddress && PRIMARY_SALE_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 10_000,
    }
  });

  const listing = listingData as any;
  const isListed = listing && listing.active;
  const availableForSale = isListed ? Number(formatUnits(listing.availableAmount || BigInt(0), 18)) : 0;

  // Prix fixé par le vendeur (depuis listing ou estimatedValue/pricePerUnit)
  const fixedPricePerToken = isListed && listing.pricePerToken
    ? Number(formatUnits(listing.pricePerToken, 18))
    : pricePerUnit;

  // Calculer le prix total et le max abordable APRÈS avoir fixedPricePerToken
  const totalPrice = parseFloat(quantity || '0') * fixedPricePerToken;

  // Get user balance of payment token
  const { data: userPaymentBalance } = useReadContract({
    address: paymentTokenAddress as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress as Address],
    query: {
      enabled: !!paymentTokenAddress && !!userAddress,
      refetchInterval: 10_000,
    }
  });

  const userPaymentBalanceFormatted = userPaymentBalance
    ? Number(formatUnits(userPaymentBalance as bigint, 18))
    : 0;

  const maxAffordable = fixedPricePerToken > 0 ? Math.floor(userPaymentBalanceFormatted / fixedPricePerToken) : 0;

  // Vérifier le balance du vendeur pour l'asset sélectionné (DIVISIBLE only)
  const { data: sellerAssetBalance } = useReadContract({
    address: assetTokenAddress as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [sellerAddress as Address],
    query: {
      enabled: !!assetTokenAddress && !!sellerAddress && sellerAddress.startsWith('0x') && sellerAddress.length === 42 && assetType === 'DIVISIBLE',
      refetchInterval: 10_000,
    }
  });

  const sellerAssetBalanceFormatted = sellerAssetBalance
    ? Number(formatUnits(sellerAssetBalance as bigint, 18))
    : 0;

  // For UNIQUE assets (NFTs), verify who actually owns the NFT
  const tokenId = selectedAssetId ? BigInt(selectedAssetId) : undefined;
  const { data: nftOwner, refetch: refetchNFTOwner } = useReadContract({
    address: assetNFTAddress as Address,
    abi: [
      {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "ownerOf",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'ownerOf',
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!assetNFTAddress && !!tokenId && assetType === 'UNIQUE',
      refetchInterval: 2_000, // Refetch every 2 seconds for fresh ownership data
      refetchOnMount: 'always', // Always refetch when component mounts
      staleTime: 0, // Data is always considered stale
    }
  });

  const nftOwnerAddress = nftOwner ? (nftOwner as Address).toLowerCase() : null;
  const isOwnedByUser = nftOwnerAddress === userAddress.toLowerCase();
  const isOwnedBySeller = nftOwnerAddress === sellerAddress.toLowerCase();

  // Force refetch when seller address or asset changes
  useEffect(() => {
    if (assetType === 'UNIQUE' && assetNFTAddress && tokenId) {
      refetchNFTOwner();
    }
  }, [sellerAddress, selectedAssetId, assetType, assetNFTAddress, tokenId]);

  // Auto-fill seller if listing exists
  useEffect(() => {
    if (isListed && listing && !sellerAddress) {
      setSellerAddress(listing.seller);
    }
  }, [isListed, listing, sellerAddress]);

  const handleBuy = async () => {
    if (!selectedAssetId || !assetTokenAddress) {
      setError('Please select an asset');
      return;
    }

    if (!sellerAddress || !sellerAddress.startsWith('0x') || sellerAddress.length !== 42) {
      setError('Please enter a valid seller address');
      return;
    }

    if (!fixedPricePerToken || fixedPricePerToken <= 0) {
      setError('Price not available for this asset');
      return;
    }

    if (!paymentTokenAddress) {
      setError('Payment token not found');
      return;
    }

    // VALIDATION: Vérifier que le payment token correspond au listing actif
    if (isListed && listing.paymentToken) {
      const listingPaymentToken = (listing.paymentToken as Address).toLowerCase();
      const selectedPaymentToken = paymentTokenAddress.toLowerCase();
      
      if (listingPaymentToken !== selectedPaymentToken) {
        // Trouver le symbole du token demandé par le listing
        const listingTokenSymbol = REAL_TOKENS.find(t => t.address.toLowerCase() === listingPaymentToken)?.symbol || 'Unknown';
        
        setError(`❌ Payment token mismatch! This asset accepts ${listingTokenSymbol} only, but the asset metadata indicates ${paymentTokenSymbol}. Please contact the asset creator to fix the metadata.`);
        console.error('Payment token mismatch:', {
          listingPaymentToken,
          selectedPaymentToken,
          listingTokenSymbol,
          paymentTokenSymbol
        });
        return;
      }
    }

    // Vérifier que le bon contrat est déployé selon le type d'asset
    if (assetType === 'UNIQUE') {
      if (PRIMARY_SALE_NFT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        setError('⚠️ PrimarySaleNFT contract not deployed. Please deploy it first.');
        return;
      }
    } else {
      if (PRIMARY_SALE_ADDRESS === '0x0000000000000000000000000000000000000000') {
        setError('⚠️ PrimarySale contract not deployed. Please deploy it first.');
        return;
      }
    }

    const quantityNum = parseFloat(quantity || '0');
    if (quantityNum <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    // Vérifier que le vendeur a assez de tokens (sauf pour NFT où on vérifie la possession)
    if (assetType === 'DIVISIBLE' && sellerAssetBalanceFormatted < quantityNum) {
      setError(`❌ Seller only has ${sellerAssetBalanceFormatted.toFixed(2)} tokens. You're trying to buy ${quantityNum}.`);
      return;
    }

    // For UNIQUE assets (NFTs), verify ownership before creating order
    if (assetType === 'UNIQUE') {
      if (!nftOwnerAddress) {
        setError('❌ Cannot verify NFT ownership. Please try again.');
        return;
      }

      if (isOwnedByUser) {
        setError('❌ You already own this NFT! You cannot buy it from yourself.');
        return;
      }

      if (!isOwnedBySeller) {
        setError(`❌ The seller (${sellerAddress}) does not own this NFT. Current owner: ${nftOwnerAddress}. Please check the seller address.`);
        return;
      }
    }

    setIsPurchasing(true);
    setError(null);
    setTxHash(null);

    console.log('=== STARTING BUY TRANSACTION ===');
    console.log('Payment Token Symbol:', paymentTokenSymbol);
    console.log('Payment Token Address:', paymentTokenAddress);
    console.log('Asset Type:', assetType);
    console.log('================================');

    try {
      // Distinction NFT vs ERC20
      const isNFT = assetType === 'UNIQUE';
      
      // Sélectionner le bon allowance et refetch selon le type
      const currentAllowance = isNFT ? currentAllowanceNFT : currentAllowanceERC20;
      const refetchAllowance = isNFT ? refetchAllowanceNFT : refetchAllowanceERC20;
      const contractAddress = isNFT ? PRIMARY_SALE_NFT_ADDRESS : PRIMARY_SALE_ADDRESS;
      
      // Montant total à payer (même pour NFT et ERC20)
      const totalPriceWei = parseUnits(totalPrice.toString(), 18);

      if (isNFT) {
        // ===== LOGIQUE NFT =====
        const tokenId = BigInt(selectedAssetId); // Pour les NFTs, assetId = tokenId
        const priceWei = parseUnits(pricePerUnit.toString(), 18);

        console.log('=== NFT BUY ORDER DEBUG ===');
        console.log('NFT Contract:', assetNFTAddress);
        console.log('Token ID:', tokenId.toString());
        console.log('Seller:', sellerAddress);
        console.log('Payment token:', paymentTokenAddress);
        console.log('Price (wei):', priceWei.toString());
        console.log('Your balance:', userPaymentBalanceFormatted, paymentTokenSymbol);

        // Vérifier l'allowance pour USDC
        const currentAllowanceValue = currentAllowance ? (currentAllowance as bigint) : BigInt(0);
        console.log('Current allowance:', currentAllowanceValue.toString());
        
        if (currentAllowanceValue < priceWei) {
          console.log('❗ Need approval. Requesting approve transaction...');
          
          try {
            // Approuver le token de paiement pour le contrat PrimarySaleNFT
            writeContract(
              {
                address: paymentTokenAddress as Address,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [PRIMARY_SALE_NFT_ADDRESS, priceWei],
                gas: BigInt(100000),
              },
              {
                onSuccess: () => {
                  console.log('✅ Approval successful!');
                  setTimeout(() => {
                    refetchAllowance();
                  }, 3000);
                },
                onError: (error) => {
                  console.error('❌ Approval failed:', error);
                  setError(`Approval failed: ${error.message}`);
                  setIsPurchasing(false);
                }
              }
            );
          } catch (approveError: any) {
            console.error('❌ Approve transaction error:', approveError);
            setError(`Approval error: ${approveError.message || 'Unknown error'}`);
            setIsPurchasing(false);
            return;
          }

          console.log('⏳ Waiting for approval confirmation (5s)...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          await refetchAllowance();
        } else {
          console.log('✅ Already approved, proceeding to create NFT buy order...');
        }

        console.log('📝 Creating NFT buy order transaction...');

        // Créer une proposition d'achat pour le NFT
        writeContract(
          {
            address: PRIMARY_SALE_NFT_ADDRESS,
            abi: PRIMARY_SALE_NFT_ABI,
            functionName: 'createBuyOrder',
            args: [
              assetNFTAddress as Address,
              tokenId,
              sellerAddress as Address,
              paymentTokenAddress as Address,
              priceWei
            ],
            gas: BigInt(500000),
          },
          {
            onSuccess: () => {
              console.log('✅ NFT Buy order created successfully!');
              setTxHash('✅ NFT Order submitted! Waiting for seller to approve NFT and accept...');
              setError(null);
              setIsPurchasing(false);
              
              // Rafraîchir le listing
              setTimeout(() => {
                refetchListing();
              }, 2000);
              
              // Réinitialiser le formulaire après succès
              setTimeout(() => {
                setQuantity('1');
                setTxHash(null);
              }, 5000);
            },
            onError: (error) => {
              console.error('❌ Create NFT buy order failed:', error);
              setError(`Transaction failed: ${error.message}`);
              setIsPurchasing(false);
            }
          }
        );

      } else {
        // ===== LOGIQUE ERC20 (DIVISIBLE) =====
        const amountInWei = parseUnits(quantity, 18);
        const pricePerTokenWei = BigInt(fixedPricePerToken);

        console.log('=== ERC20 BUY ORDER DEBUG ===');
        console.log('Asset token:', assetTokenAddress);
        console.log('Seller:', sellerAddress);
        console.log('Payment token:', paymentTokenAddress);
        console.log('Price per token (wei):', pricePerTokenWei.toString());
        console.log('Amount (wei):', amountInWei.toString());
        console.log('Total price (wei):', totalPriceWei.toString());
        console.log('Your balance:', userPaymentBalanceFormatted, paymentTokenSymbol);
        console.log('Seller balance:', sellerAssetBalanceFormatted, 'tokens');

        // Vérifier l'allowance
        const currentAllowanceValue = currentAllowance ? (currentAllowance as bigint) : BigInt(0);
        console.log('Current allowance:', currentAllowanceValue.toString());
        
        if (currentAllowanceValue < totalPriceWei) {
          console.log('❗ Need approval. Requesting approve transaction...');
          
          try {
            // Approuver le token de paiement pour le contrat PrimarySale
            writeContract(
              {
                address: paymentTokenAddress as Address,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [PRIMARY_SALE_ADDRESS, totalPriceWei],
                gas: BigInt(100000),
              },
              {
                onSuccess: () => {
                  console.log('✅ Approval successful!');
                  setTimeout(() => {
                    refetchAllowance();
                  }, 3000);
                },
                onError: (error) => {
                  console.error('❌ Approval failed:', error);
                  setError(`Approval failed: ${error.message}`);
                  setIsPurchasing(false);
                }
              }
            );
          } catch (approveError: any) {
            console.error('❌ Approve transaction error:', approveError);
            setError(`Approval error: ${approveError.message || 'Unknown error'}`);
            setIsPurchasing(false);
            return;
          }

          console.log('⏳ Waiting for approval confirmation (5s)...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          await refetchAllowance();
        } else {
          console.log('✅ Already approved, proceeding to create buy order...');
        }

        console.log('📝 Creating buy order transaction...');

        // Créer une proposition d'achat (vendeur devra approuver)
        writeContract(
          {
            address: PRIMARY_SALE_ADDRESS,
            abi: PRIMARY_SALE_ABI,
            functionName: 'createBuyOrder',
            args: [
              assetTokenAddress as Address,
              sellerAddress as Address,
              paymentTokenAddress as Address,
              pricePerTokenWei,
              amountInWei
            ],
            gas: BigInt(500000),
          },
          {
            onSuccess: () => {
              console.log('✅ Buy order created successfully!');
              setTxHash('✅ Order submitted! Waiting for seller to approve...');
              setError(null);
              setIsPurchasing(false);
              
              // Rafraîchir le listing
              setTimeout(() => {
                refetchListing();
              }, 2000);
              
              // Réinitialiser le formulaire après succès
              setTimeout(() => {
                setQuantity('1');
                setTxHash(null);
              }, 5000);
            },
            onError: (error) => {
              console.error('❌ Create buy order failed:', error);
              setError(`Transaction failed: ${error.message}`);
              setIsPurchasing(false);
            }
          }
        );
      }

    } catch (e: any) {
      console.error('❌ Purchase error:', e);
      const errorMessage = e.message || 'Purchase failed';
      
      // Messages d'erreur plus clairs
      if (errorMessage.includes('KYC_REQUIRED')) {
        setError('❌ KYC verification required to trade');
      } else if (errorMessage.includes('INSUFFICIENT_SELLER_BALANCE')) {
        setError('❌ Seller does not have enough tokens');
      } else if (errorMessage.includes('INSUFFICIENT_BUYER_BALANCE')) {
        setError(`❌ Insufficient ${paymentTokenSymbol} balance. You need ${totalPrice.toFixed(2)} but have ${userPaymentBalanceFormatted.toFixed(2)}`);
      } else if (errorMessage.includes('INSUFFICIENT_BUYER_ALLOWANCE')) {
        setError('❌ Approval failed. Please try again.');
      } else if (errorMessage.includes('NOT_LISTED')) {
        setError('❌ This asset is not listed for sale');
      } else if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        setError('⚠️ Transaction cancelled by user');
      } else {
        setError(`❌ ${errorMessage}`);
      }
      
      setIsPurchasing(false);
    }
  };

  // Filter available assets by type (simple list for now)
  const filteredAssets = availableAssets;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">🏠 Buy Real Estate Assets</h2>
      <p className="text-gray-600 mb-6">Purchase tokenized real estate assets (fractional or exclusive properties).</p>

      {/* Sélection du type de propriété */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-2 font-semibold">Property Type</label>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setAssetType('DIVISIBLE');
              setSelectedAssetId('');
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              assetType === 'DIVISIBLE'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🏢 Fractional Properties
          </button>
          <button
            onClick={() => {
              setAssetType('UNIQUE');
              setSelectedAssetId('');
              setQuantity('1');
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              assetType === 'UNIQUE'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🏡 Exclusive Properties
          </button>
        </div>
      </div>

      {/* Sélection de l'asset */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-2 font-semibold">Select Asset</label>
        <AssetDropdown
          assets={filteredAssets}
          selectedAssetId={selectedAssetId}
          onSelect={setSelectedAssetId}
          factoryAddress={factoryAddress}
          filterType={assetType}
        />
        {selectedAssetId && assetSymbol && (
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">
              Selected: <span className="font-semibold">{assetSymbol}</span> (Type: {assetTypeFromDocs})
            </p>
            <p className="text-xs text-blue-600 flex items-center gap-1">
              <span>{paymentTokenSymbol === 'USDC' ? '💵' : paymentTokenSymbol === 'USDT' ? '💲' : '💎'}</span>
              <span>Payment token: <strong>{paymentTokenSymbol}</strong> {oracleCurrency ? '(from Oracle)' : '(from asset metadata)'}</span>
            </p>
            {isListed && listing.paymentToken && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span>✓</span>
                <span>Active listing accepts: <strong>{getTokenSymbol(listing.paymentToken as Address)}</strong></span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Seller Address */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-2 font-semibold">Seller Address</label>
        <input
          type="text"
          value={sellerAddress}
          onChange={e => setSellerAddress(e.target.value)}
          placeholder="0x..."
          className="w-full px-4 py-3 border rounded-lg"
        />
        {isListed && (
          <p className="mt-2 text-xs text-green-600">✓ Listing found - seller auto-filled</p>
        )}
        {assetType === 'DIVISIBLE' && sellerAddress && sellerAddress.length === 42 && assetTokenAddress && (
          <p className="mt-2 text-xs text-blue-600">
            📊 Seller balance: <strong>{sellerAssetBalanceFormatted.toFixed(2)}</strong> tokens
            {sellerAssetBalanceFormatted === 0 && (
              <span className="ml-1 text-red-600">⚠️ Seller has no tokens!</span>
            )}
          </p>
        )}
        {assetType === 'UNIQUE' && selectedAssetId && nftOwnerAddress && (
          <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs font-semibold text-blue-800 mb-1">🔍 NFT Ownership Verification:</p>
            <p className="text-xs text-blue-700">
              Current owner: <code className="bg-white px-1 py-0.5 rounded text-[10px]">{nftOwnerAddress}</code>
            </p>
            {isOwnedByUser && (
              <p className="text-xs text-red-600 font-semibold mt-1">⚠️ You already own this NFT!</p>
            )}
            {!isOwnedByUser && sellerAddress && sellerAddress.length === 42 && (
              <>
                {isOwnedBySeller ? (
                  <p className="text-xs text-green-600 font-semibold mt-1">✅ Seller owns this NFT</p>
                ) : (
                  <p className="text-xs text-red-600 font-semibold mt-1">❌ Seller does NOT own this NFT!</p>
                )}
              </>
            )}
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">Enter the address of the token holder you want to buy from</p>
      </div>

      {/* Quantité */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-2 font-semibold">Quantity</label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min="1"
            max={assetType === 'UNIQUE' ? 1 : undefined}
            value={quantity}
            onChange={e => {
              const val = parseInt(e.target.value) || 1;
              setQuantity(assetType === 'UNIQUE' ? '1' : val.toString());
            }}
            className={`flex-1 px-4 py-3 border rounded-lg text-lg ${
              assetType === 'UNIQUE' 
                ? 'bg-gray-100 cursor-not-allowed text-gray-600' 
                : 'bg-white'
            }`}
            disabled={assetType === 'UNIQUE'}
          />
          {assetType === 'DIVISIBLE' && (
            <button
              onClick={handleMaxQuantity}
              className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-sm"
            >
              MAX
            </button>
          )}
        </div>
        {assetType === 'UNIQUE' && (
          <p className="mt-2 text-xs text-gray-500">Unique assets can only be purchased as a single unit (quantity locked to 1).</p>
        )}
        {assetType === 'DIVISIBLE' && maxAffordable > 0 && (
          <p className="mt-2 text-xs text-gray-500">You can afford up to {maxAffordable} units with your current balance.</p>
        )}
      </div>

      {/* Prix total */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-semibold">Total Price:</span>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-700">
              {totalPrice.toFixed(2)} {displayCurrency}
            </p>
            <p className="text-xs text-gray-500">
              {fixedPricePerToken.toFixed(2)} {displayCurrency} per unit
              {estimatedValue === BigInt(0) && !isListed && (
                <span className="ml-1 text-orange-600" title="Price not set for this asset">
                  ⚠️
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Info disponibilité */}
      {selectedAssetId && isListed && availableForSale > 0 && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            <strong>✅ Active Listing:</strong> {availableForSale} tokens available at listing price
          </p>
        </div>
      )}

      {/* Bouton d'achat */}
      <button
        onClick={handleBuy}
        disabled={isPurchasing || !canTrade || !selectedAssetId || !sellerAddress || totalPrice > userPaymentBalanceFormatted}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
          isPurchasing || !canTrade || !selectedAssetId || !sellerAddress || totalPrice > userPaymentBalanceFormatted
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700'
        }`}
      >
        {isPurchasing ? '⏳ Purchasing...' : '🛒 Buy Asset'}
      </button>

      {totalPrice > userPaymentBalanceFormatted && selectedAssetId && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">❌ Insufficient balance. You need {totalPrice.toFixed(2)} {displayCurrency} but only have {userPaymentBalanceFormatted.toFixed(2)}.</p>
        </div>
      )}

      {txHash && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">Transaction: {txHash}</p>
        </div>
      )}
      {error && (
        <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-sm text-orange-800">⚠️ {error}</p>
        </div>
      )}

      {estimatedValue === BigInt(0) && selectedAssetId && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Price not set:</strong> The estimated value for this asset has not been set. 
            Using default value of 100 {displayCurrency}. Please update the asset metadata.
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>💡 Note:</strong> Prices are calculated from the asset's estimated value (set during tokenization). 
          For fractional properties, the price per token = estimated value ÷ total supply.
        </p>
      </div>
    </div>
  );
}

// Helper function to get token symbol from address
function getTokenSymbol(paymentTokenAddress: Address | undefined): string {
  if (!paymentTokenAddress) return 'USDC';
  
  const addressLower = paymentTokenAddress.toLowerCase();
  const usdcAddress = CONTRACT_ADDRESSES.USDC?.toLowerCase();
  const usdtAddress = CONTRACT_ADDRESSES.USDT?.toLowerCase();
  const wethAddress = CONTRACT_ADDRESSES.WETH?.toLowerCase();
  
  if (addressLower === usdcAddress) return 'USDC';
  if (addressLower === usdtAddress) return 'USDT';
  if (addressLower === wethAddress) return 'WETH';
  
  return 'USDC'; // Fallback par défaut
}

// ===== PENDING ORDERS TAB =====
function PendingOrdersTab({ userAddress, canTrade }: { userAddress: Address; canTrade: boolean }) {
  const { writeContract } = useWriteContract();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Récupérer les ordres en attente ERC20 pour le vendeur
  const { data: pendingOrderIdsERC20, refetch: refetchOrdersERC20 } = useReadContract({
    address: PRIMARY_SALE_ADDRESS,
    abi: PRIMARY_SALE_ABI,
    functionName: 'getPendingOrders',
    args: [userAddress],
    query: {
      enabled: !!userAddress && PRIMARY_SALE_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 10_000,
    }
  });

  // Récupérer les ordres en attente NFT pour le vendeur
  const { data: pendingOrderIdsNFT, refetch: refetchOrdersNFT } = useReadContract({
    address: PRIMARY_SALE_NFT_ADDRESS,
    abi: PRIMARY_SALE_NFT_ABI,
    functionName: 'getPendingOrders',
    args: [userAddress],
    query: {
      enabled: !!userAddress && PRIMARY_SALE_NFT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 10_000,
    }
  });

  const orderIdsERC20 = pendingOrderIdsERC20 as bigint[] | undefined;
  const orderIdsNFT = pendingOrderIdsNFT as bigint[] | undefined;
  const hasOrders = (orderIdsERC20 && orderIdsERC20.length > 0) || (orderIdsNFT && orderIdsNFT.length > 0);

  const refetchOrders = () => {
    refetchOrdersERC20();
    refetchOrdersNFT();
  };

  const handleAcceptERC20 = async (orderId: bigint) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      writeContract({
        address: PRIMARY_SALE_ADDRESS,
        abi: PRIMARY_SALE_ABI,
        functionName: 'acceptBuyOrder',
        args: [orderId],
        gas: BigInt(400000),
      }, {
        onSuccess: () => {
          setSuccess('✅ Order accepted! Tokens transferred.');
          setTimeout(() => {
            refetchOrders();
            setSuccess(null);
            setIsProcessing(false);
          }, 3000);
        },
        onError: (e: any) => {
          setError(e.message || 'Failed to accept order');
          setIsProcessing(false);
        },
      });
    } catch (e: any) {
      console.error('Accept error:', e);
      setError(e.message || 'Failed to accept order');
      setIsProcessing(false);
    }
  };

  const handleAcceptNFT = async (orderId: bigint) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      writeContract({
        address: PRIMARY_SALE_NFT_ADDRESS,
        abi: PRIMARY_SALE_NFT_ABI,
        functionName: 'acceptBuyOrder',
        args: [orderId],
        gas: BigInt(400000),
      }, {
        onSuccess: () => {
          setSuccess('✅ NFT Order accepted! NFT transferred.');
          setTimeout(() => {
            refetchOrders();
            setSuccess(null);
            setIsProcessing(false);
          }, 3000);
        },
        onError: (e: any) => {
          setError(e.message || 'Failed to accept NFT order');
          setIsProcessing(false);
        },
      });
    } catch (e: any) {
      console.error('Accept NFT error:', e);
      setError(e.message || 'Failed to accept NFT order');
      setIsProcessing(false);
    }
  };

  const handleRejectERC20 = async (orderId: bigint) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      writeContract({
        address: PRIMARY_SALE_ADDRESS,
        abi: PRIMARY_SALE_ABI,
        functionName: 'rejectBuyOrder',
        args: [orderId],
        gas: BigInt(200000),
      }, {
        onSuccess: () => {
          setSuccess('❌ Order rejected. Buyer refunded.');
          setTimeout(() => {
            refetchOrders();
            setSuccess(null);
            setIsProcessing(false);
          }, 3000);
        },
        onError: (e: any) => {
          setError(e.message || 'Failed to reject order');
          setIsProcessing(false);
        },
      });
    } catch (e: any) {
      console.error('Reject error:', e);
      setError(e.message || 'Failed to reject order');
      setIsProcessing(false);
    }
  };

  const handleRejectNFT = async (orderId: bigint) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      writeContract({
        address: PRIMARY_SALE_NFT_ADDRESS,
        abi: PRIMARY_SALE_NFT_ABI,
        functionName: 'rejectBuyOrder',
        args: [orderId],
        gas: BigInt(200000),
      }, {
        onSuccess: () => {
          setSuccess('❌ NFT Order rejected. Buyer refunded.');
          setTimeout(() => {
            refetchOrders();
            setSuccess(null);
            setIsProcessing(false);
          }, 3000);
        },
        onError: (e: any) => {
          setError(e.message || 'Failed to reject NFT order');
          setIsProcessing(false);
        },
      });
    } catch (e: any) {
      console.error('Reject NFT error:', e);
      setError(e.message || 'Failed to reject NFT order');
      setIsProcessing(false);
    }
  };

  if (!canTrade) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800"><strong>⚠️ KYC Required:</strong> Complete KYC verification to view pending orders.</p>
      </div>
    );
  }

  if (PRIMARY_SALE_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800"><strong>❌ Not Deployed:</strong> PrimarySale contract not deployed yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📬 Pending Buy Orders</h2>
      <p className="text-gray-600 mb-6">Review and approve buy orders from buyers. Click Accept to confirm the sale.</p>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">❌ {error}</p>
        </div>
      )}

      {!hasOrders ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600">📭 No pending orders</p>
          <p className="text-sm text-gray-500 mt-2">Orders will appear here when buyers create purchase requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Afficher les ordres ERC20 */}
          {orderIdsERC20 && orderIdsERC20.length > 0 && orderIdsERC20.map((orderId) => (
            <PendingOrderCardERC20 
              key={`erc20-${orderId.toString()}`} 
              orderId={orderId} 
              onAccept={handleAcceptERC20}
              onReject={handleRejectERC20}
              isProcessing={isProcessing}
            />
          ))}
          
          {/* Afficher les ordres NFT */}
          {orderIdsNFT && orderIdsNFT.length > 0 && orderIdsNFT.map((orderId) => (
            <PendingOrderCardNFT 
              key={`nft-${orderId.toString()}`} 
              orderId={orderId} 
              onAccept={handleAcceptNFT}
              onReject={handleRejectNFT}
              isProcessing={isProcessing}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Carte pour un ordre ERC20 en attente
function PendingOrderCardERC20({ 
  orderId, 
  onAccept, 
  onReject, 
  isProcessing 
}: { 
  orderId: bigint; 
  onAccept: (id: bigint) => void;
  onReject: (id: bigint) => void;
  isProcessing: boolean;
}) {
  const { address: sellerAddress } = useAccount();
  const { writeContract } = useWriteContract();
  const [isApproving, setIsApproving] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Récupérer les détails de l'ordre
  const { data: orderData } = useReadContract({
    address: PRIMARY_SALE_ADDRESS,
    abi: PRIMARY_SALE_ABI,
    functionName: 'getBuyOrder',
    args: [orderId],
    query: {
      enabled: !!orderId,
      refetchInterval: 10_000,
    }
  });

  const order = orderData as any;
  const assetToken = order?.assetToken as Address | undefined;
  const amountWei = order?.amount as bigint | undefined;

  // Vérifier l'allowance du vendeur pour le contrat PrimarySale
  // IMPORTANT: Ce hook doit être appelé AVANT tout return conditionnel
  const { data: sellerAllowance, refetch: refetchAllowance } = useReadContract({
    address: assetToken || '0x0000000000000000000000000000000000000000',
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [sellerAddress || '0x0000000000000000000000000000000000000000', PRIMARY_SALE_ADDRESS],
    query: {
      enabled: !!sellerAddress && !!assetToken && !!order && order.pending,
      refetchInterval: 5_000,
    }
  });

  // Return null APRÈS tous les hooks
  if (!order || !order.pending) {
    return null;
  }

  const buyerAddress = order.buyer as Address;
  const amount = Number(formatUnits(order.amount || BigInt(0), 18));
  const totalPrice = Number(formatUnits(order.totalPrice || BigInt(0), 18));
  const timestamp = order.timestamp ? Number(order.timestamp) * 1000 : Date.now();
  const timeAgo = new Date(timestamp).toLocaleString();
  const paymentToken = order.paymentToken as Address | undefined;
  const tokenSymbol = getTokenSymbol(paymentToken);

  const hasApproval = sellerAllowance ? (sellerAllowance as bigint) >= amountWei! : false;

  const handleApprove = async () => {
    if (!assetToken || !amountWei) return;
    
    setIsApproving(true);
    setApprovalError(null);

    try {
      writeContract({
        address: assetToken,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [PRIMARY_SALE_ADDRESS, amountWei],
      }, {
        onSuccess: () => {
          console.log('✅ Approval successful');
          setTimeout(() => {
            refetchAllowance();
            setIsApproving(false);
          }, 2000);
        },
        onError: (e: any) => {
          console.error('❌ Approval failed:', e);
          setApprovalError(e.message || 'Approval failed');
          setIsApproving(false);
        }
      });
    } catch (e: any) {
      console.error('Approve error:', e);
      setApprovalError(e.message || 'Approval failed');
      setIsApproving(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👤</span>
            <div>
              <p className="font-semibold text-gray-800">Buy Order #{orderId.toString()}</p>
              <p className="text-xs text-gray-500">From: {buyerAddress.slice(0, 6)}...{buyerAddress.slice(-4)}</p>
              <p className="text-xs text-gray-500">{timeAgo}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <p className="text-xs text-gray-600">Quantity</p>
              <p className="text-lg font-bold text-gray-800">{amount.toFixed(2)} tokens</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Price</p>
              <p className="text-lg font-bold text-green-700">{totalPrice.toFixed(2)} {tokenSymbol}</p>
            </div>
          </div>

          <p className="text-xs text-blue-600 mt-2">💰 Funds secured in escrow</p>
          
          {!hasApproval && (
            <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="text-xs text-yellow-800">⚠️ You need to approve token transfer first</p>
            </div>
          )}

          {approvalError && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
              <p className="text-xs text-red-800">❌ {approvalError}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {!hasApproval ? (
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isApproving ? '⏳ Approving...' : '🔓 Approve Tokens'}
            </button>
          ) : (
            <button
              onClick={() => onAccept(orderId)}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              ✅ Accept
            </button>
          )}
          <button
            onClick={() => onReject(orderId)}
            disabled={isProcessing || isApproving}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            ❌ Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// Carte pour un ordre NFT en attente
function PendingOrderCardNFT({ 
  orderId, 
  onAccept, 
  onReject, 
  isProcessing 
}: { 
  orderId: bigint; 
  onAccept: (id: bigint) => void;
  onReject: (id: bigint) => void;
  isProcessing: boolean;
}) {
  const { address: sellerAddress } = useAccount();
  const { writeContract } = useWriteContract();
  const [isApproving, setIsApproving] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Récupérer les détails de l'ordre NFT
  const { data: orderData } = useReadContract({
    address: PRIMARY_SALE_NFT_ADDRESS,
    abi: PRIMARY_SALE_NFT_ABI,
    functionName: 'getBuyOrder',
    args: [orderId],
    query: {
      enabled: !!orderId,
      refetchInterval: 10_000,
    }
  });

  const order = orderData as any;
  const assetToken = order?.assetToken as Address | undefined;
  const tokenId = order?.tokenId as bigint | undefined;

  // Vérifier si le NFT est approuvé pour le contrat PrimarySaleNFT
  // IMPORTANT: Ce hook doit être appelé AVANT tout return conditionnel
  const { data: approvedAddress, refetch: refetchApproval } = useReadContract({
    address: assetToken || '0x0000000000000000000000000000000000000000',
    abi: [{
      inputs: [{ name: 'tokenId', type: 'uint256' }],
      name: 'getApproved',
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function',
    }],
    functionName: 'getApproved',
    args: [tokenId || BigInt(0)],
    query: {
      enabled: !!sellerAddress && !!assetToken && !!tokenId && !!order && order.pending,
      refetchInterval: 5_000,
    }
  });

  // Return null APRÈS tous les hooks
  if (!order || !order.pending) {
    return null;
  }

  const buyerAddress = order.buyer as Address;
  const price = Number(formatUnits(order.price || BigInt(0), 18));
  const timestamp = order.timestamp ? Number(order.timestamp) * 1000 : Date.now();
  const timeAgo = new Date(timestamp).toLocaleString();
  const paymentToken = order.paymentToken as Address | undefined;
  const tokenSymbol = getTokenSymbol(paymentToken);

  const hasApproval = approvedAddress === PRIMARY_SALE_NFT_ADDRESS;

  const handleApprove = async () => {
    if (!assetToken || !tokenId) return;
    
    setIsApproving(true);
    setApprovalError(null);

    try {
      writeContract({
        address: assetToken,
        abi: [{
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'tokenId', type: 'uint256' }
          ],
          name: 'approve',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        }],
        functionName: 'approve',
        args: [PRIMARY_SALE_NFT_ADDRESS, tokenId],
      }, {
        onSuccess: () => {
          console.log('✅ NFT Approval successful');
          setTimeout(() => {
            refetchApproval();
            setIsApproving(false);
          }, 2000);
        },
        onError: (e: any) => {
          console.error('❌ NFT Approval failed:', e);
          setApprovalError(e.message || 'NFT Approval failed');
          setIsApproving(false);
        }
      });
    } catch (e: any) {
      console.error('NFT Approve error:', e);
      setApprovalError(e.message || 'NFT Approval failed');
      setIsApproving(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🖼️</span>
            <div>
              <p className="font-semibold text-gray-800">NFT Buy Order #{orderId.toString()}</p>
              <p className="text-xs text-gray-500">From: {buyerAddress.slice(0, 6)}...{buyerAddress.slice(-4)}</p>
              <p className="text-xs text-gray-500">{timeAgo}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <p className="text-xs text-gray-600">Token ID</p>
              <p className="text-lg font-bold text-gray-800">#{tokenId?.toString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Offer Price</p>
              <p className="text-lg font-bold text-green-700">{price.toFixed(2)} {tokenSymbol}</p>
            </div>
          </div>

          <p className="text-xs text-blue-600 mt-2">💰 Funds secured in escrow</p>
          
          {!hasApproval && (
            <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="text-xs text-yellow-800">⚠️ You need to approve NFT transfer first</p>
            </div>
          )}

          {approvalError && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
              <p className="text-xs text-red-800">❌ {approvalError}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {!hasApproval ? (
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isApproving ? '⏳ Approving...' : '🔓 Approve NFT'}
            </button>
          ) : (
            <button
              onClick={() => onAccept(orderId)}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              ✅ Accept
            </button>
          )}
          <button
            onClick={() => onReject(orderId)}
            disabled={isProcessing || isApproving}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            ❌ Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== MINT TAB =====
function MintWrapTab({ userAddress, canTrade }: { userAddress: Address; canTrade: boolean }) {
  // Pour ETH natif (pour wrap)
  const { data: ethBalance } = useBalance({
    address: userAddress,
    query: { enabled: !!userAddress, refetchInterval: 10000 },
  });
  // Pour WETH (pour unwrap) — lire le solde comme la sidebar (useReadContract)
  const WETH_ADDRESS = CONTRACT_ADDRESSES.WETH as Address;
  const { data: wethBalanceRaw } = useReadContract({
    address: WETH_ADDRESS as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress as Address],
    query: { enabled: !!userAddress, refetchInterval: 10000 },
  });
  const { data: wethDecimals } = useReadContract({
    address: WETH_ADDRESS as Address,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: !!userAddress },
  });

    // MAX handlers
    const handleMaxWrap = () => {
      if (ethBalance && ethBalance.value) {
        // On laisse 0.001 ETH pour le gas
        const max = Number(formatUnits(ethBalance.value, 18)) - 0.001;
        setWrapAmount(max > 0 ? max.toFixed(6) : '0');
      }
    };
    const handleMaxUnwrap = () => {
      if (wethBalanceRaw && wethDecimals !== undefined) {
        const max = Number(formatUnits(wethBalanceRaw as bigint, wethDecimals as number));
        setUnwrapAmount(max > 0 ? max.toFixed(6) : '0');
      }
    };
  const [amount, setAmount] = useState('1000');
  const [token, setToken] = useState(CONTRACT_ADDRESSES.USDC);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrapAmount, setWrapAmount] = useState('0.1');
  const [wrapTxHash, setWrapTxHash] = useState<string | null>(null);
  const [isWrapping, setIsWrapping] = useState(false);
  const [wrapError, setWrapError] = useState<string | null>(null);
  const [unwrapAmount, setUnwrapAmount] = useState('');
  const [unwrapTxHash, setUnwrapTxHash] = useState<string | null>(null);
  const [isUnwrapping, setIsUnwrapping] = useState(false);
  const [unwrapError, setUnwrapError] = useState<string | null>(null);
  const [showUnwrap, setShowUnwrap] = useState(false);

  const { writeContractAsync } = useWriteContract();

  // Mint réel
  const handleMint = async () => {
    setIsMinting(true);
    setError(null);
    setTxHash(null);
    try {
      const decimals = 18;
      const amountParsed = parseUnits(amount, decimals);
      const hash = await writeContractAsync({
        address: token as Address,
        abi: [
          {
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            name: 'mint',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          }
        ],
        functionName: 'mint',
        args: [userAddress, amountParsed],
      });
      setTxHash(hash);
      setIsMinting(false);
    } catch (e: any) {
      setError(e.message || 'Mint failed');
      setIsMinting(false);
    }
  };

  // Wrap ETH -> WETH
  const handleWrap = async () => {
    setIsWrapping(true);
    setWrapError(null);
    setWrapTxHash(null);
    try {
      const value = parseUnits(wrapAmount, 18);
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.WETH as Address,
        abi: [
          {
            inputs: [],
            name: 'deposit',
            outputs: [],
            stateMutability: 'payable',
            type: 'function',
          }
        ],
        functionName: 'deposit',
        args: [],
        value,
      });
      setWrapTxHash(hash);
      setIsWrapping(false);
    } catch (e: any) {
      setWrapError(e.message || 'Wrap failed');
      setIsWrapping(false);
    }
  };

  // Unwrap WETH -> ETH
  const handleUnwrap = async () => {
    setIsUnwrapping(true);
    setUnwrapError(null);
    setUnwrapTxHash(null);
    try {
      const value = parseUnits(unwrapAmount, 18);
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.WETH as Address,
        abi: [
          {
            inputs: [
              { name: 'amount', type: 'uint256' }
            ],
            name: 'withdraw',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          }
        ],
        functionName: 'withdraw',
        args: [value],
      });
      setUnwrapTxHash(hash);
      setIsUnwrapping(false);
    } catch (e: any) {
      setUnwrapError(e.message || 'Unwrap failed');
      setIsUnwrapping(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-2xl font-bold mb-4">🪙 Mint/Wrap Test Tokens</h2>
      <p className="text-gray-600 mb-4">Mint test USDC or USDT tokens, ou wrap ETH en WETH pour vos tests.</p>
      {/* Mint Section */}
      <div className="mb-4 flex gap-4">
        <select
          value={token}
          onChange={e => setToken(e.target.value)}
          className="px-4 py-2 border rounded-lg text-lg"
        >
          <option value={CONTRACT_ADDRESSES.USDC}>USDC</option>
          <option value={CONTRACT_ADDRESSES.USDT}>USDT</option>
        </select>
        <input
          type="number"
          min="1"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="px-4 py-2 border rounded-lg text-lg w-32"
        />
        <button
          onClick={handleMint}
          disabled={isMinting || !canTrade}
          className={`px-6 py-2 rounded-lg font-bold text-lg transition-colors ${
            isMinting || !canTrade
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isMinting ? 'Minting...' : 'Mint'}
        </button>
      </div>
      {txHash && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">Transaction: {txHash}</p>
        </div>
      )}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">❌ {error}</p>
        </div>
      )}
      {/* Wrap Section */}
      <div className="mt-8 mb-4">
        <h3 className="text-lg font-bold mb-2">🔷 Wrap ETH → WETH</h3>
        <div className="flex gap-4 items-center">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={wrapAmount}
            onChange={e => setWrapAmount(e.target.value)}
            className="px-4 py-2 border rounded-lg text-lg w-32"
          />
          <button
            type="button"
            onClick={handleMaxWrap}
            className="px-3 py-2 rounded-lg font-semibold text-xs bg-gray-200 hover:bg-gray-300 border border-gray-300"
            style={{ minWidth: 48 }}
          >
            MAX
          </button>
          <button
            onClick={handleWrap}
            disabled={isWrapping || !canTrade}
            className={`px-6 py-2 rounded-lg font-bold text-lg transition-colors ${
              isWrapping || !canTrade
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isWrapping ? 'Wrapping...' : 'Wrap'}
          </button>
        </div>
        {wrapTxHash && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">Transaction: {wrapTxHash}</p>
          </div>
        )}
        {wrapError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">❌ {wrapError}</p>
          </div>
        )}
        {/* Unwrap Section - always visible */}
        <div className="mt-6">
          <h3 className="text-md font-bold mb-2">⬅️ Unwrap WETH → ETH</h3>
          <div className="flex gap-4 items-center">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={unwrapAmount}
              onChange={e => setUnwrapAmount(e.target.value)}
              className="px-4 py-2 border rounded-lg text-lg w-32"
            />
            <button
              type="button"
              onClick={handleMaxUnwrap}
              className="px-3 py-2 rounded-lg font-semibold text-xs bg-gray-200 hover:bg-gray-300 border border-gray-300"
              style={{ minWidth: 48 }}
            >
              MAX
            </button>
            <button
              onClick={handleUnwrap}
              disabled={isUnwrapping || !canTrade}
              className={`px-6 py-2 rounded-lg font-bold text-lg transition-colors ${
                isUnwrapping || !canTrade
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              {isUnwrapping ? 'Unwrapping...' : 'Unwrap'}
            </button>
          </div>
          {unwrapTxHash && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">Transaction: {unwrapTxHash}</p>
            </div>
          )}
          {unwrapError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">❌ {unwrapError}</p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">
          <strong>💡 Tip:</strong> Minting test tokens costs only gas. Wrapping ETH en WETH vous permet d'utiliser WETH sur Uniswap.
        </p>
      </div>
    </div>
  );
}

// ===== ASSET BALANCE ROW BY TYPE (filtre par type) =====
function AssetBalanceRowByType({ 
  assetId, 
  userAddress,
  filterType
}: { 
  assetId: bigint; 
  userAddress: string;
  filterType: 'DIVISIBLE' | 'UNIQUE';
}) {
  const factoryAddress = CONTRACT_ADDRESSES.ASSET_FACTORY as Address;

  // Récupérer les infos de l'asset
  const { data: assetData } = useReadContract({
    address: factoryAddress,
    abi: FACTORY_ABI,
    functionName: 'getAsset',
    args: [assetId],
    query: {
      enabled: factoryAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 30_000,
    }
  });

  // Extract data from asset
  const tokenAddress = assetData ? (assetData as any).token as Address : null;
  const tokenSymbol = assetData ? (assetData as any).symbol as string : '';
  const assetName = assetData ? (assetData as any).name as string : '';
  const nftAddress = assetData ? (assetData as any).nft as Address : null;
  const isActive = assetData ? (assetData as any).active as boolean : false;

  // Récupérer les métadonnées du NFT pour obtenir le champ documents
  const { data: metadataData } = useReadContract({
    address: nftAddress as Address,
    abi: ASSET_NFT_ABI,
    functionName: 'getMetadata',
    query: {
      enabled: !!nftAddress,
      refetchInterval: 30_000,
    }
  });

  const documents = metadataData ? (metadataData as any).documents as string : '';

  // Déterminer le type depuis documents (format: "DIVISIBLE|USDC" ou "UNIQUE|WETH")
  const assetType = getTokenType(documents);

  // Pour les NFTs UNIQUE, vérifier la propriété avec ownerOf
  const { data: nftOwner } = useReadContract({
    address: nftAddress as Address,
    abi: [
      {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "ownerOf",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'ownerOf',
    args: [assetId],
    query: {
      enabled: !!nftAddress && assetType === 'UNIQUE',
      refetchInterval: 3_000,
    }
  });

  // Récupérer le balance du token (pour DIVISIBLE seulement)
  const { data: balance } = useReadContract({
    address: tokenAddress as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress as Address],
    query: {
      enabled: !!tokenAddress && assetType === 'DIVISIBLE',
      refetchInterval: 10_000,
    }
  });

  // Récupérer les decimals du token
  const { data: decimals } = useReadContract({
    address: tokenAddress as Address,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress,
    }
  });

  // Récupérer le total supply du token
  const { data: totalSupply } = useReadContract({
    address: tokenAddress as Address,
    abi: ERC20_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!tokenAddress && assetType === 'DIVISIBLE',
      refetchInterval: 30_000,
    }
  });

  // Pour les NFTs UNIQUE, vérifier si l'utilisateur possède le NFT
  const ownsNFT = assetType === 'UNIQUE' && nftOwner 
    ? (nftOwner as Address).toLowerCase() === userAddress.toLowerCase()
    : false;

  // Calculer le balance en entier (pour DIVISIBLE)
  const balanceInt = balance && decimals
    ? Number(formatUnits(balance as bigint, decimals as number))
    : 0;

  // Calculer le total supply en entier (pour DIVISIBLE)
  const totalSupplyInt = totalSupply && decimals
    ? Number(formatUnits(totalSupply as bigint, decimals as number))
    : 0;

  // Ne pas afficher si :
  // - Pas d'adresse ou pas actif
  // - Ne correspond pas au type filtré
  // - Pour DIVISIBLE : balance = 0
  // - Pour UNIQUE : ne possède pas le NFT
  if (!tokenAddress || !isActive || assetType !== filterType) {
    return null;
  }
  
  if (assetType === 'DIVISIBLE' && balanceInt === 0) {
    return null;
  }
  
  if (assetType === 'UNIQUE' && !ownsNFT) {
    return null;
  }

  // Formater en entier avec séparateurs de milliers (pour DIVISIBLE)
  const displayBalance = Math.floor(balanceInt).toLocaleString('en-US');
  const displayTotalSupply = Math.floor(totalSupplyInt).toLocaleString('en-US');

  // Icône selon le type
  const icon = filterType === 'DIVISIBLE' ? '🏢' : '🏡';

  return (
    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg hover:from-purple-100 hover:to-blue-100 transition-colors border border-purple-200">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="font-semibold text-gray-800 text-sm">{tokenSymbol}</p>
          <p className="text-xs text-gray-500">{assetName || `Asset #${assetId.toString()}`}</p>
        </div>
      </div>
      <div className="text-right">
        {assetType === 'UNIQUE' ? (
          // Affichage pour NFT UNIQUE
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-bold text-lg">✓</span>
            <p className="text-sm font-semibold text-green-700">Owned</p>
          </div>
        ) : (
          // Affichage pour DIVISIBLE
          <div className="flex flex-col items-end gap-1">
            <p className="font-mono text-sm font-semibold text-purple-900 whitespace-nowrap">
              {displayBalance} / {displayTotalSupply}
            </p>
            {totalSupplyInt > 0 && (
              <p className="text-xs text-purple-600 font-medium">
                {((balanceInt / totalSupplyInt) * 100).toFixed(1)}%
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
