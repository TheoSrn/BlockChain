import { ethers } from "hardhat";

/**
 * Script pour créer un actif tokenisé via la Factory
 * L'actif sera automatiquement enregistré dans l'Oracle
 * Usage: npx hardhat run scripts/createAsset.ts --network localhost
 */

async function main() {
  console.log("🏭 Creating Tokenized Asset via Factory...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Creating from:", deployer.address);

  // Adresses des contrats
  const factoryAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
  const oracleAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const usdcAddress = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
  
  // Connecter aux contrats
  const Factory = await ethers.getContractFactory("Factory");
  const factory = await Factory.attach(factoryAddress);

  const Oracle = await ethers.getContractFactory("Oracle");
  const oracle = await Oracle.attach(oracleAddress);

  const TestERC20 = await ethers.getContractFactory("TestERC20");
  const usdc = await TestERC20.attach(usdcAddress);

  console.log("📊 Creating Asset: Tokenized Real Estate Property");
  console.log("   Name: Manhattan Apartment Complex");
  console.log("   Symbol: MAPT");
  console.log("   Total Supply: 100 tokens");
  console.log("   Estimated Value: $5,000,000\n");

  // Paramètres de l'actif
  const tokenName = "Manhattan Apartment Token";
  const tokenSymbol = "MAPT";
  const nftName = "Manhattan Apartment NFT";
  const nftSymbol = "MAPTNFT";
  const treasury = deployer.address; // Treasury pour recevoir les tokens
  const initialSupply = 100; // 100 tokens
  const location = "Manhattan, New York, USA";
  const surface = 5000; // 5000 m²
  const estimatedValue = ethers.parseUnits("5000000", 6); // $5M en USDC
  const description = "Luxury apartment complex in Manhattan with 50 units";
  const documents = "ipfs://QmDocuments123456789";
  const tokenUri = "ipfs://QmTokenUri123456789";

  // Créer l'actif
  console.log("Creating asset via Factory...");
  const tx = await factory.createAsset(
    tokenName,
    tokenSymbol,
    nftName,
    nftSymbol,
    treasury,
    initialSupply,
    location,
    surface,
    estimatedValue,
    description,
    documents,
    tokenUri
  );
  
  console.log("⏳ Waiting for transaction confirmation...");
  const receipt = await tx.wait();
  console.log(`✅ Transaction hash: ${tx.hash}`);
  console.log(`✅ Block: ${receipt?.blockNumber}\n`);

  // Récupérer l'ID de l'actif créé
  const assetCount = await factory.assetCount();
  const assetId = assetCount;
  
  console.log(`📝 Asset created with ID: ${assetId}\n`);

  // Récupérer les détails de l'actif
  const assetDetails = await factory.getAsset(assetId);
  console.log("Asset Details:");
  console.log(`  ID: ${assetDetails[0]}`);
  console.log(`  NFT Contract: ${assetDetails[1]}`);
  console.log(`  Token Contract: ${assetDetails[2]}`);
  console.log(`  Pool Contract: ${assetDetails[3]}`);
  console.log(`  Name: ${assetDetails[4]}`);
  console.log(`  Symbol: ${assetDetails[5]}`);
  console.log(`  Active: ${assetDetails[6]}\n`);

  // Vérifier que l'actif est enregistré dans l'Oracle
  console.log("Checking Oracle registration...");
  const [oracleNFT, oracleToken, exists] = await oracle.getAsset(assetId);
  console.log(`  Oracle Asset Exists: ${exists}`);
  console.log(`  Oracle NFT Address: ${oracleNFT}`);
  console.log(`  Oracle Token Address: ${oracleToken}\n`);

  // Définir un prix initial dans l'Oracle
  console.log("Setting initial price in Oracle...");
  const initialPrice = ethers.parseUnits("50000", 6); // $50,000.00
  const priceTx = await oracle.setPrice(assetId, initialPrice);
  await priceTx.wait();
  console.log(`✅ Price set to $50,000.00`);
  console.log(`✅ Transaction hash: ${priceTx.hash}\n`);

  // Vérifier le prix
  const [price, timestamp] = await oracle.getPrice(assetId);
  console.log(`Oracle Price Data:`);
  console.log(`  Raw Price: ${price.toString()}`);
  console.log(`  Formatted: $${ethers.formatUnits(price, 6)}`);
  console.log(`  Timestamp: ${timestamp.toString()}`);
  console.log(`  Date: ${new Date(Number(timestamp) * 1000).toLocaleString()}\n`);

  console.log("✨ Asset creation complete!");
  console.log("\n🌐 Visit http://localhost:3000/oracle to see the asset price");
  console.log("🌐 Visit http://localhost:3000/assets to see all assets");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
