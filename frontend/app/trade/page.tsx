'use client';

/**
 * Page Trade - Swap et Ajout de Liquidité via Uniswap V2
 * Avec vérification KYC et interface DeFi moderne
 */

import { useAccount, useReadContract } from 'wagmi';
import { useState, useEffect } from 'react';
import { useKYCStatus } from '@/hooks/web3/useKYCStatus';
import { useSwap, useSwapWrite } from '@/hooks/web3/useSwap';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { Address } from 'viem';

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

  // MODE TEST : Force canTrade pour tester l'interface
  const canTrade = true; // kycStatus?.canTrade ?? false;

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
              <h3 className="font-bold text-red-800 mb-2">Trading Restricted</h3>
              <p className="text-red-700 text-sm mb-3">
                Complete KYC verification to access trading features.
              </p>
              <a
                href="/kyc"
                className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
              >
                Complete KYC
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

      {/* Tab Content */}
      {activeTab === 'swap' ? (
        <SwapTab canTrade={canTrade} userAddress={address!} />
      ) : (
        <LiquidityTab canTrade={canTrade} userAddress={address!} />
      )}
    </div>
  );
}

// ===== SWAP TAB =====
function SwapTab({ canTrade, userAddress }: { canTrade: boolean; userAddress: string }) {
  const [tokenInAddress, setTokenInAddress] = useState<Address>(TEST_TOKENS[0].address as Address);
  const [tokenOutAddress, setTokenOutAddress] = useState<Address>(TEST_TOKENS[1].address as Address);
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState(''); // Montant dans "To"
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

  // Synchroniser amountOut avec expectedOutput quand on tape dans "From"
  useEffect(() => {
    if (expectedOutput && parseFloat(expectedOutput) > 0) {
      setAmountOut(expectedOutput);
    }
  }, [expectedOutput]);

  const handleSwap = () => {
    if (!canTrade) {
      alert('Please complete KYC verification first');
      return;
    }

    if (!amountIn || parseFloat(amountIn) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (needsApproval) {
      // Approve first
      approveToken(tokenInAddress, amountIn, decimalsIn as number || 18);
    } else {
      // Execute swap - utiliser amountOut pour le minimum reçu
      const minOutput = (parseFloat(amountOut || expectedOutput) * (100 - slippage)) / 100;
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

  const exchangeRate =
    amountIn && parseFloat(amountIn) > 0 && parseFloat(amountOut || expectedOutput) > 0
      ? (parseFloat(amountOut || expectedOutput) / parseFloat(amountIn)).toFixed(6)
      : '0';

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white border rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Swap Tokens</h2>

        {/* Token In */}
        <div className="mb-2">
          <label className="block text-gray-700 mb-2 text-sm font-semibold">From</label>
          <div className="border rounded-xl p-4 bg-gray-50">
            <div className="flex justify-between mb-2">
              <input
                type="number"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                placeholder="0.0"
                className="text-2xl font-bold bg-transparent outline-none w-full"
              />
            </div>
            <div className="flex justify-between items-center">
              <select
                value={tokenInAddress}
                onChange={(e) => setTokenInAddress(e.target.value as Address)}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-semibold text-sm"
              >
                {TEST_TOKENS.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">Balance: 0.00</span>
            </div>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center my-4">
          <button
            onClick={() => {
              const temp = tokenInAddress;
              const tempAmount = amountIn;
              setTokenInAddress(tokenOutAddress);
              setTokenOutAddress(temp);
              setAmountIn(amountOut);
              setAmountOut(tempAmount);
            }}
            className="bg-white border-2 border-gray-200 rounded-full p-3 hover:bg-gray-50 transition-colors shadow-sm hover:shadow"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* Token Out */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-2 text-sm font-semibold">To</label>
          <div className="border rounded-xl p-4 bg-gray-50">
            <div className="flex justify-between mb-2">
              <input
                type="number"
                value={amountOut}
                onChange={(e) => setAmountOut(e.target.value)}
                placeholder="0.0"
                className="text-2xl font-bold bg-transparent outline-none w-full"
              />
            </div>
            <div className="flex justify-between items-center">
              <select
                value={tokenOutAddress}
                onChange={(e) => setTokenOutAddress(e.target.value as Address)}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-semibold text-sm"
              >
                {TEST_TOKENS.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">Balance: 0.00</span>
            </div>
          </div>
        </div>

        {/* Swap Details */}
        {pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000' && amountIn && parseFloat(amountIn) > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Exchange Rate</span>
              <span className="font-semibold">
                1 {symbolIn} = {exchangeRate} {symbolOut}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Price Impact</span>
              <span className={`font-semibold ${priceImpact > 5 ? 'text-red-600' : 'text-green-600'}`}>
                {priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Slippage Tolerance</span>
              <span className="font-semibold">{slippage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Min. Received</span>
              <span className="font-semibold">
                {((parseFloat(amountOut || expectedOutput || '0') * (100 - slippage)) / 100).toFixed(6)} {symbolOut}
              </span>
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

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!canTrade || isPending || isConfirming || !amountIn || parseFloat(amountIn) <= 0}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
            canTrade && amountIn && parseFloat(amountIn) > 0 && !isPending && !isConfirming
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isPending
            ? 'Waiting for approval...'
            : isConfirming
            ? 'Confirming...'
            : needsApproval
            ? `Approve ${symbolIn}`
            : 'Swap'}
        </button>

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
            <p className="text-sm text-green-800 font-semibold">✅ Swap executed successfully!</p>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">❌ {error.message}</p>
          </div>
        )}

        {/* Liquidity Pool Info */}
        {pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000' && (
          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-xs text-purple-800 mb-1">
              <strong>Liquidity Pool:</strong>
            </p>
            <p className="text-xs font-mono text-purple-700">
              {pairAddress.slice(0, 10)}...{pairAddress.slice(-8)}
            </p>
          </div>
        )}

        {!pairAddress || pairAddress === '0x0000000000000000000000000000000000000000' ? (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ No liquidity pool found for this pair
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ===== LIQUIDITY TAB =====
function LiquidityTab({ canTrade, userAddress }: { canTrade: boolean; userAddress: string }) {
  const [tokenAAddress, setTokenAAddress] = useState<Address>(TEST_TOKENS[0].address as Address);
  const [tokenBAddress, setTokenBAddress] = useState<Address>(TEST_TOKENS[1].address as Address);
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

  const { addLiquidity, hash, isPending, isConfirming, isSuccess, error } = useSwapWrite();

  const handleAddLiquidity = () => {
    if (!canTrade) {
      alert('Please complete KYC verification first');
      return;
    }

    if (!amountA || !amountB || parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0) {
      alert('Please enter valid amounts');
      return;
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
          <label className="block text-gray-700 mb-2 text-sm font-semibold">Token A</label>
          <div className="border rounded-xl p-4 bg-gray-50">
            <input
              type="number"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value)}
              placeholder="0.0"
              className="text-2xl font-bold bg-transparent outline-none w-full mb-2"
            />
            <select
              value={tokenAAddress}
              onChange={(e) => setTokenAAddress(e.target.value as Address)}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-semibold text-sm"
            >
              {TEST_TOKENS.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
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
          <label className="block text-gray-700 mb-2 text-sm font-semibold">Token B</label>
          <div className="border rounded-xl p-4 bg-gray-50">
            <input
              type="number"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              placeholder="0.0"
              className="text-2xl font-bold bg-transparent outline-none w-full mb-2"
            />
            <select
              value={tokenBAddress}
              onChange={(e) => setTokenBAddress(e.target.value as Address)}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-semibold text-sm"
            >
              {TEST_TOKENS.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
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

        {/* Add Liquidity Button */}
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
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isPending ? 'Waiting for approval...' : isConfirming ? 'Confirming...' : 'Add Liquidity'}
        </button>

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
      </div>
    </div>
  );
}
