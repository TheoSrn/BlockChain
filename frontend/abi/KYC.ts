// KYC ABI - Contrat KYC complet avec système de demandes
export const kycABI = [
  {
    inputs: [{ internalType: "address", name: "admin", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "bool", name: "status", type: "bool" },
    ],
    name: "BlacklistUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "bool", name: "status", type: "bool" },
    ],
    name: "WhitelistUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "string", name: "fullName", type: "string" },
      { indexed: false, internalType: "string", name: "country", type: "string" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "KYCSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "admin", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "KYCApproved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "admin", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "KYCRejected",
    type: "event",
  },
  {
    inputs: [
      { internalType: "string", name: "fullName", type: "string" },
      { internalType: "string", name: "country", type: "string" },
      { internalType: "string", name: "documentType", type: "string" },
      { internalType: "string", name: "documentNumber", type: "string" },
    ],
    name: "submitKYC",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "approveKYC",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "rejectKYC",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getPendingRequests",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getKYCRequest",
    outputs: [
      {
        components: [
          { internalType: "address", name: "user", type: "address" },
          { internalType: "string", name: "fullName", type: "string" },
          { internalType: "string", name: "country", type: "string" },
          { internalType: "string", name: "documentType", type: "string" },
          { internalType: "string", name: "documentNumber", type: "string" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "uint8", name: "status", type: "uint8" },
        ],
        internalType: "struct KYC.KYCRequest",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "isBlacklisted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "isVerified",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "isWhitelisted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "users", type: "address[]" },
      { internalType: "bool", name: "status", type: "bool" },
    ],
    name: "setBatchBlacklisted",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "users", type: "address[]" },
      { internalType: "bool", name: "status", type: "bool" },
    ],
    name: "setBatchWhitelisted",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "bool", name: "status", type: "bool" },
    ],
    name: "setBlacklisted",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "bool", name: "status", type: "bool" },
    ],
    name: "setWhitelisted",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
