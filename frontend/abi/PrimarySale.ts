/**
 * ABI Primary Sale Contract - Système de proposition d'achat avec confirmation vendeur
 */

export const PRIMARY_SALE_ABI = [
  // ===== WRITE FUNCTIONS =====
  {
    inputs: [
      { internalType: 'address', name: 'assetToken', type: 'address' },
      { internalType: 'address', name: 'seller', type: 'address' },
      { internalType: 'address', name: 'paymentToken', type: 'address' },
      { internalType: 'uint256', name: 'pricePerToken', type: 'uint256' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'createBuyOrder',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'orderId', type: 'uint256' }
    ],
    name: 'acceptBuyOrder',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'orderId', type: 'uint256' }
    ],
    name: 'rejectBuyOrder',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'orderId', type: 'uint256' }
    ],
    name: 'cancelBuyOrder',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'assetToken', type: 'address' },
      { internalType: 'address', name: 'paymentToken', type: 'address' },
      { internalType: 'uint256', name: 'pricePerToken', type: 'uint256' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'createListing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'assetToken', type: 'address' },
      { internalType: 'uint256', name: 'newPricePerToken', type: 'uint256' },
      { internalType: 'uint256', name: 'newAmount', type: 'uint256' }
    ],
    name: 'updateListing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'assetToken', type: 'address' }
    ],
    name: 'cancelListing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // ===== READ FUNCTIONS =====
  {
    inputs: [
      { internalType: 'address', name: 'assetToken', type: 'address' }
    ],
    name: 'getListing',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'seller', type: 'address' },
          { internalType: 'address', name: 'assetToken', type: 'address' },
          { internalType: 'address', name: 'paymentToken', type: 'address' },
          { internalType: 'uint256', name: 'pricePerToken', type: 'uint256' },
          { internalType: 'uint256', name: 'availableAmount', type: 'uint256' },
          { internalType: 'bool', name: 'active', type: 'bool' }
        ],
        internalType: 'struct PrimarySale.Listing',
        name: '',
        type: 'tuple',
      }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'orderId', type: 'uint256' }
    ],
    name: 'getBuyOrder',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'orderId', type: 'uint256' },
          { internalType: 'address', name: 'buyer', type: 'address' },
          { internalType: 'address', name: 'seller', type: 'address' },
          { internalType: 'address', name: 'assetToken', type: 'address' },
          { internalType: 'address', name: 'paymentToken', type: 'address' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'uint256', name: 'pricePerToken', type: 'uint256' },
          { internalType: 'uint256', name: 'totalPrice', type: 'uint256' },
          { internalType: 'bool', name: 'pending', type: 'bool' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' }
        ],
        internalType: 'struct PrimarySale.BuyOrder',
        name: '',
        type: 'tuple',
      }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'seller', type: 'address' }
    ],
    name: 'getPendingOrders',
    outputs: [
      { internalType: 'uint256[]', name: '', type: 'uint256[]' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'seller', type: 'address' }
    ],
    name: 'getSellerOrders',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'orderCount',
    outputs: [
      { internalType: 'uint256', name: '', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function',
  },

  // ===== EVENTS =====
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'seller', type: 'address' },
      { indexed: true, internalType: 'address', name: 'assetToken', type: 'address' },
      { indexed: false, internalType: 'address', name: 'paymentToken', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'pricePerToken', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'ListingCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'orderId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'buyer', type: 'address' },
      { indexed: true, internalType: 'address', name: 'assetToken', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'totalPrice', type: 'uint256' }
    ],
    name: 'BuyOrderCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'orderId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'seller', type: 'address' },
      { indexed: true, internalType: 'address', name: 'buyer', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'totalPrice', type: 'uint256' }
    ],
    name: 'BuyOrderAccepted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'orderId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'seller', type: 'address' }
    ],
    name: 'BuyOrderRejected',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'buyer', type: 'address' },
      { indexed: true, internalType: 'address', name: 'seller', type: 'address' },
      { indexed: true, internalType: 'address', name: 'assetToken', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'totalPrice', type: 'uint256' }
    ],
    name: 'Purchase',
    type: 'event',
  },
] as const;
