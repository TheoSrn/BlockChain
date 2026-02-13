/**
 * Hook pour récupérer les balances multi-tokens
 */

import { useAccount, useBalance, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { formatUnits } from 'viem';

// ERC20 ABI minimal
const ERC20_ABI = [
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
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function useTokenBalance(tokenAddress: string | undefined) {
  const { address } = useAccount();

  const { data: balance, isLoading } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!(address && tokenAddress),
      refetchInterval: 10000,
    },
  });

  return {
    balance: balance || 0n,
    formattedBalance: balance ? formatUnits(balance as bigint, 18) : '0',
    isLoading,
  };
}

export function useNativeBalance() {
  const { address } = useAccount();

  const { data, isLoading } = useBalance({
    address,
  });

  return {
    balance: data?.value || 0n,
    formattedBalance: data?.formatted || '0',
    symbol: data?.symbol || 'ETH',
    isLoading,
  };
}

export function useAllowance(
  tokenAddress: string | undefined,
  spender: string | undefined
) {
  const { address } = useAccount();

  const { data: allowance, isLoading } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && spender ? [address, spender as `0x${string}`] : undefined,
    query: {
      enabled: !!(address && tokenAddress && spender),
    },
  });

  return {
    allowance: allowance || 0n,
    formattedAllowance: allowance ? formatUnits(allowance as bigint, 18) : '0',
    isLoading,
  };
}

/**
 * Hook pour balances multi-tokens
 */
export function useMultiTokenBalances(tokenAddresses: string[]) {
  const { address } = useAccount();
  const balances: Record<string, bigint> = {};

  // TODO: Use multicall for better performance
  tokenAddresses.forEach((tokenAddress) => {
    const { data } = useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: address ? [address] : undefined,
    });
    if (data) {
      balances[tokenAddress] = data as bigint;
    }
  });

  return balances;
}
