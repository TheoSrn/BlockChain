// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IKYC} from "./interfaces/IKYC.sol";

/**
 * @title PrimarySaleNFT
 * @notice Marketplace pour acheter/vendre des NFTs (Exclusive Properties) avec confirmation du vendeur
 * @dev Système d'ordres d'achat avec escrow pour NFTs ERC721
 */
contract PrimarySaleNFT is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Listing {
        address seller;           // Propriétaire vendant le NFT
        address assetToken;       // Adresse du contrat NFT ERC721
        uint256 tokenId;          // ID du NFT
        address paymentToken;     // Adresse du token de paiement (USDC, USDT, WETH)
        uint256 price;            // Prix du NFT en wei du paymentToken
        bool active;              // Si la vente est active
    }

    struct BuyOrder {
        uint256 orderId;          // ID unique de l'ordre
        address buyer;            // Acheteur
        address seller;           // Vendeur ciblé
        address assetToken;       // Contrat NFT
        uint256 tokenId;          // ID du NFT à acheter
        address paymentToken;     // Token de paiement
        uint256 price;            // Prix proposé
        bool pending;             // En attente d'approbation
        uint256 timestamp;        // Date de création
    }

    IKYC public kyc;
    bool public kycRequired = true;

    // assetTokenAddress => tokenId => Listing
    mapping(address => mapping(uint256 => Listing)) public listings;

    // Ordres d'achat
    uint256 public orderCount;
    mapping(uint256 => BuyOrder) public buyOrders;
    mapping(address => uint256[]) public sellerOrders; // seller => orderIds

    event ListingCreated(
        address indexed seller,
        address indexed assetToken,
        uint256 indexed tokenId,
        address paymentToken,
        uint256 price
    );

    event ListingCancelled(
        address indexed seller,
        address indexed assetToken,
        uint256 indexed tokenId
    );

    event BuyOrderCreated(
        uint256 indexed orderId,
        address indexed buyer,
        address indexed assetToken,
        uint256 tokenId,
        uint256 price
    );

    event BuyOrderAccepted(
        uint256 indexed orderId,
        address indexed seller,
        address indexed buyer,
        address assetToken,
        uint256 tokenId,
        uint256 price
    );

    event BuyOrderRejected(
        uint256 indexed orderId,
        address indexed seller,
        address indexed buyer
    );

    event BuyOrderCancelled(
        uint256 indexed orderId,
        address indexed buyer
    );

    modifier onlyVerified() {
        if (kycRequired) {
            require(kyc.isVerified(msg.sender), "KYC_REQUIRED");
        }
        _;
    }

    constructor(address admin, address kycAddress) {
        require(admin != address(0), "ADMIN_ZERO");
        require(kycAddress != address(0), "KYC_ZERO");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);

        kyc = IKYC(kycAddress);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    function setKyc(address kycAddress) external onlyRole(ADMIN_ROLE) {
        require(kycAddress != address(0), "KYC_ZERO");
        kyc = IKYC(kycAddress);
    }

    function setKycRequired(bool required) external onlyRole(ADMIN_ROLE) {
        kycRequired = required;
    }

    // ============================================
    // LISTING FUNCTIONS (Optional)
    // ============================================

    /**
     * @notice Créer une annonce de vente pour un NFT
     * @param assetToken Adresse du contrat NFT
     * @param tokenId ID du NFT
     * @param paymentToken Token pour le paiement
     * @param price Prix du NFT
     */
    function createListing(
        address assetToken,
        uint256 tokenId,
        address paymentToken,
        uint256 price
    ) external onlyVerified {
        require(assetToken != address(0), "ASSET_ZERO");
        require(paymentToken != address(0), "PAYMENT_ZERO");
        require(price > 0, "PRICE_ZERO");

        // Vérifier que le vendeur possède le NFT
        require(IERC721(assetToken).ownerOf(tokenId) == msg.sender, "NOT_OWNER");

        // Créer ou mettre à jour le listing
        listings[assetToken][tokenId] = Listing({
            seller: msg.sender,
            assetToken: assetToken,
            tokenId: tokenId,
            paymentToken: paymentToken,
            price: price,
            active: true
        });

        emit ListingCreated(msg.sender, assetToken, tokenId, paymentToken, price);
    }

    /**
     * @notice Annuler une annonce de vente
     * @param assetToken Adresse du contrat NFT
     * @param tokenId ID du NFT
     */
    function cancelListing(address assetToken, uint256 tokenId) external {
        Listing storage listing = listings[assetToken][tokenId];
        require(listing.seller == msg.sender, "NOT_SELLER");
        require(listing.active, "NOT_ACTIVE");

        listing.active = false;

        emit ListingCancelled(msg.sender, assetToken, tokenId);
    }

    // ============================================
    // BUY ORDER FUNCTIONS
    // ============================================

    /**
     * @notice Créer une demande d'achat pour un NFT (buyer-initiated)
     * @param assetToken Adresse du contrat NFT
     * @param tokenId ID du NFT
     * @param seller Adresse du vendeur ciblé
     * @param paymentToken Token utilisé pour le paiement
     * @param price Prix proposé
     */
    function createBuyOrder(
        address assetToken,
        uint256 tokenId,
        address seller,
        address paymentToken,
        uint256 price
    ) external onlyVerified {
        require(seller != address(0), "SELLER_ZERO");
        require(assetToken != address(0), "ASSET_ZERO");
        require(paymentToken != address(0), "PAYMENT_ZERO");
        require(price > 0, "PRICE_ZERO");

        // Vérifier que le vendeur possède le NFT
        require(IERC721(assetToken).ownerOf(tokenId) == seller, "SELLER_NOT_OWNER");

        // Vérifier le solde de l'acheteur
        uint256 buyerBalance = IERC20(paymentToken).balanceOf(msg.sender);
        require(buyerBalance >= price, "INSUFFICIENT_BUYER_BALANCE");

        // Vérifier l'allowance de l'acheteur
        uint256 buyerAllowance = IERC20(paymentToken).allowance(msg.sender, address(this));
        require(buyerAllowance >= price, "INSUFFICIENT_BUYER_ALLOWANCE");

        // Transférer les fonds de l'acheteur vers le contrat (escrow)
        require(
            IERC20(paymentToken).transferFrom(msg.sender, address(this), price),
            "PAYMENT_TRANSFER_FAILED"
        );

        // Créer l'ordre d'achat
        orderCount++;
        buyOrders[orderCount] = BuyOrder({
            orderId: orderCount,
            buyer: msg.sender,
            seller: seller,
            assetToken: assetToken,
            tokenId: tokenId,
            paymentToken: paymentToken,
            price: price,
            pending: true,
            timestamp: block.timestamp
        });

        // Ajouter à la liste des ordres du vendeur
        sellerOrders[seller].push(orderCount);

        emit BuyOrderCreated(orderCount, msg.sender, assetToken, tokenId, price);
    }

    /**
     * @notice Accepter une demande d'achat (vendeur approuve)
     * @param orderId ID de la demande d'achat
     */
    function acceptBuyOrder(uint256 orderId) external {
        BuyOrder storage order = buyOrders[orderId];
        require(order.pending, "ORDER_NOT_PENDING");
        require(order.seller == msg.sender, "NOT_SELLER");

        // Vérifier que le vendeur possède toujours le NFT
        require(IERC721(order.assetToken).ownerOf(order.tokenId) == msg.sender, "NOT_OWNER");

        // Vérifier l'allowance du vendeur pour le NFT
        address approved = IERC721(order.assetToken).getApproved(order.tokenId);
        bool isApprovedForAll = IERC721(order.assetToken).isApprovedForAll(msg.sender, address(this));
        require(approved == address(this) || isApprovedForAll, "NFT_NOT_APPROVED");

        // Marquer comme non-pending
        order.pending = false;

        // Transférer le NFT du vendeur à l'acheteur
        IERC721(order.assetToken).safeTransferFrom(msg.sender, order.buyer, order.tokenId);

        // Transférer le paiement du contrat au vendeur
        require(
            IERC20(order.paymentToken).transfer(msg.sender, order.price),
            "PAYMENT_TO_SELLER_FAILED"
        );

        // Si un listing existe, le désactiver
        Listing storage listing = listings[order.assetToken][order.tokenId];
        if (listing.active && listing.seller == msg.sender) {
            listing.active = false;
        }

        emit BuyOrderAccepted(orderId, msg.sender, order.buyer, order.assetToken, order.tokenId, order.price);
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
            IERC20(order.paymentToken).transfer(order.buyer, order.price),
            "REFUND_FAILED"
        );

        emit BuyOrderRejected(orderId, msg.sender, order.buyer);
    }

    /**
     * @notice Annuler une demande d'achat (acheteur annule)
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
            IERC20(order.paymentToken).transfer(msg.sender, order.price),
            "REFUND_FAILED"
        );

        emit BuyOrderCancelled(orderId, msg.sender);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    function getListing(address assetToken, uint256 tokenId) external view returns (Listing memory) {
        return listings[assetToken][tokenId];
    }

    function getBuyOrder(uint256 orderId) external view returns (BuyOrder memory) {
        return buyOrders[orderId];
    }

    function getPendingOrders(address seller) external view returns (uint256[] memory) {
        uint256[] memory allOrders = sellerOrders[seller];
        uint256 pendingCount = 0;

        // Compter les ordres en attente
        for (uint256 i = 0; i < allOrders.length; i++) {
            if (buyOrders[allOrders[i]].pending) {
                pendingCount++;
            }
        }

        // Créer le tableau résultat
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

    // Support pour recevoir des NFTs via safeTransferFrom
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
