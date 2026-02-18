'use client';

/**
 * Page Portfolio - Affiche les investissements de l'utilisateur
 */

import { useAccount, useBalance, useReadContract } from 'wagmi';
import { ComplianceStatus } from '@/components/features/ComplianceStatus';
import { CONTRACT_ADDRESSES, DEFAULT_ASSET_ID } from '@/config/contracts';
import { useTokenBalances } from '@/hooks/web3/useTokenBalances';
import { useNFTBalance } from '@/hooks/web3/useNFTs';
import FACTORY_ABI from '@/abi/Factory';

type AssetRecord = {
  id: bigint;
  nft: `0x${string}`;
  token: `0x${string}`;
  pool: `0x${string}`;
  name: string;
  symbol: string;
  active: boolean;
};

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();

  const { data: nativeBalance, isLoading: isLoadingNativeBalance } = useBalance({
    address,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  const factoryAddress = CONTRACT_ADDRESSES.ASSET_FACTORY;
  const hasFactory =
    factoryAddress !== '0x0000000000000000000000000000000000000000';

  const { data: assetRecord } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'getAsset',
    args: [BigInt(DEFAULT_ASSET_ID)],
    query: {
      enabled: hasFactory,
      refetchInterval: 10000,
    },
  });

  const parsedAssetRecord = assetRecord as AssetRecord | undefined;
  const assetTokenAddress = parsedAssetRecord?.token;
  const assetNftAddress = parsedAssetRecord?.nft;

  const tokenAddresses = [
    CONTRACT_ADDRESSES.USDC,
    CONTRACT_ADDRESSES.USDT,
    assetTokenAddress,
  ].filter(
    (tokenAddress): tokenAddress is string =>
      !!tokenAddress &&
      tokenAddress !== '0x0000000000000000000000000000000000000000'
  );

  const {
    balances,
    totalUsdValue,
    isLoading: isLoadingTokenBalances,
  } = useTokenBalances(tokenAddresses);

  const {
    nfts,
    balance: nftBalance,
    isLoading: isLoadingNfts,
  } = useNFTBalance(
    assetNftAddress &&
      assetNftAddress !== '0x0000000000000000000000000000000000000000'
      ? assetNftAddress
      : undefined
  );

  const stablecoinUsdValue = balances.reduce((sum, token) => {
    const balanceNumber = Number(token.formattedBalance);
    if (Number.isNaN(balanceNumber)) return sum;

    if (token.symbol === 'USDC' || token.symbol === 'USDT') {
      return sum + balanceNumber;
    }

    return sum;
  }, 0);

  const oracleUsdValue = Number(totalUsdValue);
  const computedOracleUsdValue = Number.isNaN(oracleUsdValue) ? 0 : oracleUsdValue;
  const portfolioUsdValue = stablecoinUsdValue + computedOracleUsdValue;

  const hasNativeBalance =
    !!nativeBalance?.formatted && Number(nativeBalance.formatted) > 0;

  const positiveTokenBalances = balances.filter((token) => {
    const value = Number(token.formattedBalance);
    return !Number.isNaN(value) && value > 0;
  });

  const totalAssetsCount =
    positiveTokenBalances.length + Number(nftBalance) + (hasNativeBalance ? 1 : 0);

  const isLoadingPortfolio =
    isLoadingNativeBalance || isLoadingTokenBalances || isLoadingNfts;

  if (!isConnected) {
    return (
      <div className="page-readable container mx-auto px-4 py-12">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-12 text-center">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400">
            Please connect your wallet to view your portfolio
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-readable container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-white">My Portfolio</h1>
        <p className="text-sm text-gray-400">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
      </div>

      {/* Compliance Status */}
      <div className="mb-8">
        <ComplianceStatus />
      </div>

      {/* Portfolio Summary */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <SummaryCard
          label="Total Value"
          value={isLoadingPortfolio ? 'Loading...' : `$${portfolioUsdValue.toFixed(2)}`}
          change={
            portfolioUsdValue > 0
              ? 'Estimated from stablecoins + oracle feeds'
              : 'No priced assets yet'
          }
          positive={true}
        />
        <SummaryCard
          label="Total Assets"
          value={isLoadingPortfolio ? 'Loading...' : totalAssetsCount.toString()}
          change={`${positiveTokenBalances.length} tokens • ${Number(nftBalance)} NFTs${hasNativeBalance ? ' • 1 native' : ''}`}
          positive={true}
        />
        <SummaryCard
          label="Wallet Balance"
          value={
            isLoadingPortfolio
              ? 'Loading...'
              : `${nativeBalance?.formatted ? Number(nativeBalance.formatted).toFixed(4) : '0'} ${nativeBalance?.symbol || 'ETH'}`
          }
          change="Native balance (Sepolia/Mainnet selon réseau wallet)"
          positive={true}
        />
      </div>

      {/* Holdings */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Your Holdings</h2>
        {isLoadingPortfolio ? (
          <div className="text-center text-gray-400 py-12">Loading portfolio data...</div>
        ) : totalAssetsCount === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>No holdings found</p>
            <p className="text-sm mt-2">
              Start investing in tokenized assets to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Native {nativeBalance?.symbol || 'ETH'}</p>
                  <p className="text-xs text-gray-400">Wallet on current connected chain</p>
                </div>
                <p className="text-lg font-bold text-white">
                  {nativeBalance?.formatted ? Number(nativeBalance.formatted).toFixed(6) : '0'}{' '}
                  {nativeBalance?.symbol || 'ETH'}
                </p>
              </div>
            </div>

            {positiveTokenBalances.map((token) => (
              <div
                key={token.address}
                className="rounded-lg border border-gray-700 bg-gray-800/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{token.symbol}</p>
                    <p className="text-xs text-gray-400">{token.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">
                      {Number(token.formattedBalance).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 6,
                      })}
                    </p>
                    {token.symbol === 'USDC' || token.symbol === 'USDT' ? (
                      <p className="text-xs text-gray-400">
                        ~${Number(token.formattedBalance).toFixed(2)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {Number(nftBalance) > 0 ? (
              <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">NFT Holdings</p>
                    <p className="text-xs text-gray-400">
                      {nfts.length > 0 ? nfts[0].name : 'Asset collection'}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-white">{Number(nftBalance)} NFTs</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  change,
  positive,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <p className="mb-2 text-sm text-gray-400">{label}</p>
      <p className="mb-1 text-3xl font-bold text-white">{value}</p>
      <p
        className={`text-sm ${
          positive ? 'text-green-400' : 'text-red-400'
        }`}
      >
        {change}
      </p>
    </div>
  );
}
