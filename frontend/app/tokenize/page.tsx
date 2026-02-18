'use client';

/**
 * Page Tokenize - Mint de tokens ERC20 et creation d'actifs via la Factory
 */

import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useKYCStatus } from '@/hooks/web3/useKYCStatus';
import { CONTRACT_ADDRESSES, DEFAULT_ASSET_ID } from '@/config/contracts';
import { parseUnits, formatUnits } from 'viem';
import FACTORY_ABI from '@/abi/Factory';

// ERC20 ABI minimal
const ERC20_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
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

const FACTORY_CREATE_ABI = FACTORY_ABI;

type Tab = 'erc20' | 'erc721';

export default function TokenizePage() {
  const { address, isConnected } = useAccount();
  const { kycStatus } = useKYCStatus();
  const [activeTab, setActiveTab] = useState<Tab>('erc20');

  if (!isConnected) {
    return (
      <div className="page-readable container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-12 text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-800">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to tokenize assets</p>
        </div>
      </div>
    );
  }

  const canTokenize = kycStatus?.canTrade ?? false;

  return (
    <div className="page-readable container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Tokenize Assets</h1>
        <p className="text-gray-600">Mint fungible tokens (ERC20) or create assets with the Factory</p>
      </div>

      {!canTokenize && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">!</span>
            <div className="flex-1">
              <h3 className="font-bold text-red-800 mb-2">KYC Verification Required</h3>
              <p className="text-red-700 text-sm mb-3">
                You need to complete KYC verification before minting or creating assets.
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
            Create Asset (Factory)
          </button>
        </div>
      </div>

      {activeTab === 'erc20' ? (
        <ERC20Tab canTokenize={canTokenize} userAddress={address!} />
      ) : (
        <CreateAssetTab canTokenize={canTokenize} userAddress={address!} />
      )}
    </div>
  );
}

// ===== ERC20 Tab =====
function ERC20Tab({ canTokenize, userAddress }: { canTokenize: boolean; userAddress: string }) {
  const [mintAmount, setMintAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(CONTRACT_ADDRESSES.USDC);

  const factoryAddress = CONTRACT_ADDRESSES.ASSET_FACTORY as `0x${string}`;
  const hasFactory = factoryAddress !== '0x0000000000000000000000000000000000000000';

  const { data: assetRecord } = useReadContract({
    address: factoryAddress,
    abi: FACTORY_CREATE_ABI,
    functionName: 'getAsset',
    args: [BigInt(DEFAULT_ASSET_ID)],
    query: {
      enabled: hasFactory,
      refetchInterval: 10_000,
    },
  });

  const assetTokenAddress = assetRecord ? (assetRecord as any[])[2] as string : undefined;

  useEffect(() => {
    if (assetTokenAddress && assetTokenAddress !== selectedToken) {
      setSelectedToken(assetTokenAddress);
    }
  }, [assetTokenAddress, selectedToken]);

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

  const { writeContract, data: hash, isPending, error } = useWriteContract();
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
      const amount = parseUnits(mintAmount, (decimals as number) || 18);

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
    ? formatUnits(totalSupply as bigint, (decimals as number) || 18)
    : '0';

  return (
    <div className="grid gap-6 lg:grid-cols-2">
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
              {assetTokenAddress && assetTokenAddress !== '0x0000000000000000000000000000000000000000' && (
                <option value={assetTokenAddress}>Asset Token (Factory)</option>
              )}
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

          {hash && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-semibold">Tokens minted successfully.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">Error: {error.message}</p>
            </div>
          )}
        </div>
      </div>

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
                <strong>Note:</strong> Minting requires ADMIN_ROLE on the token contract.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Create Asset Tab =====
function CreateAssetTab({ canTokenize, userAddress }: { canTokenize: boolean; userAddress: string }) {
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [nftName, setNftName] = useState('');
  const [nftSymbol, setNftSymbol] = useState('');
  const [treasury, setTreasury] = useState(userAddress);
  const [initialSupply, setInitialSupply] = useState('1000000');
  const [location, setLocation] = useState('');
  const [surface, setSurface] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [description, setDescription] = useState('');
  const [documents, setDocuments] = useState('');
  const [tokenUri, setTokenUri] = useState('');

  const factoryAddress = CONTRACT_ADDRESSES.ASSET_FACTORY;
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleCreateAsset = () => {
    if (!canTokenize) {
      alert('Please complete KYC verification first');
      return;
    }

    if (!factoryAddress || factoryAddress === '0x0000000000000000000000000000000000000000') {
      alert('Factory address is not configured');
      return;
    }

    if (!tokenName || !tokenSymbol || !nftName || !nftSymbol) {
      alert('Please fill token and NFT names/symbols');
      return;
    }

    try {
      writeContract({
        address: factoryAddress as `0x${string}`,
        abi: FACTORY_CREATE_ABI,
        functionName: 'createAsset',
        args: [
          tokenName,
          tokenSymbol,
          nftName,
          nftSymbol,
          treasury as `0x${string}`,
          parseUnits(initialSupply || '0', 18),
          location,
          BigInt(surface || '0'),
          BigInt(estimatedValue || '0'),
          description,
          documents,
          tokenUri,
        ],
      });
    } catch (err) {
      console.error('Error creating asset:', err);
      alert(`Error: ${(err as Error).message}`);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Create New Asset</h2>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Token Name</label>
              <input
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="Paris Share"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Token Symbol</label>
              <input
                type="text"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                placeholder="PARIS"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">NFT Name</label>
              <input
                type="text"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                placeholder="Paris Building"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">NFT Symbol</label>
              <input
                type="text"
                value={nftSymbol}
                onChange={(e) => setNftSymbol(e.target.value)}
                placeholder="PARISNFT"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Treasury Address</label>
            <input
              type="text"
              value={treasury}
              onChange={(e) => setTreasury(e.target.value)}
              placeholder={userAddress}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Initial Supply</label>
              <input
                type="number"
                value={initialSupply}
                onChange={(e) => setInitialSupply(e.target.value)}
                placeholder="1000000"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Surface (sqm)</label>
              <input
                type="number"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                placeholder="1200"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Estimated Value</label>
              <input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="2500000"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Paris, France"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of the asset"
              className="w-full border rounded-lg px-4 py-2"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Documents (IPFS)</label>
            <input
              type="text"
              value={documents}
              onChange={(e) => setDocuments(e.target.value)}
              placeholder="ipfs://..."
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Token URI (NFT Metadata)</label>
            <input
              type="text"
              value={tokenUri}
              onChange={(e) => setTokenUri(e.target.value)}
              placeholder="ipfs://..."
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <button
            onClick={handleCreateAsset}
            disabled={!canTokenize || isPending || isConfirming}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              canTokenize && !isPending && !isConfirming
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isPending ? 'Waiting for approval...' : isConfirming ? 'Creating...' : 'Create Asset'}
          </button>

          {hash && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-semibold">Asset created successfully.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">Error: {error.message}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Factory Status</h2>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Factory Address</p>
            <p className="text-xs font-mono text-gray-700 break-all">
              {factoryAddress}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Creation requires ADMIN_ROLE on the Factory contract.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
