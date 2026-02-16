// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IOracle.sol";

/**
 * @title OracleConsumerExample
 * @notice Example contract demonstrating how to consume price data from the Oracle
 * @dev This shows how other smart contracts can integrate with the Oracle for DeFi operations
 */
contract OracleConsumerExample {
    IOracle public oracle;
    
    event PriceChecked(uint256 indexed assetId, uint256 price, uint256 timestamp);
    event PriceThresholdMet(uint256 indexed assetId, uint256 price, uint256 threshold);
    
    constructor(address oracleAddress) {
        require(oracleAddress != address(0), "Invalid oracle address");
        oracle = IOracle(oracleAddress);
    }
    
    /**
     * @notice Get the current price of an asset from the Oracle
     * @param assetId The ID of the asset
     * @return price Current price in USD (6 decimals)
     * @return updatedAt Timestamp of last price update
     */
    function getAssetPrice(uint256 assetId) public view returns (uint256 price, uint256 updatedAt) {
        return oracle.getPrice(assetId);
    }
    
    /**
     * @notice Check if an asset's price is above a certain threshold
     * @param assetId The ID of the asset
     * @param threshold The price threshold to check against
     * @return bool True if price is above threshold
     */
    function isPriceAboveThreshold(uint256 assetId, uint256 threshold) public view returns (bool) {
        (uint256 price, ) = oracle.getPrice(assetId);
        return price >= threshold;
    }
    
    /**
     * @notice Calculate the total value of multiple assets
     * @param assetIds Array of asset IDs
     * @param quantities Array of quantities for each asset
     * @return totalValue Total value in USD (6 decimals)
     */
    function calculatePortfolioValue(
        uint256[] calldata assetIds,
        uint256[] calldata quantities
    ) public view returns (uint256 totalValue) {
        require(assetIds.length == quantities.length, "Array length mismatch");
        
        for (uint256 i = 0; i < assetIds.length; i++) {
            (uint256 price, ) = oracle.getPrice(assetIds[i]);
            totalValue += price * quantities[i];
        }
        
        return totalValue;
    }
    
    /**
     * @notice Check if price data is fresh (updated within last hour)
     * @param assetId The ID of the asset
     * @return bool True if price is fresh
     */
    function isPriceFresh(uint256 assetId) public view returns (bool) {
        (, uint256 updatedAt) = oracle.getPrice(assetId);
        return (block.timestamp - updatedAt) < 1 hours;
    }
    
    /**
     * @notice Execute a trade if price conditions are met
     * @dev This is a simplified example - real implementation would include actual trading logic
     * @param assetId The ID of the asset
     * @param minPrice Minimum acceptable price
     */
    function executeConditionalTrade(uint256 assetId, uint256 minPrice) public returns (bool) {
        (uint256 currentPrice, uint256 updatedAt) = oracle.getPrice(assetId);
        
        require(currentPrice >= minPrice, "Price below minimum");
        require((block.timestamp - updatedAt) < 1 hours, "Stale price data");
        
        emit PriceThresholdMet(assetId, currentPrice, minPrice);
        
        // Here you would implement actual trading logic
        // For example: swap tokens, mint/burn, transfer assets, etc.
        
        return true;
    }
    
    /**
     * @notice Get asset information from the Oracle
     * @param assetId The ID of the asset
     * @return nft Address of the NFT contract
     * @return token Address of the ERC20 token contract
     * @return exists Whether the asset exists in the Oracle
     */
    function getAssetInfo(uint256 assetId) public view returns (
        address nft,
        address token,
        bool exists
    ) {
        return oracle.getAsset(assetId);
    }
    
    /**
     * @notice Calculate collateral value for lending
     * @dev Example use case: DeFi lending protocol checking collateral value
     * @param assetId The ID of the asset used as collateral
     * @param amount Amount of tokens
     * @param collateralRatio Required collateral ratio (in basis points, e.g., 15000 = 150%)
     * @return maxBorrowAmount Maximum amount that can be borrowed
     */
    function calculateMaxBorrow(
        uint256 assetId,
        uint256 amount,
        uint256 collateralRatio
    ) public view returns (uint256 maxBorrowAmount) {
        require(collateralRatio > 10000, "Collateral ratio must be > 100%");
        
        (uint256 price, uint256 updatedAt) = oracle.getPrice(assetId);
        require((block.timestamp - updatedAt) < 1 hours, "Stale price data");
        
        uint256 collateralValue = (price * amount) / 1e6; // Assuming 6 decimals
        maxBorrowAmount = (collateralValue * 10000) / collateralRatio;
        
        return maxBorrowAmount;
    }
    
    /**
     * @notice Compare prices of two assets
     * @param assetId1 First asset ID
     * @param assetId2 Second asset ID
     * @return int256 Positive if asset1 > asset2, negative if asset1 < asset2, zero if equal
     */
    function comparePrices(uint256 assetId1, uint256 assetId2) public view returns (int256) {
        (uint256 price1, ) = oracle.getPrice(assetId1);
        (uint256 price2, ) = oracle.getPrice(assetId2);
        
        return int256(price1) - int256(price2);
    }
}
