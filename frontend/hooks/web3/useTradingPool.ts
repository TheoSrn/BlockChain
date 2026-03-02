/**
 * useTradingPool Hook - Trading avec vérification KYC ON-CHAIN
 * 
 * 🔒 SÉCURITÉ: Ce hook utilise le contrat TradingPool qui vérifie le KYC ON-CHAIN
 * Contrairement à useSwap qui appelle Uniswap directement, TradingPool enforce la whitelist.
 * 
 * ✅ Protection: Les transactions échoueront si l'utilisateur n'est pas whitelisted
 * ✅ On-chain: La vérification est faite dans le smart contract
 * ✅ Impossible à contourner: Même en appelant directement le contrat
 */

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, Address } from 'viem';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import tradingPoolABI from '@/abi/TradingPool';

// ERC20 ABI pour approve et allowance
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
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const TRADING_POOL_ADDRESS = (process.env.NEXT_PUBLIC_TRADING_POOL_ADDRESS || CONTRACT_ADDRESSES.TRADING_POOL || '0x0000000000000000000000000000000000000000') as Address;

/**
 * Hook pour calculer les montants de swap et obtenir les infos de la paire
 */
export function useTradingPool(
  tokenIn: Address,
  tokenOut: Address,
  amountIn: string,
  decimalsIn: number = 18,
  decimalsOut: number = 18
) {
  const { address } = useAccount();
  const [expectedOutput, setExpectedOutput] = useState<string>('0');
  const [priceImpact, setPriceImpact] = useState<number>(0);

  // Vérifier si l'utilisateur peut trader
  const { data: canTrade } = useReadContract({
    address: TRADING_POOL_ADDRESS,
    abi: tradingPoolABI,
    functionName: 'canTrade',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Obtenir la paire de liquidité
  const { data: pairAddress } = useReadContract({
    address: TRADING_POOL_ADDRESS,
    abi: tradingPoolABI,
    functionName: 'getPair',
    args: [tokenIn, tokenOut],
    query: {
      enabled: !!tokenIn && !!tokenOut && tokenIn !== '0x0000000000000000000000000000000000000000',
    },
  });

  // Vérifier l'allowance du token d'entrée
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenIn,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, TRADING_POOL_ADDRESS] : undefined,
    query: {
      enabled: !!address && !!tokenIn && tokenIn !== '0x0000000000000000000000000000000000000000',
    },
  });

  // Calculer le montant de sortie attendu
  const { data: amountsOut } = useReadContract({
    address: TRADING_POOL_ADDRESS,
    abi: tradingPoolABI,
    functionName: 'getAmountsOut',
    args:
      amountIn && parseFloat(amountIn) > 0
        ? [parseUnits(amountIn, decimalsIn), [tokenIn, tokenOut]]
        : undefined,
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

      // Calculer un price impact approximatif (simplifié)
      // Dans un vrai système, il faudrait lire les réserves de la paire
      const impact = 0.5; // Placeholder
      setPriceImpact(impact);
    } else {
      setExpectedOutput('0');
      setPriceImpact(0);
    }
  }, [amountsOut, decimalsOut]);

  const needsApproval =
    allowance !== undefined && amountIn && parseFloat(amountIn) > 0
      ? (allowance as bigint) < parseUnits(amountIn, decimalsIn)
      : false;

  return {
    expectedOutput,
    priceImpact,
    pairAddress,
    needsApproval,
    allowance,
    refetchAllowance,
    canTrade: canTrade ?? false,
    tradingPoolAddress: TRADING_POOL_ADDRESS,
  };
}

/**
 * Hook pour exécuter les opérations de trading (swap, liquidity)
 */
export function useTradingPoolWrite() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  /**
   * Approuver le TradingPool à dépenser les tokens
   */
  const approveToken = (tokenAddress: Address, amount: string, decimals: number = 18) => {
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [TRADING_POOL_ADDRESS, parseUnits(amount, decimals)],
      gas: 100000n,
    });
  };

  /**
   * Exécuter un swap via TradingPool (avec vérification KYC on-chain)
   */
  const executeSwap = (
    tokenIn: Address,
    tokenOut: Address,
    amountIn: string,
    amountOutMin: string,
    decimalsIn: number,
    decimalsOut: number
  ) => {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes

    writeContract({
      address: TRADING_POOL_ADDRESS,
      abi: tradingPoolABI,
      functionName: 'swapExactTokensForTokens',
      args: [
        tokenIn,
        tokenOut,
        parseUnits(amountIn, decimalsIn),
        parseUnits(amountOutMin, decimalsOut),
        deadline,
      ],
      gas: 500000n,
    });
  };

  /**
   * Ajouter de la liquidité via TradingPool (avec vérification KYC on-chain)
   */
  const addLiquidity = (
    tokenA: Address,
    tokenB: Address,
    amountA: string,
    amountB: string,
    decimalsA: number,
    decimalsB: number,
    slippage: number
  ) => {
    const amountADesired = parseUnits(amountA, decimalsA);
    const amountBDesired = parseUnits(amountB, decimalsB);
    // Calcul correct du slippage (ex: 0.5% → 99.5% du montant)
    const slippageBps = Math.floor(slippage * 100); // 0.5 → 50 basis points
    const amountAMin = (amountADesired * BigInt(10000 - slippageBps)) / BigInt(10000);
    const amountBMin = (amountBDesired * BigInt(10000 - slippageBps)) / BigInt(10000);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

    console.log('📊 TradingPool addLiquidity params:');
    console.log('  tokenA:', tokenA);
    console.log('  tokenB:', tokenB);
    console.log('  amountADesired:', amountADesired.toString());
    console.log('  amountBDesired:', amountBDesired.toString());
    console.log('  amountAMin:', amountAMin.toString());
    console.log('  amountBMin:', amountBMin.toString());
    console.log('  deadline:', deadline.toString());
    console.log('  slippage:', slippage, '→', slippageBps, 'bps');

    writeContract({
      address: TRADING_POOL_ADDRESS,
      abi: tradingPoolABI,
      functionName: 'addLiquidity',
      args: [tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, deadline],
      gas: 800000n,
    });
  };

  /**
   * Retirer de la liquidité via TradingPool (avec vérification KYC on-chain)
   */
  const removeLiquidity = (
    tokenA: Address,
    tokenB: Address,
    liquidity: string,
    decimalsLP: number,
    slippage: number
  ) => {
    const liquidityAmount = parseUnits(liquidity, decimalsLP);
    const amountAMin = BigInt(0); // Simplified - calculate based on reserves
    const amountBMin = BigInt(0);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

    writeContract({
      address: TRADING_POOL_ADDRESS,
      abi: tradingPoolABI,
      functionName: 'removeLiquidity',
      args: [tokenA, tokenB, liquidityAmount, amountAMin, amountBMin, deadline],
      gas: 600000n,
    });
  };

  return {
    approveToken,
    executeSwap,
    addLiquidity,
    removeLiquidity,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook pour vérifier si un utilisateur peut trader (lecture on-chain)
 */
export function useCanTradeOnChain(userAddress?: Address) {
  const { address: connectedAddress } = useAccount();
  const address = userAddress || connectedAddress;

  const { data: canTrade, isLoading } = useReadContract({
    address: TRADING_POOL_ADDRESS,
    abi: tradingPoolABI,
    functionName: 'canTrade',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    canTrade: canTrade ?? false,
    isLoading,
  };
}
