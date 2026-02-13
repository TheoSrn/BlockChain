// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IKYC} from "./interfaces/IKYC.sol";

contract AssetNFT is Initializable, ERC721Upgradeable, AccessControlUpgradeable {
	bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");
	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

	struct AssetMetadata {
		string location;
		uint256 surface;
		uint256 estimatedValue;
		string description;
		string documents;
	}

	uint256 public assetId;
	bool public minted;
	string private assetTokenUri;
	AssetMetadata private metadata;
	IKYC public kyc;
	bool public kycRequired = true;

	event TokenUriUpdated(string tokenUri);
	event KycUpdated(address indexed kyc);
	event KycRequiredUpdated(bool required);

	modifier onlyMinter() {
		require(hasRole(FACTORY_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender), "NO_MINTER");
		_;
	}

	constructor() {
		_disableInitializers();
	}

	function initialize(
		string memory name_,
		string memory symbol_,
		address admin,
		address factory,
		address kycAddress,
		uint256 assetId_,
		address initialOwner,
		AssetMetadata memory metadata_,
		string memory tokenUri_
	) external initializer {
		require(admin != address(0), "ADMIN_ZERO");
		require(factory != address(0), "FACTORY_ZERO");
		require(kycAddress != address(0), "KYC_ZERO");
		require(initialOwner != address(0), "OWNER_ZERO");

		__ERC721_init(name_, symbol_);
		__AccessControl_init();

		_grantRole(DEFAULT_ADMIN_ROLE, admin);
		_grantRole(ADMIN_ROLE, admin);
		_grantRole(FACTORY_ROLE, factory);

		assetId = assetId_;
		kyc = IKYC(kycAddress);
		metadata = metadata_;
		assetTokenUri = tokenUri_;

		_mint(initialOwner, assetId_);
		minted = true;
	}

	function mint(address to) external onlyMinter {
		require(!minted, "ALREADY_MINTED");
		_mint(to, assetId);
		minted = true;
	}

	function setTokenUri(string calldata tokenUri_) external onlyRole(ADMIN_ROLE) {
		assetTokenUri = tokenUri_;
		emit TokenUriUpdated(tokenUri_);
	}

	function tokenURI(uint256 tokenId) public view override returns (string memory) {
		require(tokenId == assetId, "BAD_TOKEN");
		return assetTokenUri;
	}

	function supportsInterface(bytes4 interfaceId)
		public
		view
		override(ERC721Upgradeable, AccessControlUpgradeable)
		returns (bool)
	{
		return super.supportsInterface(interfaceId);
	}

	function getMetadata() external view returns (AssetMetadata memory) {
		return metadata;
	}

	function setKyc(address kycAddress) external onlyRole(ADMIN_ROLE) {
		require(kycAddress != address(0), "KYC_ZERO");
		kyc = IKYC(kycAddress);
		emit KycUpdated(kycAddress);
	}

	function setKycRequired(bool required) external onlyRole(ADMIN_ROLE) {
		kycRequired = required;
		emit KycRequiredUpdated(required);
	}

	function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
		address from = _ownerOf(tokenId);

		if (kycRequired && from != address(0) && to != address(0)) {
			require(kyc.isWhitelisted(from), "KYC_FROM");
			require(kyc.isWhitelisted(to), "KYC_TO");
			require(!kyc.isBlacklisted(from), "BL_FROM");
			require(!kyc.isBlacklisted(to), "BL_TO");
		}

		return super._update(to, tokenId, auth);
	}
}
