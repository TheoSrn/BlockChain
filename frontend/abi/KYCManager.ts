/**
 * ABI Exemple : KYC Manager Contract
 * Remplacez ce fichier par votre ABI réel généré par Hardhat/Foundry
 */

export const KYC_MANAGER_ABI = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'isKYCVerified',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'isWhitelisted',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'isBlacklisted',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getKYCLevel',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'level', type: 'uint8' },
    ],
    name: 'setKYCLevel',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'addToWhitelist',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'removeFromWhitelist',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'addToBlacklist',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'level', type: 'uint8' },
    ],
    name: 'KYCLevelUpdated',
    type: 'event',
  },
  {
    inputs: [{ name: 'user', type: 'address', indexed: true }],
    name: 'AddedToWhitelist',
    type: 'event',
  },
  {
    inputs: [{ name: 'user', type: 'address', indexed: true }],
    name: 'AddedToBlacklist',
    type: 'event',
  },
] as const;

export default KYC_MANAGER_ABI;
