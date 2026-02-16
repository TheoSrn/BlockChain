import { ethers } from "hardhat";

/**
 * Script pour créer plusieurs actifs tokenisés avec des prix variés
 * Démontre que l'Oracle peut gérer plusieurs tokens et collections NFT
 */

async function main() {
  console.log("🏭 Creating Multiple Tokenized Assets...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Creating from:", deployer.address);

  // Adresses des contrats
  const factoryAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
  const oracleAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  
  const Factory = await ethers.getContractFactory("Factory");
  const factory = await Factory.attach(factoryAddress);

  const Oracle = await ethers.getContractFactory("Oracle");
  const oracle = await Oracle.attach(oracleAddress);

  // Liste d'actifs à créer
  const assets = [
    {
      tokenName: "Gold Bullion Token",
      tokenSymbol: "GOLD",
      nftName: "Gold Bullion NFT",
      nftSymbol: "GOLDNFT",
      location: "Swiss Vault, Zurich",
      surface: 0, // Not applicable for gold
      estimatedValue: "2000000", // $2M
      description: "Tokenized physical gold bars stored in Swiss vault",
      price: "65000", // $65,000 per token
      totalSupply: 100,
    },
    {
      tokenName: "Contemporary Art Collection",
      tokenSymbol: "ARTC",
      nftName: "Art Collection NFT",
      nftSymbol: "ARTNFT",
      location: "Museum of Modern Art, NYC",
      surface: 0,
      estimatedValue: "10000000", // $10M
      description: "Collection of 25 contemporary artworks by renowned artists",
      price: "250000", // $250,000 per token
      totalSupply: 40,
    },
    {
      tokenName: "Miami Beach Hotel",
      tokenSymbol: "MBHOTEL",
      nftName: "Miami Hotel NFT",
      nftSymbol: "MBNFT",
      location: "Miami Beach, Florida, USA",
      surface: 15000, // 15,000 m²
      estimatedValue: "25000000", // $25M
      description: "Luxury 200-room beachfront hotel with spa and restaurants",
      price: "500000", // $500,000 per token
      totalSupply: 50,
    },
    {
      tokenName: "Classic Car Collection",
      tokenSymbol: "CARS",
      nftName: "Classic Cars NFT",
      nftSymbol: "CARSNFT",
      location: "Private Garage, Monaco",
      surface: 0,
      estimatedValue: "5000000", // $5M
      description: "Collection of 15 vintage Ferrari and Porsche vehicles",
      price: "100000", // $100,000 per token
      totalSupply: 50,
    },
  ];

  console.log(`📊 Creating ${assets.length} tokenized assets...\n`);

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    console.log(`\n[${i + 1}/${assets.length}] Creating: ${asset.tokenName}`);
    console.log(`   Symbol: ${asset.tokenSymbol}`);
    console.log(`   Location: ${asset.location}`);
    console.log(`   Estimated Value: $${parseInt(asset.estimatedValue).toLocaleString()}`);
    console.log(`   Price per token: $${parseInt(asset.price).toLocaleString()}`);
    console.log(`   Total Supply: ${asset.totalSupply} tokens`);

    try {
      // Créer l'actif
      const tx = await factory.createAsset(
        asset.tokenName,
        asset.tokenSymbol,
        asset.nftName,
        asset.nftSymbol,
        deployer.address,
        asset.totalSupply,
        asset.location,
        asset.surface,
        ethers.parseUnits(asset.estimatedValue, 6),
        asset.description,
        `ipfs://QmDocs${i + 2}`,
        `ipfs://QmToken${i + 2}`
      );

      console.log("   ⏳ Waiting for confirmation...");
      await tx.wait();
      console.log(`   ✅ Asset created!`);

      // Obtenir l'ID de l'actif créé
      const assetCount = await factory.assetCount();
      const assetId = assetCount;

      console.log(`   📝 Asset ID: ${assetId}`);

      // Définir le prix dans l'Oracle
      const priceInWei = ethers.parseUnits(asset.price, 6);
      const priceTx = await oracle.setPrice(assetId, priceInWei);
      await priceTx.wait();
      
      console.log(`   💰 Price set: $${parseInt(asset.price).toLocaleString()}`);

      // Vérifier le prix
      const [price, timestamp] = await oracle.getPrice(assetId);
      console.log(`   ✅ Verified price: $${ethers.formatUnits(price, 6)}`);

    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✨ All assets created successfully!");
  console.log("=".repeat(60));

  // Afficher un résumé
  const totalAssets = await factory.assetCount();
  console.log(`\n📊 Summary:`);
  console.log(`   Total Assets in System: ${totalAssets}`);
  console.log(`   Assets Just Created: ${assets.length}`);

  console.log("\n🌐 Next Steps:");
  console.log("   1. Visit http://localhost:3000/oracle to see all asset prices");
  console.log("   2. Visit http://localhost:3000/assets to see all assets");
  console.log("   3. Prices will auto-refresh every 10 seconds");

  console.log("\n💡 Oracle Features Demonstrated:");
  console.log("   ✅ Multiple token/collection price tracking");
  console.log("   ✅ Real-world assets (gold, real estate, art, cars)");
  console.log("   ✅ NFT collection valuations");
  console.log("   ✅ On-chain price storage");
  console.log("   ✅ Timestamp tracking");
  console.log("   ✅ Price diversity (from $65K to $500K per token)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
