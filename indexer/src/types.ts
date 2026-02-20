export type SupportedEventType =
  | 'Swap'
  | 'Transfer'
  | 'Mint'
  | 'Burn'
  | 'Approval'
  | 'LiquidityAdd'
  | 'LiquidityRemove'
  | string;

export interface BlockchainEvent {
  id: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  eventType: SupportedEventType;
  contractAddress: string;
  contractTag: string;
  eventName: string;
  timestamp: number;
  from?: string;
  to?: string;
  amount?: string;
  amount0?: string;
  amount1?: string;
  args: Record<string, unknown>;
}

export interface ContractConfig {
  tag: string;
  address: string;
}

export interface IndexerConfig {
  chainId: number;
  rpcUrl: string;
  pollIntervalMs: number;
  startBlock: number;
  maxBlockRange: number;
  initialLookbackBlocks: number;
  requestDelayMs: number;
  maxLogRetries: number;
  maxStoredEvents: number;
  contracts: ContractConfig[];
}
