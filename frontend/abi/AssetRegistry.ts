/**
 * ABI Exemple : Asset Registry Contract
 * Remplacez ce fichier par votre ABI réel
 */

export const ASSET_REGISTRY_ABI = [
  {
    inputs: [],
    name: 'getAllAssets',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'assetAddress', type: 'address' }],
    name: 'getAssetInfo',
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'totalSupply', type: 'uint256' },
      { name: 'valueUSD', type: 'uint256' },
      { name: 'assetType', type: 'uint8' },
      { name: 'isActive', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'assetType', type: 'uint8' },
    ],
    name: 'createAsset',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'assetAddress', type: 'address' }],
    name: 'isAssetRegistered',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'assetAddress', type: 'address', indexed: true },
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
    ],
    name: 'AssetCreated',
    type: 'event',
  },
] as const;

export default ASSET_REGISTRY_ABI;
