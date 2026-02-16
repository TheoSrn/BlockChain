// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract KYC is AccessControl {
	bytes32 public constant KYC_ADMIN_ROLE = keccak256("KYC_ADMIN_ROLE");

	enum KYCStatus { NONE, PENDING, APPROVED, REJECTED }

	struct KYCRequest {
		address user;
		string fullName;
		string country;
		string documentType;
		string documentNumber;
		uint256 timestamp;
		KYCStatus status;
	}

	mapping(address => bool) private whitelist;
	mapping(address => bool) private blacklist;
	mapping(address => KYCRequest) public kycRequests;
	address[] public pendingRequests;

	event WhitelistUpdated(address indexed user, bool status);
	event BlacklistUpdated(address indexed user, bool status);
	event KYCSubmitted(address indexed user, string fullName, string country, uint256 timestamp);
	event KYCApproved(address indexed user, address indexed admin, uint256 timestamp);
	event KYCRejected(address indexed user, address indexed admin, uint256 timestamp);

	constructor(address admin) {
		require(admin != address(0), "ADMIN_ZERO");
		_grantRole(DEFAULT_ADMIN_ROLE, admin);
		_grantRole(KYC_ADMIN_ROLE, admin);
	}

	// Submit KYC application (anyone can call)
	function submitKYC(
		string memory fullName,
		string memory country,
		string memory documentType,
		string memory documentNumber
	) external {
		require(bytes(fullName).length > 0, "NAME_EMPTY");
		require(bytes(country).length > 0, "COUNTRY_EMPTY");
		require(kycRequests[msg.sender].status != KYCStatus.PENDING, "ALREADY_PENDING");

		kycRequests[msg.sender] = KYCRequest({
			user: msg.sender,
			fullName: fullName,
			country: country,
			documentType: documentType,
			documentNumber: documentNumber,
			timestamp: block.timestamp,
			status: KYCStatus.PENDING
		});

		pendingRequests.push(msg.sender);

		emit KYCSubmitted(msg.sender, fullName, country, block.timestamp);
	}

	// Approve KYC (admin only)
	function approveKYC(address user) external onlyRole(KYC_ADMIN_ROLE) {
		require(kycRequests[user].status == KYCStatus.PENDING, "NOT_PENDING");
		
		kycRequests[user].status = KYCStatus.APPROVED;
		whitelist[user] = true;
		
		_removePendingRequest(user);
		
		emit KYCApproved(user, msg.sender, block.timestamp);
		emit WhitelistUpdated(user, true);
	}

	// Reject KYC (admin only)
	function rejectKYC(address user) external onlyRole(KYC_ADMIN_ROLE) {
		require(kycRequests[user].status == KYCStatus.PENDING, "NOT_PENDING");
		
		kycRequests[user].status = KYCStatus.REJECTED;
		blacklist[user] = true;
		
		_removePendingRequest(user);
		
		emit KYCRejected(user, msg.sender, block.timestamp);
		emit BlacklistUpdated(user, true);
	}

	// Get all pending requests
	function getPendingRequests() external view returns (address[] memory) {
		return pendingRequests;
	}

	// Get KYC request details
	function getKYCRequest(address user) external view returns (KYCRequest memory) {
		return kycRequests[user];
	}

	// Internal function to remove from pending array
	function _removePendingRequest(address user) private {
		for (uint256 i = 0; i < pendingRequests.length; i++) {
			if (pendingRequests[i] == user) {
				pendingRequests[i] = pendingRequests[pendingRequests.length - 1];
				pendingRequests.pop();
				break;
			}
		}
	}

// Manual whitelist/blacklist functions (admin only, for direct control)
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
