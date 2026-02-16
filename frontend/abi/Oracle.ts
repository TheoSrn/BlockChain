/**
 * ABI Oracle Contract
 * On-chain price oracle for real-world assets and NFT collections
 */

export const ORACLE_ABI = [
  {
    inputs: [{ name: 'assetId', type: 'uint256' }],
    name: 'getPrice',
    outputs: [
      { name: 'price', type: 'uint256' },
      { name: 'updatedAt', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'assetId', type: 'uint256' }],
    name: 'getAsset',
    outputs: [
      { name: 'nft', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'exists', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'assetId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
    ],
    name: 'setPrice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { indexed: true, name: 'assetId', type: 'uint256' },
      { indexed: false, name: 'price', type: 'uint256' },
      { indexed: false, name: 'updatedAt', type: 'uint256' },
    ],
    name: 'PriceUpdated',
    type: 'event',
  },
  {
    inputs: [
      { indexed: true, name: 'assetId', type: 'uint256' },
      { indexed: true, name: 'nft', type: 'address' },
      { indexed: true, name: 'token', type: 'address' },
    ],
    name: 'AssetRegistered',
    type: 'event',
  },
] as const;

export default ORACLE_ABI;
