/**
 * Hook pour récupérer les balances de plusieurs tokens ERC20
 */

import { useAccount, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { useOracle } from './useOracle';

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
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface TokenBalance {
  address: string;
  balance: bigint;
  formattedBalance: string;
  decimals: number;
  symbol: string;
  name: string;
  usdValue?: string;
}

export function useTokenBalances(tokenAddresses: string[]) {
  const { address } = useAccount();

  // Préparer les contrats à lire
  const contracts = tokenAddresses.flatMap((tokenAddress) => [
    {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf' as const,
      args: address ? [address] : undefined,
    },
    {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'decimals' as const,
    },
    {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'symbol' as const,
    },
    {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'name' as const,
    },
  ]);

  const { data, isLoading } = useReadContracts({
    contracts,
    query: {
      enabled: !!(address && tokenAddresses.length > 0),
      refetchInterval: 10000,
    },
  });

  // Parser les résultats
  const balances: TokenBalance[] = [];

  if (data && tokenAddresses.length > 0) {
    for (let i = 0; i < tokenAddresses.length; i++) {
      const baseIndex = i * 4;
      const balanceResult = data[baseIndex];
      const decimalsResult = data[baseIndex + 1];
      const symbolResult = data[baseIndex + 2];
      const nameResult = data[baseIndex + 3];

      if (
        balanceResult?.status === 'success' &&
        decimalsResult?.status === 'success' &&
        symbolResult?.status === 'success' &&
        nameResult?.status === 'success'
      ) {
        const balance = balanceResult.result as bigint;
        const decimals = decimalsResult.result as number;
        const symbol = symbolResult.result as string;
        const name = nameResult.result as string;
        const formattedBalance = formatUnits(balance, decimals);

        // TODO: Intégrer oracle pour récupérer le prix USD
        // Pour l'instant pas de prix USD disponible
        let usdValue: string | undefined;

        balances.push({
          address: tokenAddresses[i],
          balance,
          formattedBalance,
          decimals,
          symbol,
          name,
          usdValue,
        });
      }
    }
  }

  // Calculer la valeur totale du portfolio
  const totalUsdValue = balances.reduce((sum, token) => {
    if (token.usdValue) {
      return sum + parseFloat(token.usdValue);
    }
    return sum;
  }, 0);

  return {
    balances,
    totalUsdValue: totalUsdValue.toFixed(2),
    isLoading,
  };
}
