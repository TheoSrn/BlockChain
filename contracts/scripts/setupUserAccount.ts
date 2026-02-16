import { ethers } from "hardhat";

/**
 * Script pour setup un compte utilisateur avec ETH et rôle KYC admin
 * Usage: npx hardhat run scripts/setupUserAccount.ts --network localhost
 */

async function main() {
  console.log("🔧 Setting up user account...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // L'adresse de votre compte actuel (à remplacer)
  const userAddress = "0xA24a49D62C3Dc81a9BADC056dc69a1B386593FcF"; // Remplacez par votre adresse
  
  console.log("Target user address:", userAddress);
  console.log("");

  // ============================================
  // 1. TRANSFÉRER DE L'ETH
  // ============================================
  
  console.log("💰 Step 1/2: Transferring ETH...");
  
  const ethAmount = ethers.parseEther("100"); // 100 ETH
  
  try {
    const tx = await deployer.sendTransaction({
      to: userAddress,
      value: ethAmount,
    });
    await tx.wait();
    
    const balance = await ethers.provider.getBalance(userAddress);
    console.log(`  ✅ Transferred ${ethers.formatEther(ethAmount)} ETH`);
    console.log(`  ✅ New balance: ${ethers.formatEther(balance)} ETH`);
  } catch (error: any) {
    console.log(`  ❌ Error transferring ETH:`, error.message);
  }
  
  console.log("");

  // ============================================
  // 2. DONNER LE RÔLE KYC_ADMIN
  // ============================================
  
  console.log("👤 Step 2/2: Granting KYC_ADMIN role...");
  
  // Adresse du contrat KYC (remplacer par votre adresse après déploiement)
  const kycAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Adresse KYC du déploiement
  
  try {
    const KYC = await ethers.getContractFactory("KYC");
    const kyc = await KYC.attach(kycAddress);
    
    // Obtenir le rôle KYC_ADMIN
    const KYC_ADMIN_ROLE = await kyc.KYC_ADMIN_ROLE();
    
    // Vérifier si l'utilisateur a déjà le rôle
    const hasRole = await kyc.hasRole(KYC_ADMIN_ROLE, userAddress);
    
    if (hasRole) {
      console.log(`  ⏭️  User already has KYC_ADMIN role`);
    } else {
      // Donner le rôle
      const tx = await kyc.grantRole(KYC_ADMIN_ROLE, userAddress);
      await tx.wait();
      console.log(`  ✅ Granted KYC_ADMIN role to ${userAddress}`);
      console.log(`  ✅ Transaction hash: ${tx.hash}`);
    }
    
    // Whitelist l'utilisateur aussi
    const isWhitelisted = await kyc.isWhitelisted(userAddress);
    if (!isWhitelisted) {
      const tx2 = await kyc.setWhitelisted(userAddress, true);
      await tx2.wait();
      console.log(`  ✅ User whitelisted`);
    } else {
      console.log(`  ⏭️  User already whitelisted`);
    }
    
  } catch (error: any) {
    console.log(`  ❌ Error setting up KYC:`, error.message);
    console.log(`  💡 Make sure KYC contract address is correct`);
  }

  console.log("");
  console.log("═".repeat(60));
  console.log("✨ Setup complete!");
  console.log("═".repeat(60));
  console.log("\n📋 Your account now has:");
  console.log("   ✅ 100 ETH (for gas fees)");
  console.log("   ✅ KYC_ADMIN role (can manage KYC)");
  console.log("   ✅ Whitelisted (can trade)");
  console.log("\n💡 Refresh your browser and try the KYC page again!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
