/**
 * Hook pour les interactions DEX (swap, pools, liquidité)
 * Intègre Uniswap SDK pour les calculs
 */

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { parseUnits, formatUnits } from 'viem';
import { useState, useEffect } from 'react';

// ABI minimal pour Trading Pool
const TRADING_POOL_ABI = [
  {
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    name: 'swap',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
    ],
    name: 'getAmountOut',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'token0', type: 'address' },
      { name: 'token1', type: 'address' },
    ],
    name: 'getReserves',
    outputs: [
      { name: 'reserve0', type: 'uint256' },
      { name: 'reserve1', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageTolerance: number; // in percentage (e.g., 0.5 for 0.5%)
}

export function useDex() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const swap = async (params: SwapParams) => {
    try {
      const amountIn = parseUnits(params.amountIn, 18);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes

      // Get expected amount out (simplified - in production use Uniswap SDK)
      const amountOut = amountIn; // TODO: Calculate using reserves
      const amountOutMin = (amountOut * BigInt(100 - params.slippageTolerance * 100)) / BigInt(10000);

      await writeContract({
        address: CONTRACT_ADDRESSES.TRADING_POOL as `0x${string}`,
        abi: TRADING_POOL_ABI,
        functionName: 'swap',
        args: [
          params.tokenIn as `0x${string}`,
          params.tokenOut as `0x${string}`,
          amountIn,
          amountOutMin,
          deadline,
        ],
      });
    } catch (err) {
      console.error('Error swapping:', err);
      throw err;
    }
  };

  return {
    swap,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}

export function useSwapQuote(
  tokenIn: string | undefined,
  tokenOut: string | undefined,
  amountIn: string
) {
  const [amountOut, setAmountOut] = useState<string>('0');

  const { data: quote, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.TRADING_POOL as `0x${string}`,
    abi: TRADING_POOL_ABI,
    functionName: 'getAmountOut',
    args:
      tokenIn && tokenOut && amountIn
        ? [
            tokenIn as `0x${string}`,
            tokenOut as `0x${string}`,
            parseUnits(amountIn || '0', 18),
          ]
        : undefined,
    query: {
      enabled: !!(tokenIn && tokenOut && amountIn && parseFloat(amountIn) > 0),
      refetchInterval: 10000, // Refetch every 10s
    },
  });

  useEffect(() => {
    if (quote) {
      setAmountOut(formatUnits(quote as bigint, 18));
    }
  }, [quote]);

  return {
    amountOut,
    isLoading,
  };
}

export function usePoolReserves(token0: string | undefined, token1: string | undefined) {
  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.TRADING_POOL as `0x${string}`,
    abi: TRADING_POOL_ABI,
    functionName: 'getReserves',
    args: token0 && token1 ? [token0 as `0x${string}`, token1 as `0x${string}`] : undefined,
    query: {
      enabled: !!(token0 && token1),
    },
  });

  return {
    reserve0: data ? (data as any)[0] : 0n,
    reserve1: data ? (data as any)[1] : 0n,
    isLoading,
  };
}
