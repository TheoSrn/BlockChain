export const ASSET_NFT_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "assetId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMetadata",
    "outputs": [
      {
        "components": [
          {"internalType": "string", "name": "location", "type": "string"},
          {"internalType": "uint256", "name": "surface", "type": "uint256"},
          {"internalType": "uint256", "name": "estimatedValue", "type": "uint256"},
          {"internalType": "string", "name": "description", "type": "string"},
          {"internalType": "string", "name": "documents", "type": "string"}
        ],
        "internalType": "struct AssetNFT.AssetMetadata",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export default ASSET_NFT_ABI;
