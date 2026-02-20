import fs from 'node:fs';
import path from 'node:path';
import { ethers } from 'ethers';
import { config } from './config.js';
const EVENT_ABI = [
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
    'event Swap(address indexed trader, address indexed tokenIn, uint256 amountIn, uint256 amountOut)',
    'event SwapExecuted(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, uint256 fee)',
    'event LiquidityAdded(address indexed provider, uint256 amountAsset, uint256 amountBase, uint256 liquidity)',
    'event LiquidityRemoved(address indexed provider, uint256 amountAsset, uint256 amountBase)',
    'event PriceUpdated(uint256 indexed assetId, uint256 price, uint256 updatedAt)',
    'event AssetCreated(uint256 indexed assetId, address indexed nft, address indexed token, address pool)',
    'event WhitelistUpdated(address indexed user, bool status)',
    'event BlacklistUpdated(address indexed user, bool status)',
    'event KYCSubmitted(address indexed user, string fullName, string country, uint256 timestamp)',
    'event KYCApproved(address indexed user, address indexed admin, uint256 timestamp)',
    'event KYCRejected(address indexed user, address indexed admin, uint256 timestamp)',
];
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const CHECKPOINT_FILE = path.resolve(process.cwd(), 'data', 'checkpoint.json');
const interfaceByContract = new Map();
const contractByAddress = new Map();
const safeMkdir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};
const toSerializable = (value) => {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    if (Array.isArray(value)) {
        return value.map(toSerializable);
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, toSerializable(nestedValue)]));
    }
    return value;
};
const sleep = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});
const isRateLimitedError = (error) => {
    if (!error || typeof error !== 'object') {
        return false;
    }
    const maybeError = error;
    if (maybeError.error?.code === 429) {
        return true;
    }
    const message = `${maybeError.shortMessage ?? ''} ${maybeError.error?.message ?? ''}`.toLowerCase();
    return message.includes('429') || message.includes('throughput') || message.includes('compute units');
};
const normalizeAddress = (value) => {
    if (!value || typeof value !== 'string') {
        return undefined;
    }
    return value.toLowerCase();
};
const mapEventType = (eventName, args) => {
    if (eventName === 'Transfer') {
        const from = normalizeAddress(args.from);
        const to = normalizeAddress(args.to);
        if (from === ZERO_ADDRESS) {
            return 'Mint';
        }
        if (to === ZERO_ADDRESS) {
            return 'Burn';
        }
        return 'Transfer';
    }
    if (eventName === 'Approval') {
        return 'Approval';
    }
    if (eventName === 'Swap' || eventName === 'SwapExecuted') {
        return 'Swap';
    }
    if (eventName === 'LiquidityAdded') {
        return 'LiquidityAdd';
    }
    if (eventName === 'LiquidityRemoved') {
        return 'LiquidityRemove';
    }
    return eventName;
};
const extractEventAmounts = (eventName, args) => {
    if (eventName === 'Transfer' || eventName === 'Approval') {
        return { amount: args.value?.toString?.() ?? undefined };
    }
    if (eventName === 'Swap') {
        return {
            amount0: args.amountIn?.toString?.() ?? undefined,
            amount1: args.amountOut?.toString?.() ?? undefined,
        };
    }
    if (eventName === 'SwapExecuted') {
        return {
            amount0: args.amountIn?.toString?.() ?? undefined,
            amount1: args.amountOut?.toString?.() ?? undefined,
        };
    }
    if (eventName === 'LiquidityAdded') {
        return {
            amount0: args.amountAsset?.toString?.() ?? undefined,
            amount1: args.amountBase?.toString?.() ?? undefined,
        };
    }
    if (eventName === 'LiquidityRemoved') {
        return {
            amount0: args.amountAsset?.toString?.() ?? undefined,
            amount1: args.amountBase?.toString?.() ?? undefined,
        };
    }
    return {};
};
export class OnChainIndexer {
    provider;
    isSyncing = false;
    timer = null;
    listeners = new Set();
    events = [];
    seenEventIds = new Set();
    blockTimestamps = new Map();
    lastSyncedBlock;
    constructor() {
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl, config.chainId);
        this.lastSyncedBlock = this.loadCheckpoint();
        config.contracts.forEach((contract) => {
            const address = contract.address.toLowerCase();
            interfaceByContract.set(address, new ethers.Interface(EVENT_ABI));
            contractByAddress.set(address, contract);
        });
    }
    onEvent(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    getEvents(filters) {
        let output = [...this.events];
        if (filters?.address) {
            const address = filters.address.toLowerCase();
            output = output.filter((event) => {
                const values = [event.from, event.to, ...Object.values(event.args).map((value) => String(value ?? '').toLowerCase())];
                return values.includes(address);
            });
        }
        if (filters?.contract) {
            const contract = filters.contract.toLowerCase();
            output = output.filter((event) => event.contractAddress.toLowerCase() === contract);
        }
        if (filters?.type) {
            const type = filters.type.toLowerCase();
            output = output.filter((event) => event.eventType.toLowerCase() === type || event.eventName.toLowerCase() === type);
        }
        if (filters?.limit && filters.limit > 0) {
            output = output.slice(0, filters.limit);
        }
        return output;
    }
    async start() {
        await this.syncOnce();
        this.timer = setInterval(() => {
            void this.syncOnce();
        }, config.pollIntervalMs);
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    getMeta() {
        return {
            chainId: config.chainId,
            rpcUrl: config.rpcUrl,
            trackedContracts: config.contracts,
            lastSyncedBlock: this.lastSyncedBlock,
            totalEvents: this.events.length,
            pollIntervalMs: config.pollIntervalMs,
        };
    }
    loadCheckpoint() {
        try {
            if (!fs.existsSync(CHECKPOINT_FILE)) {
                return config.startBlock;
            }
            const file = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
            const parsed = JSON.parse(file);
            if (typeof parsed.lastSyncedBlock === 'number' && parsed.lastSyncedBlock >= 0) {
                return parsed.lastSyncedBlock;
            }
        }
        catch (error) {
            console.error('Failed to load checkpoint:', error);
        }
        return config.startBlock;
    }
    saveCheckpoint() {
        try {
            safeMkdir(path.dirname(CHECKPOINT_FILE));
            fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({ lastSyncedBlock: this.lastSyncedBlock }, null, 2));
        }
        catch (error) {
            console.error('Failed to save checkpoint:', error);
        }
    }
    async syncOnce() {
        if (this.isSyncing) {
            return;
        }
        this.isSyncing = true;
        try {
            const currentBlock = await this.provider.getBlockNumber();
            const initialFromBlock = this.lastSyncedBlock > 0
                ? this.lastSyncedBlock + 1
                : config.startBlock > 0
                    ? config.startBlock
                    : Math.max(0, currentBlock - config.initialLookbackBlocks);
            let fromBlock = initialFromBlock;
            if (currentBlock < fromBlock) {
                return;
            }
            const discoveredEvents = [];
            while (fromBlock <= currentBlock) {
                const toBlock = Math.min(fromBlock + config.maxBlockRange - 1, currentBlock);
                const logs = await this.getLogsWithRetry(fromBlock, toBlock);
                const parsed = await this.parseLogs(logs);
                discoveredEvents.push(...parsed);
                if (config.requestDelayMs > 0) {
                    await sleep(config.requestDelayMs);
                }
                fromBlock = toBlock + 1;
            }
            discoveredEvents.sort((a, b) => {
                if (a.blockNumber === b.blockNumber) {
                    return a.logIndex - b.logIndex;
                }
                return a.blockNumber - b.blockNumber;
            });
            for (const event of discoveredEvents) {
                if (this.seenEventIds.has(event.id)) {
                    continue;
                }
                this.seenEventIds.add(event.id);
                this.events.unshift(event);
                this.listeners.forEach((listener) => listener(event));
            }
            if (this.events.length > config.maxStoredEvents) {
                this.events = this.events.slice(0, config.maxStoredEvents);
            }
            this.lastSyncedBlock = currentBlock;
            this.saveCheckpoint();
            if (discoveredEvents.length > 0) {
                console.log(`Indexed ${discoveredEvents.length} event(s) from block ${fromBlock} to ${currentBlock}`);
            }
        }
        catch (error) {
            console.error('Indexer sync error:', error);
        }
        finally {
            this.isSyncing = false;
        }
    }
    async getLogsWithRetry(fromBlock, toBlock) {
        let attempt = 0;
        while (attempt <= config.maxLogRetries) {
            try {
                return await this.provider.getLogs({
                    address: config.contracts.map((contract) => contract.address),
                    fromBlock,
                    toBlock,
                });
            }
            catch (error) {
                if (!isRateLimitedError(error) || attempt === config.maxLogRetries) {
                    throw error;
                }
                const delay = Math.min(10_000, 500 * 2 ** attempt);
                console.warn(`RPC rate limit on blocks ${fromBlock}-${toBlock}, retry ${attempt + 1}/${config.maxLogRetries} in ${delay}ms`);
                await sleep(delay);
                attempt += 1;
            }
        }
        return [];
    }
    async parseLogs(logs) {
        const parsedEvents = [];
        for (const log of logs) {
            try {
                const contractAddress = log.address.toLowerCase();
                const contractInterface = interfaceByContract.get(contractAddress);
                const contract = contractByAddress.get(contractAddress);
                if (!contractInterface || !contract) {
                    continue;
                }
                const parsedLog = contractInterface.parseLog(log);
                if (!parsedLog) {
                    continue;
                }
                const blockTimestamp = await this.getBlockTimestamp(log.blockNumber);
                const namedArgs = Object.fromEntries(parsedLog.fragment.inputs.map((input, index) => [input.name || String(index), parsedLog.args[index]]));
                const args = toSerializable(namedArgs);
                const eventType = mapEventType(parsedLog.name, args);
                const id = `${log.transactionHash}-${log.index}`;
                const amountFields = extractEventAmounts(parsedLog.name, args);
                const from = args.from ??
                    args.owner ??
                    args.provider ??
                    args.trader ??
                    args.user;
                const to = args.to ??
                    args.spender ??
                    args.recipient ??
                    args.admin ??
                    args.tokenOut;
                parsedEvents.push({
                    id,
                    blockNumber: log.blockNumber,
                    transactionHash: log.transactionHash,
                    logIndex: log.index,
                    eventType,
                    contractAddress: log.address,
                    contractTag: contract.tag,
                    eventName: parsedLog.name,
                    timestamp: blockTimestamp,
                    from,
                    to,
                    ...amountFields,
                    args,
                });
            }
            catch {
                continue;
            }
        }
        return parsedEvents;
    }
    async getBlockTimestamp(blockNumber) {
        const cached = this.blockTimestamps.get(blockNumber);
        if (cached) {
            return cached;
        }
        const block = await this.provider.getBlock(blockNumber);
        const timestamp = block?.timestamp ?? 0;
        this.blockTimestamps.set(blockNumber, timestamp);
        return timestamp;
    }
}
