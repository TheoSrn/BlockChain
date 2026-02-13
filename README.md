# BlockChain Project

This repository contains a smart-contract stack (Hardhat) and a Next.js frontend. The goal is to deploy contracts locally, set env variables, and run the web app.

## Project Structure
- contracts/ : Solidity smart contracts + Hardhat config + deploy script
- frontend/  : Next.js app (UI, hooks, services)
- indexer/   : Optional indexer (placeholder in this repo)
- backend/   : Optional backend (currently empty)
- docs/      : Documentation

## Prerequisites
- Node.js 18+ (recommended)
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

### Run local node
```powershell
npx hardhat node
```
Leave this terminal open.

### Deploy contracts (second terminal)
```powershell
cd BlockChain\contracts
npx hardhat run scripts/deploy.ts --network sepolia
```
This prints the NEXT_PUBLIC_ values to copy into the frontend .env.local.

## 2) Frontend (Next.js)
The frontend reads contract addresses from frontend/.env.local.

### Create frontend/.env.local
Paste the addresses printed by the deploy script, for example:
```
NEXT_PUBLIC_ASSET_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_KYC_ADDRESS=0x...
NEXT_PUBLIC_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_BASE_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_LOCAL_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_DEFAULT_ASSET_ID=1
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_USDT_ADDRESS=0x...
```

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
You can manage KYC status directly from Hardhat console. Use the KYC address
from frontend/.env.local (NEXT_PUBLIC_KYC_ADDRESS).

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

Note: The caller must have the KYC admin role (usually the deployer).

## Notes
- backend/ and indexer/ are placeholders in this repo.
- If you change the Hardhat config, restart the local node.

## Troubleshooting
- HH1006: Make sure Solidity files are in contracts/ and dependencies installed.
- HH108: Start the Hardhat node before deploying.
- Contract size errors: local config allows unlimited contract size.
