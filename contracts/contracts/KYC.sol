// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract KYC is AccessControl {
	bytes32 public constant KYC_ADMIN_ROLE = keccak256("KYC_ADMIN_ROLE");

	mapping(address => bool) private whitelist;
	mapping(address => bool) private blacklist;

	event WhitelistUpdated(address indexed user, bool status);
	event BlacklistUpdated(address indexed user, bool status);

	constructor(address admin) {
		require(admin != address(0), "ADMIN_ZERO");
		_grantRole(DEFAULT_ADMIN_ROLE, admin);
		_grantRole(KYC_ADMIN_ROLE, admin);
	}

	function setWhitelisted(address user, bool status) external onlyRole(KYC_ADMIN_ROLE) {
		whitelist[user] = status;
		emit WhitelistUpdated(user, status);
	}

	function setBlacklisted(address user, bool status) external onlyRole(KYC_ADMIN_ROLE) {
		blacklist[user] = status;
		emit BlacklistUpdated(user, status);
	}

	function setBatchWhitelisted(address[] calldata users, bool status) external onlyRole(KYC_ADMIN_ROLE) {
		for (uint256 i = 0; i < users.length; i++) {
			whitelist[users[i]] = status;
			emit WhitelistUpdated(users[i], status);
		}
	}

	function setBatchBlacklisted(address[] calldata users, bool status) external onlyRole(KYC_ADMIN_ROLE) {
		for (uint256 i = 0; i < users.length; i++) {
			blacklist[users[i]] = status;
			emit BlacklistUpdated(users[i], status);
		}
	}

	function isWhitelisted(address user) external view returns (bool) {
		return whitelist[user];
	}

	function isBlacklisted(address user) external view returns (bool) {
		return blacklist[user];
	}

	function isVerified(address user) external view returns (bool) {
		return whitelist[user] && !blacklist[user];
	}
}
