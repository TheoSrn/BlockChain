/**
 * Constantes de la plateforme
 */

export const APP_NAME = 'RWA Platform';
export const APP_DESCRIPTION = 'Tokenized Asset Management Platform';

// Limites
export const MAX_UINT256 = 2n ** 256n - 1n;
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Décimales
export const DECIMALS = {
  ETHER: 18,
  USDC: 6,
  USDT: 6,
} as const;

// Fee basis points (1 bp = 0.01%)
export const FEE_BASIS_POINTS = {
  TRADING: 30, // 0.3%
  WITHDRAWAL: 0,
} as const;

// Types d'actifs
export const ASSET_TYPES = [
  'REAL_ESTATE',
  'COMMODITY',
  'EQUITY',
  'BOND',
  'OTHER',
] as const;

// Status de transaction
export const TX_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
} as const;

// Niveaux KYC
export const KYC_LEVELS = {
  NONE: 0,
  BASIC: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
} as const;

// Polling intervals (en millisecondes)
export const POLLING = {
  BALANCE: 10000, // 10 secondes
  COMPLIANCE: 30000, // 30 secondes
  ASSETS: 60000, // 1 minute
} as const;

// Liens externes
export const EXTERNAL_LINKS = {
  DOCS: 'https://docs.yourplatform.com',
  GITHUB: 'https://github.com/yourproject',
  DISCORD: 'https://discord.gg/yourproject',
  TWITTER: 'https://twitter.com/yourproject',
} as const;
