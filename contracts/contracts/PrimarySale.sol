// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IKYC} from "./interfaces/IKYC.sol";

/**
 * @title PrimarySale
 * @notice Permet aux créateurs d'assets de vendre leurs tokens avec confirmation du vendeur
 * @dev Marché primaire avec système d'ordres et approbation vendeur
 */
contract PrimarySale is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Listing {
        address seller;           // Propriétaire vendant les tokens
        address assetToken;       // Adresse du token ERC20 de l'asset
        address paymentToken;     // Adresse du token de paiement (USDC, USDT, WETH)
        uint256 pricePerToken;    // Prix par token en wei du paymentToken
        uint256 availableAmount;  // Quantité disponible à la vente
        bool active;              // Si la vente est active
    }

    struct BuyOrder {
        uint256 orderId;          // ID unique de l'ordre
        address buyer;            // Acheteur
        address seller;           // Vendeur ciblé
        address assetToken;       // Token à acheter
        address paymentToken;     // Token de paiement
        uint256 amount;           // Quantité demandée
        uint256 pricePerToken;    // Prix par token proposé
        uint256 totalPrice;       // Prix total
        bool pending;             // En attente d'approbation
        uint256 timestamp;        // Date de création
    }

    IKYC public kyc;
    bool public kycRequired = true;

    // assetTokenAddress => Listing
    mapping(address => Listing) public listings;

    // Ordres d'achat
    uint256 public orderCount;
    mapping(uint256 => BuyOrder) public buyOrders;
    mapping(address => uint256[]) public sellerOrders; // seller => orderIds

    event ListingCreated(
        address indexed seller,
        address indexed assetToken,
        address paymentToken,
        uint256 pricePerToken,
        uint256 amount
    );

    event ListingUpdated(
        address indexed assetToken,
        uint256 newPricePerToken,
        uint256 newAmount
    );

    event ListingCancelled(address indexed assetToken);

    event BuyOrderCreated(
        uint256 indexed orderId,
        address indexed buyer,
        address indexed assetToken,
        uint256 amount,
        uint256 totalPrice
    );

    event BuyOrderAccepted(
        uint256 indexed orderId,
        address indexed seller,
        address indexed buyer,
        uint256 amount,
        uint256 totalPrice
    );

    event BuyOrderRejected(
        uint256 indexed orderId,
        address indexed seller
    );

    event Purchase(
        address indexed buyer,
        address indexed seller,
        address indexed assetToken,
        uint256 amount,
        uint256 totalPrice
    );

    modifier onlyVerified() {
        if (kycRequired) {
            require(kyc.isVerified(msg.sender), "KYC_REQUIRED");
        }
        _;
    }

    constructor(address kycAddress, address admin) {
        require(kycAddress != address(0), "KYC_ZERO");
        require(admin != address(0), "ADMIN_ZERO");

        kyc = IKYC(kycAddress);
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    /**
     * @notice Créer une nouvelle vente pour un asset
     * @param assetToken Adresse du token ERC20 de l'asset
     * @param paymentToken Adresse du token de paiement (USDC, USDT, WETH)
     * @param pricePerToken Prix par token (en wei du paymentToken)
     * @param amount Quantité à vendre
     */
    function createListing(
        address assetToken,
        address paymentToken,
        uint256 pricePerToken,
        uint256 amount
    ) external onlyVerified {
        require(assetToken != address(0), "ASSET_ZERO");
        require(paymentToken != address(0), "PAYMENT_ZERO");
        require(pricePerToken > 0, "PRICE_ZERO");
        require(amount > 0, "AMOUNT_ZERO");
        require(!listings[assetToken].active, "ALREADY_LISTED");

        // Vérifier que le vendeur possède les tokens
        uint256 balance = IERC20(assetToken).balanceOf(msg.sender);
        require(balance >= amount, "INSUFFICIENT_BALANCE");

        // Vérifier l'allowance
        uint256 allowance = IERC20(assetToken).allowance(msg.sender, address(this));
        require(allowance >= amount, "INSUFFICIENT_ALLOWANCE");

        listings[assetToken] = Listing({
            seller: msg.sender,
            assetToken: assetToken,
            paymentToken: paymentToken,
            pricePerToken: pricePerToken,
            availableAmount: amount,
            active: true
        });

        emit ListingCreated(msg.sender, assetToken, paymentToken, pricePerToken, amount);
    }

    /**
     * @notice Mettre à jour une vente existante
     * @param assetToken Adresse du token ERC20 de l'asset
     * @param newPricePerToken Nouveau prix par token
     * @param newAmount Nouvelle quantité disponible
     */
    function updateListing(
        address assetToken,
        uint256 newPricePerToken,
        uint256 newAmount
    ) external {
        Listing storage listing = listings[assetToken];
        require(listing.active, "NOT_LISTED");
        require(listing.seller == msg.sender, "NOT_SELLER");
        require(newPricePerToken > 0, "PRICE_ZERO");
        require(newAmount > 0, "AMOUNT_ZERO");

        // Vérifier le solde
        uint256 balance = IERC20(assetToken).balanceOf(msg.sender);
        require(balance >= newAmount, "INSUFFICIENT_BALANCE");

        listing.pricePerToken = newPricePerToken;
        listing.availableAmount = newAmount;

        emit ListingUpdated(assetToken, newPricePerToken, newAmount);
    }

    /**
     * @notice Annuler une vente
     * @param assetToken Adresse du token ERC20 de l'asset
     */
    function cancelListing(address assetToken) external {
        Listing storage listing = listings[assetToken];
        require(listing.active, "NOT_LISTED");
        require(listing.seller == msg.sender, "NOT_SELLER");

        listing.active = false;
        listing.availableAmount = 0;

        emit ListingCancelled(assetToken);
    }

    /**
     * @notice Créer une demande d'achat (acheteur propose un achat)
     * @param assetToken Adresse du token ERC20 de l'asset
     * @param seller Adresse du vendeur ciblé
     * @param paymentToken Token utilisé pour le paiement
     * @param pricePerToken Prix proposé par token
     * @param amount Quantité à acheter
     */
    function createBuyOrder(
        address assetToken,
        address seller,
        address paymentToken,
        uint256 pricePerToken,
        uint256 amount
    ) external onlyVerified {
        require(seller != address(0), "SELLER_ZERO");
        require(assetToken != address(0), "ASSET_ZERO");
        require(paymentToken != address(0), "PAYMENT_ZERO");
        require(amount > 0, "AMOUNT_ZERO");
        require(pricePerToken > 0, "PRICE_ZERO");

        // Vérifier que le vendeur a suffisamment de tokens
        uint256 sellerBalance = IERC20(assetToken).balanceOf(seller);
        require(sellerBalance >= amount, "INSUFFICIENT_SELLER_BALANCE");

        uint256 totalPrice = amount * pricePerToken;

        // Vérifier le solde de l'acheteur
        uint256 buyerBalance = IERC20(paymentToken).balanceOf(msg.sender);
        require(buyerBalance >= totalPrice, "INSUFFICIENT_BUYER_BALANCE");

        // Vérifier l'allowance de l'acheteur
        uint256 buyerAllowance = IERC20(paymentToken).allowance(msg.sender, address(this));
        require(buyerAllowance >= totalPrice, "INSUFFICIENT_BUYER_ALLOWANCE");

        // Transférer les fonds de l'acheteur vers le contrat (escrow)
        require(
            IERC20(paymentToken).transferFrom(msg.sender, address(this), totalPrice),
            "PAYMENT_TRANSFER_FAILED"
        );

        // Créer l'ordre d'achat
        orderCount++;
        buyOrders[orderCount] = BuyOrder({
            orderId: orderCount,
            buyer: msg.sender,
            seller: seller,
            assetToken: assetToken,
            paymentToken: paymentToken,
            amount: amount,
            pricePerToken: pricePerToken,
            totalPrice: totalPrice,
            pending: true,
            timestamp: block.timestamp
        });

        // Ajouter à la liste des ordres du vendeur
        sellerOrders[seller].push(orderCount);

        emit BuyOrderCreated(orderCount, msg.sender, assetToken, amount, totalPrice);
    }

    /**
     * @notice Accepter une demande d'achat (vendeur approuve)
     * @param orderId ID de la demande d'achat
     */
    function acceptBuyOrder(uint256 orderId) external {
        BuyOrder storage order = buyOrders[orderId];
        require(order.pending, "ORDER_NOT_PENDING");
        require(order.seller == msg.sender, "NOT_SELLER");

        // Vérifier le solde et allowance du vendeur
        uint256 sellerBalance = IERC20(order.assetToken).balanceOf(msg.sender);
        require(sellerBalance >= order.amount, "INSUFFICIENT_SELLER_BALANCE");

        uint256 sellerAllowance = IERC20(order.assetToken).allowance(msg.sender, address(this));
        require(sellerAllowance >= order.amount, "INSUFFICIENT_SELLER_ALLOWANCE");

        // Marquer comme non-pending
        order.pending = false;

        // Transférer les tokens de l'asset du vendeur à l'acheteur
        require(
            IERC20(order.assetToken).transferFrom(msg.sender, order.buyer, order.amount),
            "ASSET_TRANSFER_FAILED"
        );

        // Transférer le paiement du contrat au vendeur
        require(
            IERC20(order.paymentToken).transfer(msg.sender, order.totalPrice),
            "PAYMENT_TO_SELLER_FAILED"
        );

        // Si un listing existe, mettre à jour la quantité disponible
        Listing storage listing = listings[order.assetToken];
        if (listing.active && listing.seller == msg.sender) {
            if (order.amount <= listing.availableAmount) {
                listing.availableAmount -= order.amount;
                if (listing.availableAmount == 0) {
                    listing.active = false;
                }
            }
        }

        emit BuyOrderAccepted(orderId, msg.sender, order.buyer, order.amount, order.totalPrice);
        emit Purchase(order.buyer, msg.sender, order.assetToken, order.amount, order.totalPrice);
    }

    /**
     * @notice Rejeter une demande d'achat (vendeur refuse)
     * @param orderId ID de la demande d'achat
     */
    function rejectBuyOrder(uint256 orderId) external {
        BuyOrder storage order = buyOrders[orderId];
        require(order.pending, "ORDER_NOT_PENDING");
        require(order.seller == msg.sender, "NOT_SELLER");

        // Marquer comme non-pending
        order.pending = false;

        // Rembourser l'acheteur
        require(
            IERC20(order.paymentToken).transfer(order.buyer, order.totalPrice),
            "REFUND_FAILED"
        );

        emit BuyOrderRejected(orderId, msg.sender);
    }

    /**
     * @notice Annuler une demande d'achat (acheteur annule avant approbation)
     * @param orderId ID de la demande d'achat
     */
    function cancelBuyOrder(uint256 orderId) external {
        BuyOrder storage order = buyOrders[orderId];
        require(order.pending, "ORDER_NOT_PENDING");
        require(order.buyer == msg.sender, "NOT_BUYER");

        // Marquer comme non-pending
        order.pending = false;

        // Rembourser l'acheteur
        require(
            IERC20(order.paymentToken).transfer(order.buyer, order.totalPrice),
            "REFUND_FAILED"
        );

        emit BuyOrderRejected(orderId, msg.sender);
    }

    /**
     * @notice Obtenir les détails d'une vente
     * @param assetToken Adresse du token ERC20 de l'asset
     */
    function getListing(address assetToken) external view returns (Listing memory) {
        return listings[assetToken];
    }

    /**
     * @notice Obtenir les détails d'un ordre d'achat
     * @param orderId ID de l'ordre
     */
    function getBuyOrder(uint256 orderId) external view returns (BuyOrder memory) {
        return buyOrders[orderId];
    }

    /**
     * @notice Obtenir tous les ordres en attente d'un vendeur
     * @param seller Adresse du vendeur
     */
    function getPendingOrders(address seller) external view returns (uint256[] memory) {
        uint256[] memory allOrders = sellerOrders[seller];
        uint256 pendingCount = 0;

        // Compter les ordres en attente
        for (uint256 i = 0; i < allOrders.length; i++) {
            if (buyOrders[allOrders[i]].pending) {
                pendingCount++;
            }
        }

        // Créer le tableau des ordres en attente
        uint256[] memory pendingOrders = new uint256[](pendingCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allOrders.length; i++) {
            if (buyOrders[allOrders[i]].pending) {
                pendingOrders[index] = allOrders[i];
                index++;
            }
        }

        return pendingOrders;
    }

    /**
     * @notice Obtenir tous les IDs d'ordres d'un vendeur
     * @param seller Adresse du vendeur
     */
    function getSellerOrders(address seller) external view returns (uint256[] memory) {
        return sellerOrders[seller];
    }

    /**
     * @notice Définir l'adresse du contrat KYC
     * @param kycAddress Nouvelle adresse KYC
     */
    function setKyc(address kycAddress) external onlyRole(ADMIN_ROLE) {
        require(kycAddress != address(0), "KYC_ZERO");
        kyc = IKYC(kycAddress);
    }

    /**
     * @notice Définir si le KYC est requis
     * @param required Si le KYC est requis
     */
    function setKycRequired(bool required) external onlyRole(ADMIN_ROLE) {
        kycRequired = required;
    }
}
