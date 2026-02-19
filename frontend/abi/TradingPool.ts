// TradingPool ABI - Pool de trading avec vérification KYC
export const tradingPoolABI = [
  // Constructor
  {
    inputs: [
      { internalType: "address", name: "_kycContract", type: "address" },
      { internalType: "address", name: "_uniswapV2Router", type: "address" },
      { internalType: "address", name: "_uniswapV2Factory", type: "address" },
      { internalType: "address", name: "_initialOwner", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "tokenIn", type: "address" },
      { indexed: true, internalType: "address", name: "tokenOut", type: "address" },
      { indexed: false, internalType: "uint256", name: "amountIn", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "amountOut", type: "uint256" },
    ],
    name: "SwapExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "tokenA", type: "address" },
      { indexed: true, internalType: "address", name: "tokenB", type: "address" },
      { indexed: false, internalType: "uint256", name: "amountA", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "amountB", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "liquidity", type: "uint256" },
    ],
    name: "LiquidityAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "tokenA", type: "address" },
      { indexed: true, internalType: "address", name: "tokenB", type: "address" },
      { indexed: false, internalType: "uint256", name: "amountA", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "amountB", type: "uint256" },
    ],
    name: "LiquidityRemoved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "oldKYC", type: "address" },
      { indexed: true, internalType: "address", name: "newKYC", type: "address" },
    ],
    name: "KYCContractUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "bool", name: "required", type: "bool" },
    ],
    name: "KYCRequirementUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },

  // Errors
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "NotWhitelisted",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAmount",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAddress",
    type: "error",
  },
  {
    inputs: [],
    name: "SlippageExceeded",
    type: "error",
  },
  {
    inputs: [],
    name: "DeadlineExpired",
    type: "error",
  },

  // Swap Functions
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "address", name: "tokenOut", type: "address" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForTokens",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
    ],
    name: "getAmountsOut",
    outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },

  // Liquidity Functions
  {
    inputs: [
      { internalType: "address", name: "tokenA", type: "address" },
      { internalType: "address", name: "tokenB", type: "address" },
      { internalType: "uint256", name: "amountADesired", type: "uint256" },
      { internalType: "uint256", name: "amountBDesired", type: "uint256" },
      { internalType: "uint256", name: "amountAMin", type: "uint256" },
      { internalType: "uint256", name: "amountBMin", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "addLiquidity",
    outputs: [
      { internalType: "uint256", name: "amountA", type: "uint256" },
      { internalType: "uint256", name: "amountB", type: "uint256" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "tokenA", type: "address" },
      { internalType: "address", name: "tokenB", type: "address" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
      { internalType: "uint256", name: "amountAMin", type: "uint256" },
      { internalType: "uint256", name: "amountBMin", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "removeLiquidity",
    outputs: [
      { internalType: "uint256", name: "amountA", type: "uint256" },
      { internalType: "uint256", name: "amountB", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },

  // View Functions
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "canTrade",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "tokenA", type: "address" },
      { internalType: "address", name: "tokenB", type: "address" },
    ],
    name: "getPair",
    outputs: [{ internalType: "address", name: "pair", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "kycContract",
    outputs: [{ internalType: "contract IKYC", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "kycRequired",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "uniswapV2Router",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "uniswapV2Factory",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },

  // Admin Functions
  {
    inputs: [{ internalType: "address", name: "_kycContract", type: "address" }],
    name: "setKYCContract",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bool", name: "_required", type: "bool" }],
    name: "setKYCRequired",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_router", type: "address" }],
    name: "setUniswapRouter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_factory", type: "address" }],
    name: "setUniswapFactory",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "rescueTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export default tradingPoolABI;
