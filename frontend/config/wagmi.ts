/**
 * Configuration wagmi pour la connexion Web3
 * Supporte les testnets EVM-compatible avec RPCs publics
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import { sepolia, mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';

// Configuration par défaut de RainbowKit avec wagmi
export const config = getDefaultConfig({
  appName: 'Tokenized Asset Management Platform',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // WalletConnect Cloud Project ID
  chains: [
    sepolia, // Testnet Ethereum
    mainnet,
    polygon,
    optimism,
    arbitrum,
  ],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'),
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth.llamarpc.com'),
    [polygon.id]: http('https://polygon-rpc.com'),
    [optimism.id]: http('https://mainnet.optimism.io'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
  },
  ssr: true, // Si vous utilisez le SSR Next.js
});
