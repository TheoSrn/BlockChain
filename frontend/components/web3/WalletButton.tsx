'use client';

/**
 * Composant WalletButton personnalisé avec statut KYC intégré
 * Affiche l'adresse, le réseau, et le statut de conformité
 */

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useBalance } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { formatUnits } from 'viem';
import { useKYCStatus } from '@/hooks/web3/useKYCStatus';

export function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Statut de montage du composant (évite hydration mismatch)
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              // Pas connecté
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
                  >
                    Connect Wallet
                  </button>
                );
              }

              // Mauvais réseau
              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="rounded-xl border-2 border-red-500 bg-red-500/10 px-6 py-3 font-semibold text-red-400 transition-all hover:bg-red-500/20"
                  >
                    ⚠️ Wrong Network
                  </button>
                );
              }

              // Connecté - Afficher wallet avec statut KYC
              return (
                <div className="flex items-center gap-3">
                  {/* Indicateur réseau */}
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-800"
                  >
                    {chain.hasIcon && (
                      <div
                        className="h-4 w-4 overflow-hidden rounded-full"
                        style={{ background: chain.iconBackground }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className="h-4 w-4"
                          />
                        )}
                      </div>
                    )}
                    <span>{chain.name}</span>
                  </button>

                  {/* Bouton Account avec badge KYC */}
                  <AccountButtonWithKYC
                    account={account}
                    openAccountModal={openAccountModal}
                  />
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

/**
 * Composant Account avec badge de statut KYC
 */
function AccountButtonWithKYC({
  account,
  openAccountModal,
}: {
  account: { address: string; displayName: string; displayBalance?: string };
  openAccountModal: () => void;
}) {
  const { kycStatus, isLoading } = useKYCStatus();
  const { data: nativeBalance, isLoading: isBalanceLoading } = useBalance({
    address: account.address as `0x${string}`,
    chainId: sepolia.id,
    query: {
      refetchInterval: 10000,
    },
  });

  const safeDisplayBalance = (() => {
    if (nativeBalance?.value !== undefined) {
      const formatted = formatUnits(
        nativeBalance.value,
        nativeBalance.decimals ?? 18
      );
      const numeric = Number(formatted);

      if (!Number.isNaN(numeric)) {
        return `${numeric.toFixed(4).replace(/\.?0+$/, '')} ${nativeBalance.symbol || 'ETH'}`;
      }
    }

    if (isBalanceLoading) {
      return 'Loading Sepolia ETH...';
    }

    if (account.displayBalance && !account.displayBalance.includes('NaN')) {
      return account.displayBalance;
    }

    return '0 ETH';
  })();

  return (
    <button
      onClick={openAccountModal}
      type="button"
      className="relative flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-2 transition-all hover:border-gray-600 hover:bg-gray-800"
    >
      {/* Badge KYC */}
      {!isLoading && (
        <KYCBadge
          isKYCVerified={kycStatus?.isKYCVerified ?? false}
          isWhitelisted={kycStatus?.isWhitelisted ?? false}
          isBlacklisted={kycStatus?.isBlacklisted ?? false}
        />
      )}

      {/* Adresse */}
      <div className="flex flex-col items-end">
        <span className="text-sm font-semibold text-white">
          {account.displayName}
        </span>
        <span className="text-xs text-gray-400">{safeDisplayBalance}</span>
      </div>
    </button>
  );
}

/**
 * Badge visuel du statut KYC
 */
function KYCBadge({
  isKYCVerified,
  isWhitelisted,
  isBlacklisted,
}: {
  isKYCVerified: boolean;
  isWhitelisted: boolean;
  isBlacklisted: boolean;
}) {
  // Blacklisté - Priorité maximale
  if (isBlacklisted) {
    return (
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-400"
        title="Blacklisted - Cannot trade"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      </div>
    );
  }

  // KYC vérifié + Whitelisté = OK
  if (isKYCVerified && isWhitelisted) {
    return (
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-400"
        title="KYC Verified & Whitelisted"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
    );
  }

  // Non vérifié
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400"
      title="KYC Required"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    </div>
  );
}
