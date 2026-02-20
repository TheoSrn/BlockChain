import { ethers } from 'hardhat';

/**
 * Script pour déployer le contrat PrimarySale
 * Permet la vente directe d'assets du créateur aux acheteurs
 */
async function main() {
  console.log('🚀 Deploying PrimarySale contract...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', ethers.formatEther(balance), 'ETH\n');

  // Adresses des contrats existants (à ajuster selon votre déploiement)
  const KYC_ADDRESS = process.env.KYC_ADDRESS || '0x2B360BE544d920C122E8014Bec73BAE01A3B4E84'; // Sepolia
  const ADMIN_ADDRESS = deployer.address;

  console.log('Using KYC contract:', KYC_ADDRESS);
  console.log('Admin address:', ADMIN_ADDRESS, '\n');

  // Déployer PrimarySale
  const PrimarySale = await ethers.getContractFactory('PrimarySale');
  const primarySale = await PrimarySale.deploy(KYC_ADDRESS, ADMIN_ADDRESS);

  await primarySale.waitForDeployment();
  const primarySaleAddress = await primarySale.getAddress();

  console.log('✅ PrimarySale deployed to:', primarySaleAddress);
  console.log('\n📝 Update your .env.local with:');
  console.log(`NEXT_PUBLIC_PRIMARY_SALE_ADDRESS=${primarySaleAddress}`);
  console.log('\n🎉 Deployment complete!\n');

  console.log('📖 Next steps:');
  console.log('1. Update frontend/.env.local with the PRIMARY_SALE_ADDRESS');
  console.log('2. Asset creators can list their tokens for sale');
  console.log('3. Buyers can purchase directly without liquidity pools\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
