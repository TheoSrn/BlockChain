'use client';

/**
 * Page New Tokenization - Créer un nouvel actif tokenisé
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useCompliance } from '@/hooks/web3/useCompliance';
import { useRouter } from 'next/navigation';

export default function NewTokenizePage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { compliance } = useCompliance();
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    assetType: '',
    totalSupply: '',
    valueUSD: '',
    description: '',
  });

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
    // Logic handled by services/contracts
    alert('Asset tokenization would be sent to smart contract');
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
                ⚠️ This is a demo form. In production, this would deploy a new
                ERC20 contract and register it on-chain.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canTokenize}
              className={`w-full rounded-lg py-3 font-semibold transition-colors ${
                canTokenize
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'cursor-not-allowed bg-gray-700 text-gray-400'
              }`}
            >
              {canTokenize ? 'Create Token' : 'Complete KYC to Tokenize'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
