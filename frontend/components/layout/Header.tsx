'use client';

/**
 * Composant Header avec connexion wallet personnalisée
 * Affiche l'adresse, le réseau, et le statut KYC
 */

import Link from 'next/link';
import { WalletButton } from '@/components/web3/WalletButton';

export function Header() {
  return (
    <header className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
            <span className="text-xl font-bold text-white">
              RWA Platform
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/dashboard"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/assets"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Assets
            </Link>
            <Link
              href="/portfolio"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Portfolio
            </Link>
            <Link
              href="/trade"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Trade
            </Link>
            <Link
              href="/kyc"
              className="text-gray-300 hover:text-white transition-colors"
            >
              KYC
            </Link>
          </nav>

          {/* Wallet Connection avec statut KYC intégré */}
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
