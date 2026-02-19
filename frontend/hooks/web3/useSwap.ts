/**
 * useSwap Hook - Uniswap V2 Integration
 * 
 * ⚠️ IMPORTANT: KYC VERIFICATION REQUIRED
 * 
 * This hook interacts with Uniswap V2 Router which does NOT enforce KYC on-chain.
 * YOU MUST verify the user is whitelisted BEFORE calling swap/liquidity functions.
 * 
 * Use useKYCStatus() hook to check if user.canTrade === true before trading.
 * 
 * For on-chain KYC enforcement, use AssetERC20 tokens which have built-in KYC checks
 * or create a custom TradingPool contract with KYC verification.
 */

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, Address } from 'viem';

// Uniswap V2 Router ABI (Sepolia)
const UNISWAP_V2_ROUTER_ABI = [
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    name: 'swapExactTokensForTokens',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' },
    ],
    name: 'getAmountsOut',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'amountADesired', type: 'uint256' },
      { name: 'amountBDesired', type: 'uint256' },
      { name: 'amountAMin', type: 'uint256' },
      { name: 'amountBMin', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    name: 'addLiquidity',
    outputs: [
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
      { name: 'liquidity', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Uniswap V2 Factory ABI
const UNISWAP_V2_FACTORY_ABI = [
  {
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
    ],
    name: 'getPair',
    outputs: [{ name: 'pair', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
    ],
    name: 'createPair',
    outputs: [{ name: 'pair', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Uniswap V2 Pair ABI
const UNISWAP_V2_PAIR_ABI = [
  {
    inputs: [],
    name: 'getReserves',
    outputs: [
      { name: 'reserve0', type: 'uint112' },
      { name: 'reserve1', type: 'uint112' },
      { name: 'blockTimestampLast', type: 'uint32' },
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

// ERC20 ABI pour approve
const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
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
] as const;

// Adresses Uniswap V2 sur Sepolia (à configurer)
const UNISWAP_V2_ROUTER = process.env.NEXT_PUBLIC_UNISWAP_V2_ROUTER || '0x0000000000000000000000000000000000000000';
const UNISWAP_V2_FACTORY = process.env.NEXT_PUBLIC_UNISWAP_V2_FACTORY || '0x0000000000000000000000000000000000000000';

export function useSwap(tokenIn: Address, tokenOut: Address, amountIn: string, decimalsIn: number = 18, decimalsOut: number = 18) {
  const { address } = useAccount();
  const [expectedOutput, setExpectedOutput] = useState<string>('0');
  const [priceImpact, setPriceImpact] = useState<number>(0);

  // Obtenir la paire de liquidité
  const { data: pairAddress } = useReadContract({
    address: UNISWAP_V2_FACTORY as Address,
    abi: UNISWAP_V2_FACTORY_ABI,
    functionName: 'getPair',
    args: [tokenIn, tokenOut],
    query: {
      enabled: !!tokenIn && !!tokenOut && tokenIn !== '0x0000000000000000000000000000000000000000',
    },
  });

  // Si il y a une paire, obtenir les réserves
  const { data: reserves } = useReadContract({
    address: pairAddress as Address,
    abi: UNISWAP_V2_PAIR_ABI,
    functionName: 'getReserves',
    query: {
      enabled: !!pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  // Vérifier l'allowance du token d'entrée
  const { data: allowance } = useReadContract({
    address: tokenIn,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, UNISWAP_V2_ROUTER as Address] : undefined,
    query: {
      enabled: !!address && !!tokenIn && tokenIn !== '0x0000000000000000000000000000000000000000',
    },
  });

  // Calculer le montant de sortie attendu
  const { data: amountsOut } = useReadContract({
    address: UNISWAP_V2_ROUTER as Address,
    abi: UNISWAP_V2_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: amountIn && parseFloat(amountIn) > 0 ? [parseUnits(amountIn, decimalsIn), [tokenIn, tokenOut]] : undefined,
    query: {
      enabled: !!amountIn && parseFloat(amountIn) > 0 && !!tokenIn && !!tokenOut,
      refetchInterval: 10000, // Refresh toutes les 10s
    },
  });

  // Mettre à jour le montant de sortie attendu
  useEffect(() => {
    if (amountsOut && Array.isArray(amountsOut) && amountsOut.length > 1) {
      const outputAmount = formatUnits(amountsOut[1] as bigint, decimalsOut);
      setExpectedOutput(outputAmount);

      // Calculer le price impact (approximatif)
      if (reserves && Array.isArray(reserves)) {
        const reserve0 = reserves[0] as bigint;
        const reserve1 = reserves[1] as bigint;
        const inputAmount = parseUnits(amountIn || '0', decimalsIn);
        const impact = Number(inputAmount) / Number(reserve0) * 100;
        setPriceImpact(impact);
      }
    } else {
      setExpectedOutput('0');
    }
  }, [amountsOut, reserves, amountIn, decimalsIn, decimalsOut]);

  const needsApproval = allowance !== undefined && amountIn && parseFloat(amountIn) > 0
    ? (allowance as bigint) < parseUnits(amountIn, decimalsIn)
    : false;

  return {
    expectedOutput,
    priceImpact,
    pairAddress,
    reserves,
    needsApproval,
    allowance,
  };
}

export function useSwapWrite() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  /**
   * ⚠️ WARNING: This function does NOT verify KYC on-chain
   * Uniswap V2 Router does not have KYC verification built-in
   * Always verify user is whitelisted BEFORE calling this function
   * Use useKYCStatus hook to check canTrade status
   */
  const approveToken = (tokenAddress: Address, amount: string, decimals: number = 18) => {
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [UNISWAP_V2_ROUTER as Address, parseUnits(amount, decimals)],
    });
  };

  /**
   * ⚠️ WARNING: This function does NOT verify KYC on-chain
   * Uniswap V2 Router does not have KYC verification built-in
   * Always verify user is whitelisted BEFORE calling this function
   * Use useKYCStatus hook to check canTrade status
   */
  const executeSwap = (
    tokenIn: Address,
    tokenOut: Address,
    amountIn: string,
    amountOutMin: string,
    decimalsIn: number,
    decimalsOut: number,
    userAddress: Address
  ) => {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes

    writeContract({
      address: UNISWAP_V2_ROUTER as Address,
      abi: UNISWAP_V2_ROUTER_ABI,
      functionName: 'swapExactTokensForTokens',
      args: [
        parseUnits(amountIn, decimalsIn),
        parseUnits(amountOutMin, decimalsOut),
        [tokenIn, tokenOut],
        userAddress,
        deadline,
      ],
      gas: BigInt(300000), // Limite de gas explicite
    });
  };

  /**
   * ⚠️ WARNING: This function does NOT verify KYC on-chain
   * Uniswap V2 Router does not have KYC verification built-in
   * Always verify user is whitelisted BEFORE calling this function
   * Use useKYCStatus hook to check canTrade status
   */
  const addLiquidity = (
    tokenA: Address,
    tokenB: Address,
    amountA: string,
    amountB: string,
    decimalsA: number,
    decimalsB: number,
    slippage: number,
    userAddress: Address
  ) => {
    const amountADesired = parseUnits(amountA, decimalsA);
    const amountBDesired = parseUnits(amountB, decimalsB);
    // Convert slippage percentage to basis points (0.5% -> 50 bps)
    const slippageBps = Math.floor(slippage * 100);
    const amountAMin = (amountADesired * BigInt(10000 - slippageBps)) / BigInt(10000);
    const amountBMin = (amountBDesired * BigInt(10000 - slippageBps)) / BigInt(10000);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

    writeContract({
      address: UNISWAP_V2_ROUTER as Address,
      abi: UNISWAP_V2_ROUTER_ABI,
      functionName: 'addLiquidity',
      args: [tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, userAddress, deadline],
      gas: BigInt(500000), // Limite de gas explicite pour éviter l'erreur "gas limit too high"
    });
  };

  /**
   * Create a new liquidity pool pair on Uniswap V2
   * Calls Factory.createPair(tokenA, tokenB)
   */
  const createPool = (tokenA: Address, tokenB: Address) => {
    writeContract({
      address: UNISWAP_V2_FACTORY as Address,
      abi: UNISWAP_V2_FACTORY_ABI,
      functionName: 'createPair',
      args: [tokenA, tokenB],
      gas: BigInt(5000000), // Création de pool nécessite plus de gas
    });
  };

  return {
    approveToken,
    executeSwap,
    addLiquidity,
    createPool,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
