/**
 * Types TypeScript pour la plateforme de gestion d'actifs tokenisés
 */

// Types pour les utilisateurs et KYC
export interface User {
  address: string;
  isKYCVerified: boolean;
  isWhitelisted: boolean;
  isBlacklisted: boolean;
  registrationDate: number;
}

// Types pour les actifs tokenisés (RWA)
export interface TokenizedAsset {
  address: string;
  name: string;
  symbol: string;
  totalSupply: bigint;
  assetType: 'REAL_ESTATE' | 'COMMODITY' | 'EQUITY' | 'BOND' | 'OTHER';
  valueUSD: bigint; // Valeur en USD (avec décimales)
  isActive: boolean;
  complianceRequired: boolean;
  createdAt: number;
}

// Types pour les positions d'investissement
export interface Investment {
  id: string;
  investor: string;
  assetAddress: string;
  amount: bigint;
  investedAt: number;
  currentValue: bigint;
  pnl: bigint; // Profit & Loss
}

// Types pour les transactions
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  assetAddress: string;
  amount: bigint;
  timestamp: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  type: 'BUY' | 'SELL' | 'TRANSFER' | 'MINT' | 'BURN';
}

// Types pour les pools de liquidité
export interface LiquidityPool {
  address: string;
  token0: string;
  token1: string;
  reserve0: bigint;
  reserve1: bigint;
  totalLiquidity: bigint;
  fee: number; // Fee en basis points (ex: 30 = 0.3%)
}

// Types pour les ordres de trading
export interface Order {
  id: string;
  user: string;
  assetAddress: string;
  orderType: 'MARKET' | 'LIMIT';
  side: 'BUY' | 'SELL';
  amount: bigint;
  price?: bigint; // Pour les ordres limites
  status: 'OPEN' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
  createdAt: number;
  filledAt?: number;
}

// Types pour la conformité
export interface ComplianceCheck {
  address: string;
  canTrade: boolean;
  reason?: string;
  restrictions: string[];
}

// Types pour les événements de la blockchain
export interface BlockchainEvent {
  event: string;
  transactionHash: string;
  blockNumber: number;
  args: Record<string, any>;
  timestamp: number;
}

// Types pour les statistiques de la plateforme
export interface PlatformStats {
  totalAssets: number;
  totalValueLocked: bigint;
  totalUsers: number;
  totalTransactions: number;
  volume24h: bigint;
}
