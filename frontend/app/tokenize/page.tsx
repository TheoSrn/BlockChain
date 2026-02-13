'use client';

/**
 * Page Tokenize - Mint de tokens ERC20 et NFTs ERC721
 * Avec onglets Fungible Assets et NFT Assets
 */

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useKYCStatus } from '@/hooks/web3/useKYCStatus';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { parseUnits, formatUnits } from 'viem';

// ERC20 ABI minimal
const ERC20_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ERC721 ABI minimal
const ERC721_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenURI', type: 'string' },
    ],
    name: 'mint',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

type Tab = 'erc20' | 'erc721';

export default function TokenizePage() {
  const { address, isConnected } = useAccount();
  const { kycStatus } = useKYCStatus();
  const [activeTab, setActiveTab] = useState<Tab>('erc20');

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-12 text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-800">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to tokenize assets</p>
        </div>
      </div>
    );
  }

  // 🚀 MODE TEST : Force canTokenize à true pour tester l'interface
  const canTokenize = true; // kycStatus?.canTrade ?? false;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Tokenize Assets</h1>
        <p className="text-gray-600">Mint fungible tokens (ERC20) or NFTs (ERC721)</p>
      </div>

      {/* KYC Warning */}
      {!canTokenize && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-bold text-red-800 mb-2">KYC Verification Required</h3>
              <p className="text-red-700 text-sm mb-3">
                You need to complete KYC verification before minting tokens.
              </p>
              <a
                href="/kyc"
                className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
              >
                Complete KYC
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('erc20')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'erc20'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Fungible Assets (ERC20)
          </button>
          <button
            onClick={() => setActiveTab('erc721')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'erc721'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            NFT Assets (ERC721)
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'erc20' ? (
        <ERC20Tab canTokenize={canTokenize} userAddress={address!} />
      ) : (
        <ERC721Tab canTokenize={canTokenize} userAddress={address!} />
      )}
    </div>
  );
}

// ===== ERC20 Tab =====
function ERC20Tab({ canTokenize, userAddress }: { canTokenize: boolean; userAddress: string }) {
  const [mintAmount, setMintAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(CONTRACT_ADDRESSES.USDC);

  // Lire la supply totale
  const { data: totalSupply, isLoading: isLoadingSupply } = useReadContract({
    address: selectedToken as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!selectedToken && selectedToken !== '0x0000000000000000000000000000000000000000',
    },
  });

  const { data: decimals } = useReadContract({
    address: selectedToken as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!selectedToken && selectedToken !== '0x0000000000000000000000000000000000000000',
    },
  });

  // WriteContract pour mint
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  // Attendre la transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleMint = () => {
    if (!canTokenize) {
      alert('Please complete KYC verification first');
      return;
    }

    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const amount = parseUnits(mintAmount, decimals as number || 18);

      writeContract({
        address: selectedToken as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'mint',
        args: [userAddress as `0x${string}`, amount],
      });
    } catch (err) {
      console.error('Error minting ERC20:', err);
      alert(`Error: ${(err as Error).message}`);
    }
  };

  const formattedSupply = totalSupply
    ? formatUnits(totalSupply as bigint, decimals as number || 18)
    : '0';

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Mint Section */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Mint Fungible Tokens</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Token Contract</label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            >
              <option value={CONTRACT_ADDRESSES.USDC}>USDC (Testnet)</option>
              <option value={CONTRACT_ADDRESSES.USDT}>USDT (Testnet)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Address: {selectedToken.slice(0, 10)}...{selectedToken.slice(-8)}
            </p>
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Amount to Mint</label>
            <input
              type="number"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              placeholder="100.0"
              className="w-full border rounded-lg px-4 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">Recipient: {userAddress.slice(0, 10)}...</p>
          </div>

          <button
            onClick={handleMint}
            disabled={!canTokenize || isPending || isConfirming}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              canTokenize && !isPending && !isConfirming
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isPending ? 'Waiting for approval...' : isConfirming ? 'Confirming...' : 'Mint Tokens'}
          </button>

          {/* Transaction Status */}
          {hash && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-semibold">✅ Tokens minted successfully!</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">❌ {error.message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Supply Info */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Total Supply</h2>

        {isLoadingSupply ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-600 text-sm mb-2">Current Supply</p>
              <p className="text-4xl font-bold">{parseFloat(formattedSupply).toLocaleString()}</p>
              <p className="text-gray-500 text-sm mt-2">tokens in circulation</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Decimals:</span>
                <span className="font-semibold">{decimals?.toString() || '18'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contract:</span>
                <span className="font-mono text-sm">{selectedToken.slice(0, 8)}...</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Minting requires appropriate permissions on the contract.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== ERC721 Tab =====
function ERC721Tab({ canTokenize, userAddress }: { canTokenize: boolean; userAddress: string }) {
  const [tokenURI, setTokenURI] = useState('');
  const [nftName, setNftName] = useState('');
  const contractAddress = CONTRACT_ADDRESSES.ASSET_REGISTRY;

  // Lire le total supply de NFTs
  const { data: totalSupply, isLoading: isLoadingSupply } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  // WriteContract pour mint NFT
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleMintNFT = () => {
    if (!canTokenize) {
      alert('Please complete KYC verification first');
      return;
    }

    if (!tokenURI) {
      alert('Please enter a token URI');
      return;
    }

    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'mint',
        args: [userAddress as `0x${string}`, tokenURI],
      });
    } catch (err) {
      console.error('Error minting NFT:', err);
      alert(`Error: ${(err as Error).message}`);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Mint NFT Section */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Mint NFT</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2 font-semibold">NFT Name</label>
            <input
              type="text"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
              placeholder="My Tokenized Asset"
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Token URI (Metadata)</label>
            <input
              type="text"
              value={tokenURI}
              onChange={(e) => setTokenURI(e.target.value)}
              placeholder="ipfs://Qm... or https://..."
              className="w-full border rounded-lg px-4 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              IPFS or HTTP URL pointing to NFT metadata JSON
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Recipient:</strong>
            </p>
            <p className="text-xs font-mono text-gray-600">{userAddress}</p>
          </div>

          <button
            onClick={handleMintNFT}
            disabled={!canTokenize || isPending || isConfirming}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              canTokenize && !isPending && !isConfirming
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isPending ? 'Waiting for approval...' : isConfirming ? 'Minting...' : 'Mint NFT'}
          </button>

          {/* Transaction Status */}
          {hash && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-semibold">✅ NFT minted successfully!</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">❌ {error.message}</p>
            </div>
          )}
        </div>
      </div>

      {/* NFT Info */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Collection Info</h2>

        {isLoadingSupply ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-600 text-sm mb-2">Total NFTs Minted</p>
              <p className="text-4xl font-bold">{totalSupply?.toString() || '0'}</p>
              <p className="text-gray-500 text-sm mt-2">unique tokens</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Contract:</span>
                <span className="font-mono text-sm">
                  {contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Standard:</span>
                <span className="font-semibold">ERC721</span>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800 mb-2">
                <strong>Metadata Format:</strong>
              </p>
              <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`{
  "name": "Asset Name",
  "description": "...",
  "image": "ipfs://..."
}`}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Existing NFTs List */}
      <div className="lg:col-span-2 bg-white border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Your NFTs</h2>
        <div className="text-center py-8 text-gray-500">
          <p>No NFTs displayed yet</p>
          <p className="text-sm mt-2">Use useNFTBalance hook to fetch your NFTs</p>
        </div>
      </div>
    </div>
  );
}