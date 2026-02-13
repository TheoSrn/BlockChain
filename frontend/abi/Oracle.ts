/**
 * ABI Oracle Contract (minimal)
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
] as const;

export default ORACLE_ABI;
