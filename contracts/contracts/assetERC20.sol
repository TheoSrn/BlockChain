// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IKYC} from "./interfaces/IKYC.sol";

contract AssetERC20 is Initializable, ERC20Upgradeable, AccessControlUpgradeable {
	bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");
	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

	IKYC public kyc;
	bool public kycRequired = true;

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
		uint256 initialSupply,
		address treasury
	) external initializer {
		require(admin != address(0), "ADMIN_ZERO");
		require(factory != address(0), "FACTORY_ZERO");
		require(kycAddress != address(0), "KYC_ZERO");
		require(treasury != address(0), "TREASURY_ZERO");

		__ERC20_init(name_, symbol_);
		__AccessControl_init();

		_grantRole(DEFAULT_ADMIN_ROLE, admin);
		_grantRole(ADMIN_ROLE, admin);
		_grantRole(FACTORY_ROLE, factory);

		kyc = IKYC(kycAddress);
		_mint(treasury, initialSupply);
	}

	function mint(address to, uint256 amount) external onlyMinter {
		_mint(to, amount);
	}

	function burn(address from, uint256 amount) external onlyMinter {
		_burn(from, amount);
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

	function _update(address from, address to, uint256 value) internal override {
		if (kycRequired && from != address(0) && to != address(0)) {
			require(kyc.isWhitelisted(from), "KYC_FROM");
			require(kyc.isWhitelisted(to), "KYC_TO");
			require(!kyc.isBlacklisted(from), "BL_FROM");
			require(!kyc.isBlacklisted(to), "BL_TO");
		}

		super._update(from, to, value);
	}
}
