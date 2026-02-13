// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IUniswapV2Router02} from "./interfaces/IUniswapV2Router02.sol";

contract AssetPool is Initializable, AccessControlUpgradeable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    address public assetToken;
    address public baseToken;
    IUniswapV2Router02 public router;
    address public lpToken;

    event LiquidityAdded(address indexed provider, uint256 amountAsset, uint256 amountBase, uint256 liquidity);
    event LiquidityRemoved(address indexed provider, uint256 amountAsset, uint256 amountBase);
    event Swap(address indexed trader, address indexed tokenIn, uint256 amountIn, uint256 amountOut);
    event LpTokenSet(address indexed lpToken);

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address admin,
        address routerAddress,
        address assetTokenAddress,
        address baseTokenAddress
    ) external initializer {
        require(admin != address(0), "ADMIN_ZERO");
        require(routerAddress != address(0), "ROUTER_ZERO");
        require(assetTokenAddress != address(0), "ASSET_ZERO");
        require(baseTokenAddress != address(0), "BASE_ZERO");

        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);

        router = IUniswapV2Router02(routerAddress);
        assetToken = assetTokenAddress;
        baseToken = baseTokenAddress;
    }

    function setLpToken(address lpTokenAddress) external onlyRole(ADMIN_ROLE) {
        require(lpTokenAddress != address(0), "LP_ZERO");
        lpToken = lpTokenAddress;
        emit LpTokenSet(lpTokenAddress);
    }

    function addLiquidity(
        uint256 amountAssetDesired,
        uint256 amountBaseDesired,
        uint256 amountAssetMin,
        uint256 amountBaseMin,
        uint256 deadline
    ) external returns (uint256 amountAsset, uint256 amountBase, uint256 liquidity) {
        IERC20(assetToken).transferFrom(msg.sender, address(this), amountAssetDesired);
        IERC20(baseToken).transferFrom(msg.sender, address(this), amountBaseDesired);

        IERC20(assetToken).approve(address(router), amountAssetDesired);
        IERC20(baseToken).approve(address(router), amountBaseDesired);

        (amountAsset, amountBase, liquidity) = router.addLiquidity(
            assetToken,
            baseToken,
            amountAssetDesired,
            amountBaseDesired,
            amountAssetMin,
            amountBaseMin,
            msg.sender,
            deadline
        );

        emit LiquidityAdded(msg.sender, amountAsset, amountBase, liquidity);
    }

    function removeLiquidity(
        uint256 liquidity,
        uint256 amountAssetMin,
        uint256 amountBaseMin,
        uint256 deadline
    ) external returns (uint256 amountAsset, uint256 amountBase) {
        require(lpToken != address(0), "LP_NOT_SET");
        IERC20(lpToken).transferFrom(msg.sender, address(this), liquidity);
        IERC20(lpToken).approve(address(router), liquidity);

        (amountAsset, amountBase) = router.removeLiquidity(
            assetToken,
            baseToken,
            liquidity,
            amountAssetMin,
            amountBaseMin,
            msg.sender,
            deadline
        );

        emit LiquidityRemoved(msg.sender, amountAsset, amountBase);
    }

    function swapAssetForBase(uint256 amountIn, uint256 amountOutMin, uint256 deadline) external returns (uint256 amountOut) {
        IERC20(assetToken).transferFrom(msg.sender, address(this), amountIn);
        IERC20(assetToken).approve(address(router), amountIn);

        address[] memory path = new address[](2);
        path[0] = assetToken;
        path[1] = baseToken;

        uint256[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            msg.sender,
            deadline
        );

        amountOut = amounts[1];
        emit Swap(msg.sender, assetToken, amountIn, amountOut);
    }

    function swapBaseForAsset(uint256 amountIn, uint256 amountOutMin, uint256 deadline) external returns (uint256 amountOut) {
        IERC20(baseToken).transferFrom(msg.sender, address(this), amountIn);
        IERC20(baseToken).approve(address(router), amountIn);

        address[] memory path = new address[](2);
        path[0] = baseToken;
        path[1] = assetToken;

        uint256[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            msg.sender,
            deadline
        );

        amountOut = amounts[1];
        emit Swap(msg.sender, baseToken, amountIn, amountOut);
    }
}
