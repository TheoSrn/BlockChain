// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract Oracle is AccessControl {
	bytes32 public constant ORACLE_ADMIN_ROLE = keccak256("ORACLE_ADMIN_ROLE");
	bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");

	struct AssetRef {
		address nft;
		address token;
		bool exists;
	}

	struct PriceData {
		uint256 price;
		uint256 updatedAt;
		string currency; // Currency denomination (USDC, USDT, WETH, USD, etc.)
	}

	mapping(uint256 => AssetRef) private assets;
	mapping(uint256 => PriceData) private prices;

	event AssetRegistered(uint256 indexed assetId, address indexed nft, address indexed token);
	event PriceUpdated(uint256 indexed assetId, uint256 price, uint256 updatedAt, string currency);

	constructor(address admin) {
		require(admin != address(0), "ADMIN_ZERO");
		_grantRole(DEFAULT_ADMIN_ROLE, admin);
		_grantRole(ORACLE_ADMIN_ROLE, admin);
	}

	function registerAsset(uint256 assetId, address nft, address token) external onlyRole(FACTORY_ROLE) {
		require(!assets[assetId].exists, "ASSET_EXISTS");
		require(nft != address(0) && token != address(0), "ADDR_ZERO");

		assets[assetId] = AssetRef({nft: nft, token: token, exists: true});
		emit AssetRegistered(assetId, nft, token);
	}

	function setPrice(uint256 assetId, uint256 price, string memory currency) external onlyRole(ORACLE_ADMIN_ROLE) {
		require(assets[assetId].exists, "ASSET_UNKNOWN");
		prices[assetId] = PriceData({price: price, updatedAt: block.timestamp, currency: currency});
		emit PriceUpdated(assetId, price, block.timestamp, currency);
	}

	function getPrice(uint256 assetId) external view returns (uint256 price, uint256 updatedAt, string memory currency) {
		PriceData memory data = prices[assetId];
		return (data.price, data.updatedAt, data.currency);
	}

	function getAsset(uint256 assetId) external view returns (address nft, address token, bool exists) {
		AssetRef memory data = assets[assetId];
		return (data.nft, data.token, data.exists);
	}

	function grantFactoryRole(address factory) external onlyRole(ORACLE_ADMIN_ROLE) {
		_grantRole(FACTORY_ROLE, factory);
	}
}
