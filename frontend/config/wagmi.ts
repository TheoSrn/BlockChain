/**
 * Configuration wagmi pour la connexion Web3
 * Supporte les testnets EVM-compatible avec RPCs publics
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { fallback, http } from 'viem';
import { sepolia, mainnet, polygon, optimism, arbitrum, hardhat } from 'wagmi/chains';

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '31337');
const defaultSepoliaRpc = 'https://ethereum-sepolia-rpc.publicnode.com';
type EnabledChains =
  | readonly [typeof sepolia]
  | readonly [typeof hardhat]
  | readonly [
      typeof sepolia,
      typeof mainnet,
      typeof polygon,
      typeof optimism,
      typeof arbitrum,
    ];

function getSepoliaRpcUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
  if (!envUrl) return defaultSepoliaRpc;

  try {
    const parsed = new URL(envUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return envUrl;
    }
  } catch {
    return defaultSepoliaRpc;
  }

  return defaultSepoliaRpc;
}

function getSepoliaTransport() {
  const envUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
  if (!envUrl) {
    return http(defaultSepoliaRpc);
  }

  try {
    const parsed = new URL(envUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return fallback([http(envUrl), http(defaultSepoliaRpc)]);
    }
  } catch {
    return http(defaultSepoliaRpc);
  }

  return http(defaultSepoliaRpc);
}

const enabledChains: EnabledChains = (() => {
  if (chainId === 11155111) return [sepolia];
  if (chainId === 31337) return [hardhat];
  return [sepolia, mainnet, polygon, optimism, arbitrum];
})();

// Configuration par défaut de RainbowKit avec wagmi
export const config = getDefaultConfig({
  appName: 'Tokenized Asset Management Platform',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // WalletConnect Cloud Project ID
  chains: enabledChains,
  transports: {
    [hardhat.id]: http(process.env.NEXT_PUBLIC_LOCAL_RPC_URL || 'http://127.0.0.1:8545'),
    [sepolia.id]: getSepoliaTransport(),
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth.llamarpc.com'),
    [polygon.id]: http('https://polygon-rpc.com'),
    [optimism.id]: http('https://mainnet.optimism.io'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
  },
  ssr: true, // Si vous utilisez le SSR Next.js
});
