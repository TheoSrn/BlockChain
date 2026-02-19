'use client';

/**
 * Composant Header avec connexion wallet personnalisée
 * Affiche l'adresse, le réseau, et le statut KYC
 */

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { WalletButton } from '@/components/web3/WalletButton';
import { Sidebar } from './Sidebar';

export function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Éviter les erreurs d'hydratation en ne montant le composant que côté client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Rendu minimal pendant le SSR
    return (
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-6 h-6" /> {/* Placeholder pour le hamburger */}
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
                <span className="text-xl font-bold text-white">
                  RWA Platform
                </span>
              </Link>
            </div>
            <div className="h-10 w-32" /> {/* Placeholder pour le wallet button */}
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Menu Hamburger + Logo */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                aria-label="Open menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
                <span className="text-xl font-bold text-white">
                  RWA Platform
                </span>
              </Link>
            </div>

            {/* Navigation - cachée sur mobile */}
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
    </>
  );
}
