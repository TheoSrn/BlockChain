'use client';

/**
 * Page d'accueil de la plateforme de gestion d'actifs tokenisés
 */

import { useAccount } from 'wagmi';
import { ComplianceStatus } from '@/components/features/ComplianceStatus';
import Link from 'next/link';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <h1 className="mb-4 text-5xl font-bold">
          <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Tokenized Asset
          </span>
          <br />
          Management Platform
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-gray-400">
          Trade and manage tokenized real-world assets (RWA) with on-chain compliance
          and transparent DeFi mechanisms.
        </p>
      </div>

      {/* Compliance Status */}
      {isConnected && (
        <div className="mb-12">
          <ComplianceStatus />
        </div>
      )}

      {/* Features Grid */}
      <div className="mb-16 grid gap-8 md:grid-cols-3">
        <FeatureCard
          title="Compliant Trading"
          description="All KYC, whitelist, and blacklist checks are enforced on-chain for maximum security."
          icon="🔒"
        />
        <FeatureCard
          title="Real-time On-chain Data"
          description="No mocked data. All information reflects the actual blockchain state via indexer."
          icon="⛓️"
        />
        <FeatureCard
          title="Tokenized Assets"
          description="Access a variety of tokenized real-world assets including real estate, commodities, and more."
          icon="🏢"
        />
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/assets"
          className="rounded-lg bg-purple-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
        >
          Explore Assets
        </Link>
        <Link
          href="/kyc"
          className="rounded-lg border border-purple-600 px-8 py-3 font-semibold text-purple-400 transition-colors hover:bg-purple-600/10"
        >
          Complete KYC
        </Link>
      </div>

      {/* Stats Section */}
      {isConnected && (
        <div className="mt-16 grid gap-6 md:grid-cols-4">
          <StatCard label="Total Assets" value="Loading..." />
          <StatCard label="Total Value Locked" value="Loading..." />
          <StatCard label="24h Volume" value="Loading..." />
          <StatCard label="Active Users" value="Loading..." />
        </div>
      )}
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 transition-colors hover:border-purple-500/50">
      <div className="mb-4 text-4xl">{icon}</div>
      <h3 className="mb-2 text-xl font-bold text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <p className="mb-1 text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

