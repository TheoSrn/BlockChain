import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

// Charger les adresses depuis frontend/.env.local
const frontendEnvPath = path.join(__dirname, "../../frontend/.env.local");
dotenv.config({ path: frontendEnvPath });

async function main() {
  console.log("🚀 Deploying PrimarySaleNFT Contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const KYC_ADDRESS = process.env.NEXT_PUBLIC_KYC_ADDRESS;

  if (!KYC_ADDRESS) {
    console.error("❌ NEXT_PUBLIC_KYC_ADDRESS not found in frontend/.env.local");
    process.exit(1);
  }

  console.log("KYC Contract:", KYC_ADDRESS);
  console.log("");

  // Déployer PrimarySaleNFT
  console.log("📝 Deploying PrimarySaleNFT...");
  const PrimarySaleNFT = await ethers.getContractFactory("PrimarySaleNFT");
  const primarySaleNFT = await PrimarySaleNFT.deploy(
    deployer.address, // admin
    KYC_ADDRESS       // kyc address
  );

  await primarySaleNFT.waitForDeployment();
  const primarySaleNFTAddress = await primarySaleNFT.getAddress();

  console.log("✅ PrimarySaleNFT deployed to:", primarySaleNFTAddress);
  console.log("");

  console.log("═".repeat(80));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("═".repeat(80));
  console.log("");
  console.log("PrimarySaleNFT Contract:", primarySaleNFTAddress);
  console.log("Admin:", deployer.address);
  console.log("KYC Contract:", KYC_ADDRESS);
  console.log("");
  console.log("═".repeat(80));
  console.log("");

  console.log("📝 Next steps:");
  console.log("1. Update frontend/.env.local:");
  console.log(`   NEXT_PUBLIC_PRIMARY_SALE_NFT_ADDRESS=${primarySaleNFTAddress}`);
  console.log("");
  console.log("2. Whitelist the PrimarySaleNFT contract in KYC:");
  console.log(`   Add ${primarySaleNFTAddress} to manageKYC.ts whitelist`);
  console.log("");
  console.log("3. Export the ABI to frontend:");
  console.log("   The ABI will be in artifacts/contracts/PrimarySaleNFT.sol/PrimarySaleNFT.json");
  console.log("");

  console.log("✨ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
