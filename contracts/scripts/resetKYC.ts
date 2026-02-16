import { ethers } from "hardhat";

/**
 * Script pour retirer un compte de la whitelist KYC
 * Usage: npx hardhat run scripts/resetKYC.ts --network localhost
 */

async function main() {
  console.log("🔄 Resetting KYC Status...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Admin address:", deployer.address);

  // L'adresse à retirer de la whitelist
  const userAddress = "0xA24a49D62C3Dc81a9BADC056dc69a1B386593FcF"; // Votre adresse
  
  // Adresse du contrat KYC
  const kycAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("Target user address:", userAddress);
  console.log("KYC contract:", kycAddress);
  console.log("");

  try {
    const KYC = await ethers.getContractFactory("KYC");
    const kyc = await KYC.attach(kycAddress);
    
    // Vérifier le statut actuel
    const wasWhitelisted = await kyc.isWhitelisted(userAddress);
    const wasBlacklisted = await kyc.isBlacklisted(userAddress);
    const wasVerified = await kyc.isVerified(userAddress);
    
    console.log("📊 Current status:");
    console.log(`  Whitelisted: ${wasWhitelisted}`);
    console.log(`  Blacklisted: ${wasBlacklisted}`);
    console.log(`  Verified: ${wasVerified}`);
    console.log("");
    
    // Retirer de la whitelist
    if (wasWhitelisted) {
      console.log("🗑️  Removing from whitelist...");
      const tx1 = await kyc.setWhitelisted(userAddress, false);
      await tx1.wait();
      console.log("  ✅ Removed from whitelist");
    } else {
      console.log("  ⏭️  Already not whitelisted");
    }
    
    // Retirer de la blacklist si présent
    if (wasBlacklisted) {
      console.log("🗑️  Removing from blacklist...");
      const tx2 = await kyc.setBlacklisted(userAddress, false);
      await tx2.wait();
      console.log("  ✅ Removed from blacklist");
    } else {
      console.log("  ⏭️  Already not blacklisted");
    }
    
    console.log("");
    
    // Vérifier le nouveau statut
    const isWhitelisted = await kyc.isWhitelisted(userAddress);
    const isBlacklisted = await kyc.isBlacklisted(userAddress);
    const isVerified = await kyc.isVerified(userAddress);
    
    console.log("📊 New status:");
    console.log(`  Whitelisted: ${isWhitelisted}`);
    console.log(`  Blacklisted: ${isBlacklisted}`);
    console.log(`  Verified: ${isVerified}`);
    
    console.log("");
    console.log("═".repeat(60));
    console.log("✨ KYC Reset complete!");
    console.log("═".repeat(60));
    console.log("\n🧪 Now you can test the full KYC workflow:");
    console.log("   1. Go to /kyc and submit your KYC form");
    console.log("   2. Admin reviews on /admin/kyc");
    console.log("   3. Admin approves → You get whitelisted");
    console.log("   4. You can now trade!");
    
  } catch (error: any) {
    console.log(`  ❌ Error:`, error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
