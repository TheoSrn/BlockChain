// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
	constructor(
		string memory name_,
		string memory symbol_,
		uint256 initialSupply,
		address to
	) ERC20(name_, symbol_) {
		require(to != address(0), "TO_ZERO");
		_mint(to, initialSupply);
	}

	function mint(address to, uint256 amount) external {
		_mint(to, amount);
	}
}
