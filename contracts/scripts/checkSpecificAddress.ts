import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

// Charger les adresses depuis frontend/.env.local
const frontendEnvPath = path.join(__dirname, "../../frontend/.env.local");
dotenv.config({ path: frontendEnvPath });

async function main() {
  const KYC_ADDRESS = process.env.NEXT_PUBLIC_KYC_ADDRESS;
  const ADDRESS_TO_CHECK = "0x17e08dD6C3b78cB618Db025EA3d4868180bb3550";

  if (!KYC_ADDRESS) {
    console.error("❌ NEXT_PUBLIC_KYC_ADDRESS not found in frontend/.env.local");
    process.exit(1);
  }

  console.log("🔍 Checking KYC Status for specific address...\n");

  const kyc = await ethers.getContractAt("KYC", KYC_ADDRESS);

  const isWhitelisted = await kyc.isWhitelisted(ADDRESS_TO_CHECK);
  const isBlacklisted = await kyc.isBlacklisted(ADDRESS_TO_CHECK);
  const isVerified = await kyc.isVerified(ADDRESS_TO_CHECK);

  console.log("📊 KYC Status:");
  console.log("KYC Contract:", KYC_ADDRESS);
  console.log("Address:", ADDRESS_TO_CHECK);
  console.log("");
  console.log("Whitelisted:", isWhitelisted);
  console.log("Blacklisted:", isBlacklisted);
  console.log("Verified (can trade):", isVerified);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
