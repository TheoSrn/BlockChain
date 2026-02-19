'use client';

/**
 * Page Trade - Swap et Ajout de Liquidité via Uniswap V2
 * Avec vérification KYC et interface DeFi moderne
 */

  import { useAccount, useReadContract, useBalance } from 'wagmi';
import { useState, useEffect } from 'react';
import { useKYCStatus } from '@/hooks/web3/useKYCStatus';
import { useSwap, useSwapWrite } from '@/hooks/web3/useSwap';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { Address, formatUnits, parseUnits } from 'viem';
import FACTORY_ABI from '@/abi/Factory';

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
  { address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', symbol: 'WETH', decimals: 18 }, // WETH Sepolia officiel
];

type Tab = 'swap' | 'liquidity';

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
        </div>
      </div>

      {/* Layout: Content principal + Balances à droite */}
      <div className={`flex flex-col gap-6 ${canTrade ? 'lg:flex-row' : ''}`}>
        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === 'swap' ? (
            <SwapTab canTrade={canTrade} userAddress={address!} />
          ) : (
            <LiquidityTab canTrade={canTrade} userAddress={address!} />
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

  // Hook swap pour les calculs
  const {
    expectedOutput,
    priceImpact,
    pairAddress,
    needsApproval,
  } = useSwap(
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
  } = useSwapWrite();

  // Reset amount when token changes
  useEffect(() => {
    setAmountIn('');
    // Force refetch of balances when tokens change
    refetchBalanceIn();
    refetchBalanceOut();
  }, [tokenInAddress, tokenOutAddress, refetchBalanceIn, refetchBalanceOut]);

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
      // Execute swap
      const minOutput = (parseFloat(expectedOutput) * (100 - slippage)) / 100;
      executeSwap(
        tokenInAddress,
        tokenOutAddress,
        amountIn,
        minOutput.toString(),
        decimalsIn as number || 18,
        decimalsOut as number || 18,
        userAddress as Address
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
  const { data: balanceA, isLoading: isLoadingBalanceA } = useReadContract({
    address: tokenAAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress as Address],
    query: {
      enabled: !!tokenAAddress && !!userAddress,
      refetchInterval: 5_000,
    }
  });

  const { data: balanceB, isLoading: isLoadingBalanceB } = useReadContract({
    address: tokenBAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress as Address],
    query: {
      enabled: !!tokenBAddress && !!userAddress,
      refetchInterval: 5_000,
    }
  });

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

  // Lire les allowances pour vérifier si les tokens sont approuvés
  const { data: allowanceA } = useReadContract({
    address: tokenAAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress as Address, CONTRACT_ADDRESSES.UNISWAP_ROUTER as Address],
    query: {
      enabled: !!tokenAAddress && !!userAddress,
      refetchInterval: 3_000,
    }
  });

  const { data: allowanceB } = useReadContract({
    address: tokenBAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress as Address, CONTRACT_ADDRESSES.UNISWAP_ROUTER as Address],
    query: {
      enabled: !!tokenBAddress && !!userAddress,
      refetchInterval: 3_000,
    }
  });

  const { addLiquidity, createPool, approveToken, hash, isPending, isConfirming, isSuccess, error } = useSwapWrite();

  // Reset amounts when tokens change
  useEffect(() => {
    setAmountA('');
    setAmountB('');
  }, [tokenAAddress, tokenBAddress]);

  // Force refetch after successful transaction
  useEffect(() => {
    if (isSuccess) {
      refetchPair();
    }
  }, [isSuccess, refetchPair]);

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

    addLiquidity(
      tokenAAddress,
      tokenBAddress,
      amountA,
      amountB,
      decimalsA as number || 18,
      decimalsB as number || 18,
      slippage,
      userAddress as Address
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
function TokenBalancesTable({ userAddress }: { userAddress: string }) {
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

      {/* Assets Tokenisés */}
      <div className="mt-4 pt-4 border-t border-gray-300">
        <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
          <span>🏢</span>
          <span>Tokenized Assets</span>
        </h4>
        <AssetBalances userAddress={userAddress} />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Balances update automatically
        </p>
      </div>
    </div>
  );
}

// ===== ASSET BALANCES (TOKENIZED ASSETS) =====
function AssetBalances({ userAddress }: { userAddress: string }) {
  const factoryAddress = CONTRACT_ADDRESSES.ASSET_FACTORY as Address;
  const [hasAssets, setHasAssets] = useState(false);

  // Récupérer le nombre d'assets créés
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

  if (totalAssets === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-400">No assets tokenized yet</p>
      </div>
    );
  }

  const assetRows = Array.from({ length: totalAssets }, (_, i) => i + 1).map((assetId) => (
    <AssetBalanceRow 
      key={assetId}
      assetId={BigInt(assetId)}
      userAddress={userAddress}
      onHasBalance={(has: boolean) => setHasAssets(has)}
    />
  ));

  return (
    <>
      <div className="space-y-2">
        {assetRows}
      </div>
      {totalAssets > 0 && !hasAssets && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-400">You don't own any tokenized assets yet</p>
        </div>
      )}
    </>
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
