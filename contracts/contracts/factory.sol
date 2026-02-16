// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {AssetERC20} from "./assetERC20.sol";
import {AssetNFT} from "./assetNFT.sol";
import {AssetPool} from "./AssetPool.sol";
import {IOracle} from "./interfaces/IOracle.sol";

contract Factory is AccessControl {
	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

	struct AssetRecord {
		uint256 id;
		address nft;
		address token;
		address pool;
		string name;
		string symbol;
		bool active;
	}

	uint256 public assetCount;
	mapping(uint256 => AssetRecord) private assets;

	address public kyc;
	address public oracle;
	address public uniswapRouter;
	address public baseToken;
	address public admin;
	address public erc20Implementation;
	address public nftImplementation;
	address public poolImplementation;

	event AssetCreated(uint256 indexed assetId, address indexed nft, address indexed token, address pool);
	event KycUpdated(address indexed kyc);
	event OracleUpdated(address indexed oracle);
	event RouterUpdated(address indexed router);
	event BaseTokenUpdated(address indexed baseToken);

	constructor(
		address admin_,
		address kycAddress,
		address oracleAddress,
		address routerAddress,
		address baseTokenAddress,
		address erc20Implementation_,
		address nftImplementation_,
		address poolImplementation_
	) {
		require(admin_ != address(0), "ADMIN_ZERO");
		require(kycAddress != address(0), "KYC_ZERO");
		require(oracleAddress != address(0), "ORACLE_ZERO");
		require(routerAddress != address(0), "ROUTER_ZERO");
		require(baseTokenAddress != address(0), "BASE_ZERO");
		require(erc20Implementation_ != address(0), "ERC20_IMPL_ZERO");
		require(nftImplementation_ != address(0), "NFT_IMPL_ZERO");
		require(poolImplementation_ != address(0), "POOL_IMPL_ZERO");

		_grantRole(DEFAULT_ADMIN_ROLE, admin_);
		_grantRole(ADMIN_ROLE, admin_);

		kyc = kycAddress;
		oracle = oracleAddress;
		uniswapRouter = routerAddress;
		baseToken = baseTokenAddress;
		admin = admin_;
		erc20Implementation = erc20Implementation_;
		nftImplementation = nftImplementation_;
		poolImplementation = poolImplementation_;
	}

	function createAsset(
		string calldata tokenName,
		string calldata tokenSymbol,
		string calldata nftName,
		string calldata nftSymbol,
		address treasury,
		uint256 initialSupply,
		string calldata location,
		uint256 surface,
		uint256 estimatedValue,
		string calldata description,
		string calldata documents,
		string calldata tokenUri
	) external onlyRole(ADMIN_ROLE) returns (uint256 assetId) {
		require(treasury != address(0), "TREASURY_ZERO");

		assetId = ++assetCount;

		AssetNFT.AssetMetadata memory metadata = AssetNFT.AssetMetadata({
			location: location,
			surface: surface,
			estimatedValue: estimatedValue,
			description: description,
			documents: documents
		});

		address nftClone = Clones.clone(nftImplementation);
		AssetNFT nft = AssetNFT(nftClone);
		nft.initialize(
			nftName,
			nftSymbol,
			admin,
			address(this),
			kyc,
			assetId,
			treasury,
			metadata,
			tokenUri
		);

		address tokenClone = Clones.clone(erc20Implementation);
		AssetERC20 token = AssetERC20(tokenClone);
		token.initialize(
			tokenName,
			tokenSymbol,
			admin,
			address(this),
			kyc,
			initialSupply,
			treasury
		);

		address poolClone = Clones.clone(poolImplementation);
		AssetPool pool = AssetPool(poolClone);
		pool.initialize(
			admin,
			uniswapRouter,
			address(token),
			baseToken,
			kyc
		);

		assets[assetId] = AssetRecord({
			id: assetId,
			nft: address(nft),
			token: address(token),
			pool: address(pool),
			name: tokenName,
			symbol: tokenSymbol,
			active: true
		});

		IOracle(oracle).registerAsset(assetId, address(nft), address(token));

		emit AssetCreated(assetId, address(nft), address(token), address(pool));
	}

	function getAsset(uint256 assetId) external view returns (AssetRecord memory) {
		return assets[assetId];
	}

	function setKyc(address kycAddress) external onlyRole(ADMIN_ROLE) {
		require(kycAddress != address(0), "KYC_ZERO");
		kyc = kycAddress;
		emit KycUpdated(kycAddress);
	}

	function setOracle(address oracleAddress) external onlyRole(ADMIN_ROLE) {
		require(oracleAddress != address(0), "ORACLE_ZERO");
		oracle = oracleAddress;
		emit OracleUpdated(oracleAddress);
	}

	function setRouter(address routerAddress) external onlyRole(ADMIN_ROLE) {
		require(routerAddress != address(0), "ROUTER_ZERO");
		uniswapRouter = routerAddress;
		emit RouterUpdated(routerAddress);
	}

	function setBaseToken(address baseTokenAddress) external onlyRole(ADMIN_ROLE) {
		require(baseTokenAddress != address(0), "BASE_ZERO");
		baseToken = baseTokenAddress;
		emit BaseTokenUpdated(baseTokenAddress);
	}
}
