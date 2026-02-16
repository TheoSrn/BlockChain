// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IOracle
 * @notice Interface for the Oracle contract providing price feeds for real-world assets and NFT collections
 */
interface IOracle {
    /**
     * @notice Emitted when a new asset is registered in the Oracle
     * @param assetId The unique identifier for the asset
     * @param nft Address of the NFT contract
     * @param token Address of the ERC20 token contract
     */
    event AssetRegistered(uint256 indexed assetId, address indexed nft, address indexed token);
    
    /**
     * @notice Emitted when an asset's price is updated
     * @param assetId The unique identifier for the asset
     * @param price The new price in USD (6 decimals)
     * @param updatedAt Timestamp of the update
     */
    event PriceUpdated(uint256 indexed assetId, uint256 price, uint256 updatedAt);
    
    /**
     * @notice Register a new asset in the Oracle
     * @param assetId The unique identifier for the asset
     * @param nft Address of the NFT contract
     * @param token Address of the ERC20 token contract
     */
    function registerAsset(uint256 assetId, address nft, address token) external;
    
    /**
     * @notice Set the price for an asset
     * @param assetId The unique identifier for the asset
     * @param price The price in USD (6 decimals, e.g., 1000000 = $1.00)
     */
    function setPrice(uint256 assetId, uint256 price) external;
    
    /**
     * @notice Get the current price of an asset
     * @param assetId The unique identifier for the asset
     * @return price Current price in USD (6 decimals)
     * @return updatedAt Timestamp of last price update
     */
    function getPrice(uint256 assetId) external view returns (uint256 price, uint256 updatedAt);
    
    /**
     * @notice Get asset information
     * @param assetId The unique identifier for the asset
     * @return nft Address of the NFT contract
     * @return token Address of the ERC20 token contract
     * @return exists Whether the asset exists in the Oracle
     */
    function getAsset(uint256 assetId) external view returns (address nft, address token, bool exists);
    
    /**
     * @notice Grant factory role to an address
     * @param factory Address to grant the factory role to
     */
    function grantFactoryRole(address factory) external;
}
