# BlockChain Project

Smart-contracts (Hardhat) + Next.js frontend. Follow the steps below to deploy contracts, create the right .env files, and run the app.

## Project Structure
- contracts/ : Solidity smart contracts + Hardhat config + deploy scripts
- frontend/  : Next.js app (UI, hooks, services)
- indexer/   : On-chain event indexer (REST + WebSocket)
- backend/   : Optional backend (currently empty)
- docs/      : Documentation

## Prerequisites
- Node.js 18+
- npm

## 1) Smart Contracts (Hardhat)
All contracts live in contracts/.

### Install dependencies
```powershell
cd BlockChain\contracts
npm install
```

### Compile
```powershell
npx hardhat compile
```

### Run a local node
```powershell
npx hardhat node
```
Leave this terminal open.

### Deploy contracts (new terminal)
```powershell
cd BlockChain\contracts
npx hardhat run scripts/deploy.ts --network sepolia
```
The deploy script prints the contract addresses you must copy into the frontend .env.local.

## 2) Frontend (Next.js)
The frontend reads all configuration from frontend/.env.local.

### Create frontend/.env.local
Create this file at:
```
BlockChain\frontend\.env.local
```

Minimal required variables:
```
NEXT_PUBLIC_ASSET_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_KYC_ADDRESS=0x...
NEXT_PUBLIC_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_BASE_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_USDT_ADDRESS=0x...
NEXT_PUBLIC_DEFAULT_ASSET_ID=1
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://YOUR_SEPOLIA_RPC
```

Optional but recommended:
```
# Etherscan (transactions history)
ETHERSCAN_API_KEY=your_etherscan_api_key

# Local RPC (only if you run a local node)
NEXT_PUBLIC_LOCAL_RPC_URL=http://127.0.0.1:8545
```

After any change to .env.local, restart the dev server.

### Run the app
```powershell
cd BlockChain\frontend
npm install
npm run dev
```
Open http://localhost:3000

## 3) Basic Test Flow
1. Open /kyc and verify your wallet is whitelisted.
2. Open /tokenize and create an asset in the Factory tab.
3. Mint ERC20 tokens in the ERC20 tab.
4. Check /oracle for prices and /dashboard for balances.

## 4) Whitelist / Blacklist a Wallet (KYC)
Use the KYC address from frontend/.env.local (NEXT_PUBLIC_KYC_ADDRESS).

```powershell
cd BlockChain\contracts
npx hardhat console --network localhost
```

```js
const kyc = await ethers.getContractAt("KYC", "0xYOUR_KYC_ADDRESS");

// Whitelist
await kyc.setWhitelisted("0xYOUR_WALLET", true);

// Unwhitelist
await kyc.setWhitelisted("0xYOUR_WALLET", false);

// Blacklist
await kyc.setBlacklisted("0xYOUR_WALLET", true);

// Unblacklist
await kyc.setBlacklisted("0xYOUR_WALLET", false);
```

Note: the caller must have the KYC admin role (usually the deployer).

## Notes
- backend/ is currently a placeholder.
- If you change Hardhat config, restart the local node.

## 5) Start the Indexer (On-Chain Events Sync)

```powershell
cd BlockChain\indexer
npm install
copy .env.example .env
npm run dev
```

Default endpoints:
- REST: `http://localhost:8080/events`
- WS: `ws://localhost:8080/events/stream`

## Troubleshooting
- HH1006: Make sure Solidity files are in contracts/ and dependencies installed.
- HH108: Start the Hardhat node before deploying.
- Contract size errors: local config allows unlimited contract size.
