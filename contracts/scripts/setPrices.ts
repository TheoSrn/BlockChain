import { ethers } from "hardhat";

/**
 * Script pour définir les prix dans l'Oracle
 * Usage: npx hardhat run scripts/setPrices.ts --network localhost
 */

async function main() {
  console.log("🔮 Setting Oracle Prices...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Setting prices from:", deployer.address);

  // Adresse de l'Oracle (remplacer par votre adresse)
  const oracleAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  
  // Connecter à l'Oracle
  const Oracle = await ethers.getContractFactory("Oracle");
  const oracle = await Oracle.attach(oracleAddress);

  // Définir des prix pour plusieurs actifs
  const prices = [
    { assetId: 1, price: "100000", description: "Asset 1 - $100,000.00" },
    { assetId: 2, price: "250000", description: "Asset 2 - $250,000.00" },
    { assetId: 3, price: "500000", description: "Asset 3 - $500,000.00" },
  ];

  console.log("Setting prices for assets...\n");

  for (const { assetId, price, description } of prices) {
    try {
      // Le prix est en format avec 6 décimales (comme USDC)
      // Donc 100000 = $100.00, 1000000 = $1,000.00
      const priceInWei = ethers.parseUnits(price, 6);
      
      console.log(`Setting price for Asset ${assetId}:`);
      console.log(`  Description: ${description}`);
      console.log(`  Price (raw): ${priceInWei.toString()}`);
      
      const tx = await oracle.setPrice(assetId, priceInWei);
      await tx.wait();
      
      console.log(`  ✅ Transaction hash: ${tx.hash}`);
      
      // Vérifier que le prix a été défini
      const [retrievedPrice, timestamp] = await oracle.getPrice(assetId);
      console.log(`  ✅ Verified price: ${ethers.formatUnits(retrievedPrice, 6)}`);
      console.log(`  ✅ Timestamp: ${timestamp.toString()}\n`);
    } catch (error: any) {
      console.log(`  ❌ Error setting price for Asset ${assetId}:`, error.message);
      console.log("");
    }
  }

  console.log("✨ Price setting complete!");
  console.log("\n💡 Refresh your browser to see the updated prices on /oracle page");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
