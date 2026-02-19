// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IKYC.sol";

/**
 * @title TradingPool
 * @notice Pool de trading avec vérification KYC obligatoire
 * @dev Wrapper autour d'Uniswap V2 qui enforce la whitelist KYC
 * 
 * Seuls les utilisateurs whitelisted (KYC verified) peuvent:
 * - Swap des tokens
 * - Ajouter de la liquidité
 * - Retirer de la liquidité
 * 
 * Conformité: Trading allowed only between whitelisted users
 */
contract TradingPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============================================
    // STATE VARIABLES
    // ============================================

    IKYC public kycContract;
    address public uniswapV2Router;
    address public uniswapV2Factory;
    
    bool public kycRequired = true;
    
    // ============================================
    // EVENTS
    // ============================================

    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    event LiquidityAdded(
        address indexed user,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );

    event LiquidityRemoved(
        address indexed user,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB
    );

    event KYCContractUpdated(address indexed oldKYC, address indexed newKYC);
    event KYCRequirementUpdated(bool required);

    // ============================================
    // ERRORS
    // ============================================

    error NotWhitelisted(address user);
    error InvalidAmount();
    error InvalidAddress();
    error SlippageExceeded();
    error DeadlineExpired();

    // ============================================
    // MODIFIERS
    // ============================================

    /**
     * @notice Vérifie que l'utilisateur est whitelisted
     * @dev Bloque si l'utilisateur n'est pas KYC verified ou est blacklisted
     */
    modifier onlyWhitelisted() {
        if (kycRequired) {
            if (!kycContract.isVerified(msg.sender)) {
                revert NotWhitelisted(msg.sender);
            }
        }
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor(
        address _kycContract,
        address _uniswapV2Router,
        address _uniswapV2Factory,
        address _initialOwner
    ) Ownable(_initialOwner) {
        if (_kycContract == address(0)) revert InvalidAddress();
        if (_uniswapV2Router == address(0)) revert InvalidAddress();
        if (_uniswapV2Factory == address(0)) revert InvalidAddress();
        
        kycContract = IKYC(_kycContract);
        uniswapV2Router = _uniswapV2Router;
        uniswapV2Factory = _uniswapV2Factory;
    }

    // ============================================
    // SWAP FUNCTIONS
    // ============================================

    /**
     * @notice Swap exact tokens for tokens avec vérification KYC
     * @param tokenIn Token à vendre
     * @param tokenOut Token à acheter
     * @param amountIn Montant exact de tokenIn
     * @param amountOutMin Montant minimum de tokenOut accepté (slippage protection)
     * @param deadline Timestamp de deadline
     * @return amountOut Montant réel de tokenOut reçu
     */
    function swapExactTokensForTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline
    ) external onlyWhitelisted nonReentrant returns (uint256 amountOut) {
        if (amountIn == 0) revert InvalidAmount();
        if (block.timestamp > deadline) revert DeadlineExpired();
        
        // Transfer tokens from user to this contract
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Approve Uniswap Router
        IERC20(tokenIn).approve(uniswapV2Router, amountIn);
        
        // Prepare path
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        // Execute swap on Uniswap
        uint256 balanceBefore = IERC20(tokenOut).balanceOf(address(this));
        
        (bool success, bytes memory data) = uniswapV2Router.call(
            abi.encodeWithSignature(
                "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
                amountIn,
                amountOutMin,
                path,
                address(this),
                deadline
            )
        );
        
        require(success, "SWAP_FAILED");
        
        uint256 balanceAfter = IERC20(tokenOut).balanceOf(address(this));
        amountOut = balanceAfter - balanceBefore;
        
        if (amountOut < amountOutMin) revert SlippageExceeded();
        
        // Transfer tokens to user
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);
        
        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    /**
     * @notice Get amounts out pour un swap (lecture seule)
     * @param amountIn Montant d'entrée
     * @param path Chemin des tokens
     * @return amounts Montants prévus
     */
    function getAmountsOut(
        uint256 amountIn,
        address[] memory path
    ) external view returns (uint256[] memory amounts) {
        (bool success, bytes memory data) = uniswapV2Router.staticcall(
            abi.encodeWithSignature(
                "getAmountsOut(uint256,address[])",
                amountIn,
                path
            )
        );
        
        require(success, "GETAMOUNTSOUT_FAILED");
        amounts = abi.decode(data, (uint256[]));
    }

    // ============================================
    // LIQUIDITY FUNCTIONS
    // ============================================

    /**
     * @notice Ajouter de la liquidité avec vérification KYC
     * @param tokenA Premier token
     * @param tokenB Deuxième token
     * @param amountADesired Montant désiré de tokenA
     * @param amountBDesired Montant désiré de tokenB
     * @param amountAMin Montant minimum de tokenA (slippage)
     * @param amountBMin Montant minimum de tokenB (slippage)
     * @param deadline Timestamp de deadline
     * @return amountA Montant réel de tokenA ajouté
     * @return amountB Montant réel de tokenB ajouté
     * @return liquidity LP tokens reçus
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        uint256 deadline
    ) external onlyWhitelisted nonReentrant returns (
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    ) {
        if (amountADesired == 0 || amountBDesired == 0) revert InvalidAmount();
        if (block.timestamp > deadline) revert DeadlineExpired();
        
        // Transfer tokens from user to this contract
        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountADesired);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountBDesired);
        
        // Approve Uniswap Router
        IERC20(tokenA).approve(uniswapV2Router, amountADesired);
        IERC20(tokenB).approve(uniswapV2Router, amountBDesired);
        
        // Add liquidity on Uniswap
        (bool success, bytes memory data) = uniswapV2Router.call(
            abi.encodeWithSignature(
                "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)",
                tokenA,
                tokenB,
                amountADesired,
                amountBDesired,
                amountAMin,
                amountBMin,
                msg.sender, // LP tokens go directly to user
                deadline
            )
        );
        
        require(success, "ADD_LIQUIDITY_FAILED");
        (amountA, amountB, liquidity) = abi.decode(data, (uint256, uint256, uint256));
        
        // Refund dust
        if (amountADesired > amountA) {
            IERC20(tokenA).safeTransfer(msg.sender, amountADesired - amountA);
        }
        if (amountBDesired > amountB) {
            IERC20(tokenB).safeTransfer(msg.sender, amountBDesired - amountB);
        }
        
        emit LiquidityAdded(msg.sender, tokenA, tokenB, amountA, amountB, liquidity);
    }

    /**
     * @notice Retirer de la liquidité avec vérification KYC
     * @param tokenA Premier token
     * @param tokenB Deuxième token
     * @param liquidity Montant de LP tokens à brûler
     * @param amountAMin Montant minimum de tokenA à recevoir
     * @param amountBMin Montant minimum de tokenB à recevoir
     * @param deadline Timestamp de deadline
     * @return amountA Montant de tokenA reçu
     * @return amountB Montant de tokenB reçu
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        uint256 deadline
    ) external onlyWhitelisted nonReentrant returns (uint256 amountA, uint256 amountB) {
        if (liquidity == 0) revert InvalidAmount();
        if (block.timestamp > deadline) revert DeadlineExpired();
        
        // Get pair address
        (bool successPair, bytes memory dataPair) = uniswapV2Factory.staticcall(
            abi.encodeWithSignature("getPair(address,address)", tokenA, tokenB)
        );
        require(successPair, "GET_PAIR_FAILED");
        address pair = abi.decode(dataPair, (address));
        
        // Transfer LP tokens from user to this contract
        IERC20(pair).safeTransferFrom(msg.sender, address(this), liquidity);
        
        // Approve Uniswap Router
        IERC20(pair).approve(uniswapV2Router, liquidity);
        
        // Remove liquidity on Uniswap
        (bool success, bytes memory data) = uniswapV2Router.call(
            abi.encodeWithSignature(
                "removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)",
                tokenA,
                tokenB,
                liquidity,
                amountAMin,
                amountBMin,
                msg.sender, // Tokens go directly to user
                deadline
            )
        );
        
        require(success, "REMOVE_LIQUIDITY_FAILED");
        (amountA, amountB) = abi.decode(data, (uint256, uint256));
        
        emit LiquidityRemoved(msg.sender, tokenA, tokenB, amountA, amountB);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Vérifie si un utilisateur peut trader
     * @param user Adresse à vérifier
     * @return canTrade True si l'utilisateur est whitelisted
     */
    function canTrade(address user) external view returns (bool) {
        if (!kycRequired) return true;
        return kycContract.isVerified(user);
    }

    /**
     * @notice Get pair address
     * @param tokenA Premier token
     * @param tokenB Deuxième token
     * @return pair Adresse de la paire
     */
    function getPair(address tokenA, address tokenB) external view returns (address pair) {
        (bool success, bytes memory data) = uniswapV2Factory.staticcall(
            abi.encodeWithSignature("getPair(address,address)", tokenA, tokenB)
        );
        require(success, "GET_PAIR_FAILED");
        pair = abi.decode(data, (address));
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Met à jour le contrat KYC
     * @param _kycContract Nouvelle adresse du contrat KYC
     */
    function setKYCContract(address _kycContract) external onlyOwner {
        if (_kycContract == address(0)) revert InvalidAddress();
        address oldKYC = address(kycContract);
        kycContract = IKYC(_kycContract);
        emit KYCContractUpdated(oldKYC, _kycContract);
    }

    /**
     * @notice Active/désactive l'exigence KYC
     * @param _required True pour activer, false pour désactiver
     */
    function setKYCRequired(bool _required) external onlyOwner {
        kycRequired = _required;
        emit KYCRequirementUpdated(_required);
    }

    /**
     * @notice Met à jour l'adresse du router Uniswap
     * @param _router Nouvelle adresse du router
     */
    function setUniswapRouter(address _router) external onlyOwner {
        if (_router == address(0)) revert InvalidAddress();
        uniswapV2Router = _router;
    }

    /**
     * @notice Met à jour l'adresse de la factory Uniswap
     * @param _factory Nouvelle adresse de la factory
     */
    function setUniswapFactory(address _factory) external onlyOwner {
        if (_factory == address(0)) revert InvalidAddress();
        uniswapV2Factory = _factory;
    }

    /**
     * @notice Récupère les tokens bloqués dans le contrat (emergency)
     * @param token Adresse du token à récupérer
     * @param amount Montant à récupérer
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
