'use client';

/**
 * Page New Tokenization - Créer un nouvel actif tokenisé
 */

import { useState } from 'react';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { useCompliance } from '@/hooks/web3/useCompliance';
import { useRouter } from 'next/navigation';
import { parseUnits } from 'viem';
import FACTORY_ABI from '@/abi/Factory';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

export default function NewTokenizePage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { compliance } = useCompliance();
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    assetType: '',
    city: '',
    country: '',
    totalSupply: '',
    valueUSD: '',
    description: '',
    imageUrl: '',
    surface: '',
    rooms: '',
  });
  const [imageStatus, setImageStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-12 text-center">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Connect Your Wallet
          </h2>
        </div>
      </div>
    );
  }

  const canTokenize = compliance?.canTrade ?? false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canTokenize || !address) return;

    const factoryAddress = CONTRACT_ADDRESSES.ASSET_FACTORY as `0x${string}`;
    if (!factoryAddress || factoryAddress === '0x0000000000000000000000000000000000000000') {
      alert('Factory address is not configured');
      return;
    }

    if (!formData.name || !formData.symbol || !formData.totalSupply || !formData.valueUSD || !formData.city || !formData.country) {
      alert('Please fill all required fields');
      return;
    }

    // Créer la localisation
    const location = `${formData.city}, ${formData.country}`;

    writeContract({
      address: factoryAddress,
      abi: FACTORY_ABI,
      functionName: 'createAsset',
      args: [
        formData.name,
        formData.symbol.toUpperCase(),
        `${formData.name} NFT`,
        `${formData.symbol.toUpperCase()}NFT`,
        address,
        parseUnits(formData.totalSupply, 18),
        location, // Ville, Pays
        BigInt(formData.surface || '0'),
        BigInt(formData.valueUSD || '0'),
        formData.rooms ? `${formData.description}${formData.description ? ' | ' : ''}${formData.rooms} rooms` : formData.description || '',
        formData.assetType || '', // Type d'actif dans documents
        formData.imageUrl || '', // tokenUri - l'image va ici!
      ],
      gas: BigInt(15000000), // Limite de gas sûre pour Sepolia
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-sm text-gray-400 hover:text-white"
          >
            ← Back
          </button>
          <h1 className="mb-2 text-4xl font-bold text-white">
            Tokenize New Asset
          </h1>
          <p className="text-gray-400">
            Create a new tokenized real-world asset on the blockchain
          </p>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Asset Information */}
            <div>
              <h3 className="mb-4 text-lg font-bold text-white">
                Asset Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Luxury Apartment Building NYC"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                    disabled={!canTokenize}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Token Symbol *
                    </label>
                    <input
                      type="text"
                      value={formData.symbol}
                      onChange={(e) =>
                        setFormData({ ...formData, symbol: e.target.value })
                      }
                      placeholder="LANYC"
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 uppercase text-white focus:border-purple-500 focus:outline-none"
                      required
                      disabled={!canTokenize}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Asset Type *
                    </label>
                    <select
                      value={formData.assetType}
                      onChange={(e) =>
                        setFormData({ ...formData, assetType: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      required
                      disabled={!canTokenize}
                    >
                      <option value="">Select type...</option>
                      <option value="REAL_ESTATE">Real Estate</option>
                      <option value="COMMODITY">Commodity</option>
                      <option value="EQUITY">Equity</option>
                      <option value="BOND">Bond</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      placeholder="Paris"
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      required
                      disabled={!canTokenize}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Country *
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      placeholder="France"
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      required
                      disabled={!canTokenize}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe your asset..."
                    rows={4}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    disabled={!canTokenize}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, imageUrl: e.target.value });
                      setImageStatus('idle');
                    }}
                    placeholder="https://example.com/asset-image.jpg"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    disabled={!canTokenize}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    💡 Recommandé : téléchargez votre image sur <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">imgur.com</a> pour un lien fiable
                  </p>
                  {formData.imageUrl && (
                    <div className="mt-3">
                      <p className="mb-2 text-xs text-gray-400">Aperçu de l'image :</p>
                      <div className="relative h-64 w-full overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
                        {imageStatus === 'loading' && (
                          <div className="flex h-full items-center justify-center">
                            <p className="text-sm text-gray-400">Chargement...</p>
                          </div>
                        )}
                        {imageStatus === 'error' && (
                          <div className="flex h-full items-center justify-center p-4 text-center">
                            <div>
                              <p className="text-sm text-red-400">❌ Impossible de charger l'image</p>
                              <p className="mt-2 text-xs text-gray-500">
                                Ce site bloque l'affichage de ses images ailleurs. <br />
                                Téléchargez l'image et uploadez-la sur <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Imgur</a> (gratuit).
                              </p>
                              <p className="mt-3 text-xs text-purple-400">
                                ℹ️ L'URL sera quand même enregistrée avec l'actif
                              </p>
                            </div>
                          </div>
                        )}
                        <img
                          src={formData.imageUrl}
                          alt="Asset preview"
                          className={`h-full w-full object-contain ${imageStatus === 'success' ? 'block' : 'hidden'}`}
                          onLoad={() => setImageStatus('success')}
                          onError={() => setImageStatus('error')}
                          onLoadStart={() => setImageStatus('loading')}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Surface (m²)
                    </label>
                    <input
                      type="number"
                      value={formData.surface}
                      onChange={(e) =>
                        setFormData({ ...formData, surface: e.target.value })
                      }
                      placeholder="150"
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      disabled={!canTokenize}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Number of Rooms
                    </label>
                    <input
                      type="number"
                      value={formData.rooms}
                      onChange={(e) =>
                        setFormData({ ...formData, rooms: e.target.value })
                      }
                      placeholder="5"
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      disabled={!canTokenize}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tokenomics */}
            <div>
              <h3 className="mb-4 text-lg font-bold text-white">Tokenomics</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Total Supply *
                  </label>
                  <input
                    type="number"
                    value={formData.totalSupply}
                    onChange={(e) =>
                      setFormData({ ...formData, totalSupply: e.target.value })
                    }
                    placeholder="1000000"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                    disabled={!canTokenize}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Value (USD) *
                  </label>
                  <input
                    type="number"
                    value={formData.valueUSD}
                    onChange={(e) =>
                      setFormData({ ...formData, valueUSD: e.target.value })
                    }
                    placeholder="5000000"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    required
                    disabled={!canTokenize}
                  />
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
              <p className="text-sm text-yellow-400">
                ⚠️ This creates an on-chain asset using the Factory. You must have the
                Factory admin role for the transaction to succeed.
              </p>
            </div>

            {txHash ? (
              <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
                <p className="mb-2 text-sm font-semibold text-blue-400">Transaction envoyée :</p>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-xs text-blue-300 hover:underline"
                  >
                    {txHash}
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(txHash)}
                    className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                    title="Copier"
                  >
                    📋
                  </button>
                </div>
                <p className="mt-2 text-xs text-blue-300">
                  {isConfirming ? '⏳ En attente de confirmation...' : '✅ Voir sur Etherscan (cliquez le lien)'}
                </p>
              </div>
            ) : null}

            {isSuccess ? (
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                <p className="text-sm text-green-400">
                  ✅ Asset created successfully.
                </p>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
                <p className="text-sm text-red-400">
                  Error: {error.message}
                </p>
              </div>
            ) : null}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canTokenize || isPending || isConfirming}
              className={`w-full rounded-lg py-3 font-semibold transition-colors ${
                canTokenize && !isPending && !isConfirming
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'cursor-not-allowed bg-gray-700 text-gray-400'
              }`}
            >
              {isPending || isConfirming ? 'Submitting...' : canTokenize ? 'Create Token' : 'Complete KYC to Tokenize'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
