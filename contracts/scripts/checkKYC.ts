import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

// Charger les adresses depuis frontend/.env.local
const frontendEnvPath = path.join(__dirname, "../../frontend/.env.local");
dotenv.config({ path: frontendEnvPath });

async function main() {
  const KYC_ADDRESS = process.env.NEXT_PUBLIC_KYC_ADDRESS;
  const [signer] = await ethers.getSigners();
  const USER_ADDRESS = signer.address;

  if (!KYC_ADDRESS) {
    console.error("❌ NEXT_PUBLIC_KYC_ADDRESS not found in frontend/.env.local");
    process.exit(1);
  }

  console.log("🔍 Checking KYC Status on Blockchain...\n");

  const kyc = await ethers.getContractAt("KYC", KYC_ADDRESS);

  const isWhitelisted = await kyc.isWhitelisted(USER_ADDRESS);
  const isBlacklisted = await kyc.isBlacklisted(USER_ADDRESS);
  const isVerified = await kyc.isVerified(USER_ADDRESS);

  console.log("📊 Real Blockchain Status:");
  console.log("KYC Contract:", KYC_ADDRESS);
  console.log("User Address:", USER_ADDRESS);
  console.log("");
  console.log("Whitelisted:", isWhitelisted);
  console.log("Blacklisted:", isBlacklisted);
  console.log("Verified:", isVerified);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
