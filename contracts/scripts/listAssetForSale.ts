import { ethers } from 'hardhat';
import { parseUnits } from 'ethers';

/**
 * Script pour lister un asset sur PrimarySale
 * Permet au propriétaire de vendre ses tokens directement
 */
async function main() {
  console.log('📋 Listing asset on PrimarySale...\n');

  const [signer] = await ethers.getSigners();
  console.log('Using account:', signer.address);

  // ===== CONFIGURATION - À MODIFIER =====
  const PRIMARY_SALE_ADDRESS = process.env.PRIMARY_SALE_ADDRESS || '';
  const ASSET_TOKEN_ADDRESS = process.env.ASSET_TOKEN_ADDRESS || ''; // L'adresse ERC20 de votre asset
  const PAYMENT_TOKEN_ADDRESS = process.env.PAYMENT_TOKEN_ADDRESS || ''; // USDC, USDT, ou WETH
  const PRICE_PER_TOKEN = '20'; // Prix par token (ex: 20 USDC par token)
  const AMOUNT_TO_SELL = '500'; // Nombre de tokens à vendre (ex: 500 tokens)
  // =====================================

  if (!PRIMARY_SALE_ADDRESS) {
    console.error('❌ Error: PRIMARY_SALE_ADDRESS not set in environment');
    console.log('Please set it in your .env file or pass it as an argument');
    process.exit(1);
  }

  if (!ASSET_TOKEN_ADDRESS) {
    console.error('❌ Error: ASSET_TOKEN_ADDRESS not set');
    console.log('You can find it in the Factory contract after creating an asset');
    process.exit(1);
  }

  if (!PAYMENT_TOKEN_ADDRESS) {
    console.error('❌ Error: PAYMENT_TOKEN_ADDRESS not set');
    console.log('Use USDC, USDT, or WETH address from your deployment');
    process.exit(1);
  }

  console.log('PrimarySale contract:', PRIMARY_SALE_ADDRESS);
  console.log('Asset token:', ASSET_TOKEN_ADDRESS);
  console.log('Payment token:', PAYMENT_TOKEN_ADDRESS);
  console.log('Price per token:', PRICE_PER_TOKEN);
  console.log('Amount to sell:', AMOUNT_TO_SELL, '\n');

  // Charger les contrats
  const primarySale = await ethers.getContractAt('PrimarySale', PRIMARY_SALE_ADDRESS);
  const assetToken = await ethers.getContractAt('AssetERC20', ASSET_TOKEN_ADDRESS);

  // Vérifier le solde
  const balance = await assetToken.balanceOf(signer.address);
  console.log('Your token balance:', ethers.formatUnits(balance, 18));

  const amountToSell = parseUnits(AMOUNT_TO_SELL, 18);
  if (balance < amountToSell) {
    console.error('❌ Error: Insufficient balance');
    console.log(`You have ${ethers.formatUnits(balance, 18)} tokens but trying to sell ${AMOUNT_TO_SELL}`);
    process.exit(1);
  }

  // Vérifier l'allowance
  const allowance = await assetToken.allowance(signer.address, PRIMARY_SALE_ADDRESS);
  console.log('Current allowance:', ethers.formatUnits(allowance, 18));

  if (allowance < amountToSell) {
    console.log('\n📝 Step 1: Approving PrimarySale to transfer your tokens...');
    const approveTx = await assetToken.approve(PRIMARY_SALE_ADDRESS, amountToSell);
    console.log('Approval transaction:', approveTx.hash);
    await approveTx.wait();
    console.log('✅ Approval confirmed\n');
  } else {
    console.log('✅ Already approved\n');
  }

  // Créer le listing
  console.log('📝 Step 2: Creating listing on PrimarySale...');
  const pricePerToken = parseUnits(PRICE_PER_TOKEN, 18);
  
  const createListingTx = await primarySale.createListing(
    ASSET_TOKEN_ADDRESS,
    PAYMENT_TOKEN_ADDRESS,
    pricePerToken,
    amountToSell
  );

  console.log('Transaction hash:', createListingTx.hash);
  await createListingTx.wait();
  console.log('✅ Listing created successfully!\n');

  // Vérifier le listing
  const listing = await primarySale.getListing(ASSET_TOKEN_ADDRESS);
  console.log('📊 Listing details:');
  console.log('  Seller:', listing.seller);
  console.log('  Asset token:', listing.assetToken);
  console.log('  Payment token:', listing.paymentToken);
  console.log('  Price per token:', ethers.formatUnits(listing.pricePerToken, 18));
  console.log('  Available amount:', ethers.formatUnits(listing.availableAmount, 18));
  console.log('  Active:', listing.active);

  console.log('\n🎉 Success! Your asset is now listed for sale.');
  console.log('Buyers can now purchase it directly from the Buy Assets tab.\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
