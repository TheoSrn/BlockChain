# On-Chain Oracle System for Real-World Assets & NFT Collections

## Overview

This project implements a **decentralized on-chain oracle** that provides price feeds for tokenized real-world assets (RWA) and NFT collections. The oracle is a smart contract deployed on-chain that stores and serves price data with timestamps.

## What is an Oracle?

In blockchain systems, an **oracle** is a mechanism that brings external data onto the blockchain. Our oracle specifically provides:

- **Real-time price data** for tokenized assets
- **On-chain storage** for transparency and verifiability
- **Timestamp verification** to ensure data freshness
- **Multi-asset support** for various token types and NFT collections

## Supported Asset Types

Our oracle can provide price feeds for:

### 🏛️ Real Estate Tokens
Tokenized real estate properties with on-chain valuations

### 🎨 NFT Collections
Floor prices and valuations for NFT collections (art, collectibles, etc.)

### 💎 Commodities
Tokenized commodities like gold, silver, and other precious assets

### 🖼️ Art & Collectibles
Fine art and high-value collectibles represented as tokens

## Smart Contract Architecture

### Oracle Contract (`oracle.sol`)

The Oracle smart contract implements:

```solidity
// Key functions:
- getPrice(uint256 assetId) → Returns (price, timestamp)
- setPrice(uint256 assetId, uint256 price) → Updates price (admin only)
- getAsset(uint256 assetId) → Returns asset information
- registerAsset(uint256 assetId, address nft, address token) → Registers new asset
```

**Access Control:**
- `ORACLE_ADMIN_ROLE`: Can update prices
- `FACTORY_ROLE`: Can register new assets
- Uses OpenZeppelin's AccessControl for security

**Events:**
- `PriceUpdated(assetId, price, timestamp)`: Emitted when price is updated
- `AssetRegistered(assetId, nft, token)`: Emitted when new asset is registered

## Frontend Implementation

### Oracle Page (`/oracle`)

The oracle page provides a comprehensive UI for viewing price feeds:

**Features:**
- Real-time price display with 10-second auto-refresh
- Multiple asset cards showing all tracked assets
- Detailed price information with timestamps
- On-chain data verification (raw price values, block timestamps)
- Oracle status monitoring

**Components:**
1. **PriceCard**: Individual asset price display
2. **PriceDetails**: Comprehensive price information for selected asset
3. **Oracle Status**: Real-time oracle health monitoring

### React Hooks

**`useOracle(assetId)`**
- Fetches price data from the Oracle smart contract
- Auto-refreshes every 10 seconds
- Returns formatted price, raw price, and timestamp

**`useOracleAsset(assetId)`**
- Fetches asset metadata from the Oracle
- Returns NFT address, token address, and existence status

**`usePriceAlert(assetId, targetPrice, onAlert)`**
- Monitors price changes
- Triggers callback when price reaches threshold

## How It Works

### 1. Asset Registration
```
Factory Contract → Oracle.registerAsset(id, nft, token)
```
When a new asset is tokenized, it's registered with the oracle.

### 2. Price Updates
```
Oracle Admin → Oracle.setPrice(assetId, newPrice)
```
Authorized administrators update prices using external data sources.

### 3. Price Queries
```
DApp/Contract → Oracle.getPrice(assetId) → (price, timestamp)
```
Anyone can query the latest price for any registered asset.

### 4. Frontend Display
```
Frontend (every 10s) → RPC Call → Oracle.getPrice() → Display
```
The UI automatically fetches and displays the latest prices.

## Technical Details

### Price Format
- Prices are stored as `uint256` with **6 decimals**
- Example: `1000000` = $1.00
- This allows for precise pricing of high-value assets

### Timestamp Verification
- Each price update includes a `block.timestamp`
- Frontend displays time since last update
- Ensures users can verify data freshness

### On-Chain Security
- All price data is stored permanently on-chain
- Role-based access control (RBAC) prevents unauthorized updates
- Events provide audit trail of all price changes

## Use Cases

### DeFi Applications
- Collateral valuation for lending protocols
- Automated market making (AMM) for RWA tokens
- Price-based triggers for smart contracts

### Trading Platforms
- Real-time pricing for RWA token trading
- Fair market value determination
- Portfolio valuation

### Asset Management
- Real-time portfolio tracking
- Performance analytics
- Risk assessment

## Contract Addresses

**Oracle Contract:**
```
Address: (Check config/contracts.ts for current deployment)
```

**Factory Contract:**
```
Address: (Check config/contracts.ts for current deployment)
```

## API Reference

### Reading Prices

```typescript
import { useOracle } from '@/hooks/web3/useOracle';

function MyComponent() {
  const { priceData, isLoading, error } = useOracle(assetId);
  
  if (priceData) {
    console.log(priceData.formattedPrice); // "$1,234.56"
    console.log(priceData.price);          // "1234560000"
    console.log(priceData.timestamp);      // 1708123456
  }
}
```

### Reading Asset Information

```typescript
import { useOracleAsset } from '@/hooks/web3/useOracle';

function AssetInfo({ assetId }) {
  const { asset, isLoading, error } = useOracleAsset(assetId);
  
  if (asset) {
    console.log(asset.nft);    // NFT contract address
    console.log(asset.token);  // ERC20 token address
    console.log(asset.exists); // true/false
  }
}
```

## Future Enhancements

- [ ] Multiple price source aggregation
- [ ] Decentralized oracle network integration (Chainlink, etc.)
- [ ] Historical price charts
- [ ] Price history indexing
- [ ] Volatility indicators
- [ ] Price change alerts

## Security Considerations

1. **Centralization Risk**: Current implementation uses admin-managed prices
2. **Price Manipulation**: Ensure multiple data sources in production
3. **Staleness**: Monitor timestamp to detect outdated prices
4. **Access Control**: Strictly manage oracle admin roles

## Testing

To test the oracle:

1. Deploy Oracle contract
2. Grant ORACLE_ADMIN_ROLE to your address
3. Register an asset via Factory
4. Set initial price using `setPrice()`
5. View on `/oracle` page in frontend

## Conclusion

This oracle system provides a foundation for bringing real-world asset prices on-chain. It demonstrates:

✅ On-chain data storage for transparency  
✅ Price feeds for tokenized assets  
✅ Integration with DeFi ecosystem  
✅ Real-time price updates  
✅ Security through access control  

The oracle can be extended with additional features like multiple data sources, price history, and decentralized oracle networks for production use.
