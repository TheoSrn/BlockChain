/**
 * Utilitaires pour formater les nombres et les adresses
 */

import { formatUnits, parseUnits } from 'viem';

/**
 * Formate une adresse Ethereum (0x1234...5678)
 */
export function formatAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Formate un montant en USD
 */
export function formatUSD(amount: bigint, decimals = 6): string {
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
}

/**
 * Formate un token amount
 */
export function formatTokenAmount(amount: bigint, decimals = 18, maxDecimals = 4): string {
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) return '0';
  if (num < 0.0001) return '< 0.0001';
  
  return num.toFixed(maxDecimals).replace(/\.?0+$/, '');
}

/**
 * Parse un montant en wei
 */
export function parseAmount(amount: string, decimals = 18): bigint {
  try {
    return parseUnits(amount, decimals);
  } catch {
    return 0n;
  }
}

/**
 * Calcule le pourcentage de changement
 */
export function calculatePercentageChange(current: bigint, previous: bigint): number {
  if (previous === 0n) return 0;
  const change = ((Number(current) - Number(previous)) / Number(previous)) * 100;
  return change;
}

/**
 * Formate un pourcentage
 */
export function formatPercentage(value: number, decimals = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Formate une date timestamp
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formate une date avec l'heure
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Convertit un temps relatif (ex: "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}
