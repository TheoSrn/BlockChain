import dotenv from 'dotenv';
import { ContractConfig, IndexerConfig } from './types.js';

dotenv.config();

const toPositiveInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const buildContracts = (): ContractConfig[] => {
  const candidates: Array<{ tag: string; address?: string }> = [
    { tag: 'factory', address: process.env.ASSET_FACTORY_ADDRESS },
    { tag: 'kyc', address: process.env.KYC_ADDRESS },
    { tag: 'oracle', address: process.env.ORACLE_ADDRESS },
    { tag: 'router', address: process.env.ROUTER_ADDRESS },
    { tag: 'baseToken', address: process.env.BASE_TOKEN_ADDRESS },
    { tag: 'usdc', address: process.env.USDC_ADDRESS },
    { tag: 'usdt', address: process.env.USDT_ADDRESS },
  ];

  return candidates
    .filter((item): item is { tag: string; address: string } => Boolean(item.address))
    .map((item) => ({ tag: item.tag, address: item.address }));
};

export const config: IndexerConfig = {
  chainId: toPositiveInteger(process.env.CHAIN_ID, 11155111),
  rpcUrl: process.env.RPC_URL ?? 'http://127.0.0.1:8545',
  pollIntervalMs: toPositiveInteger(process.env.POLL_INTERVAL_MS, 60_000),
  startBlock: toPositiveInteger(process.env.START_BLOCK, 0),
  maxBlockRange: toPositiveInteger(process.env.MAX_BLOCK_RANGE, 10),
  initialLookbackBlocks: toPositiveInteger(process.env.INITIAL_LOOKBACK_BLOCKS, 500),
  requestDelayMs: toPositiveInteger(process.env.REQUEST_DELAY_MS, 250),
  maxLogRetries: toPositiveInteger(process.env.MAX_LOG_RETRIES, 6),
  maxStoredEvents: toPositiveInteger(process.env.MAX_STORED_EVENTS, 5_000),
  contracts: buildContracts(),
};

export const serverConfig = {
  port: toPositiveInteger(process.env.PORT, 8080),
};
