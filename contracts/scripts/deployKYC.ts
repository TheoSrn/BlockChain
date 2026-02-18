import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying KYC Contract on Sepolia...");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("Deploying from:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("❌ Deployer account has no funds!");
    process.exit(1);
  }

  // Deploy KYC with deployer as admin
  console.log("\n📋 Deploying KYC Contract...");
  const KYCFactory = await ethers.getContractFactory("KYC");
  const kyc = await KYCFactory.deploy(deployer.address);
  await kyc.waitForDeployment();
  const kycAddress = await kyc.getAddress();
  
  console.log("✅ KYC Contract deployed at:", kycAddress);
  console.log("✅ Admin role granted to:", deployer.address);

  console.log("\n📝 Update your frontend/.env.local:");
  console.log(`NEXT_PUBLIC_KYC_ADDRESS=${kycAddress}`);
  
  console.log("\n🔗 Verify on Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${kycAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
