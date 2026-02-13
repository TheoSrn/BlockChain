// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IOracle {
    function registerAsset(uint256 assetId, address nft, address token) external;
}
