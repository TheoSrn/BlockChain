import { ethers } from "hardhat";

/**
 * Script pour gérer le système KYC
 * Usage: npx hardhat run scripts/manageKYC.ts --network localhost
 */

async function main() {
  console.log("👤 KYC Management Script\n");

  const [deployer] = await ethers.getSigners();
  console.log("Managing KYC from:", deployer.address);

  // Adresse du contrat KYC (remplacer par votre adresse après déploiement)
  const kycAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Connecter au contrat KYC
  const KYC = await ethers.getContractFactory("KYC");
  const kyc = await KYC.attach(kycAddress);

  // ============================================
  // CONFIGURATION: Modifier selon vos besoins
  // ============================================

  // Exemple d'adresses à whitelister (remplacer par vos adresses)
  const addressesToWhitelist = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account #1
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Account #2
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Account #3
  ];

  // Exemple d'adresses à blacklister
  const addressesToBlacklist = [
    // "0x...", // Ajouter les adresses à blacklister ici
  ];

  // ============================================
  // WHITELIST OPERATIONS
  // ============================================

  if (addressesToWhitelist.length > 0) {
    console.log("\n📝 Whitelisting addresses...\n");

    for (const address of addressesToWhitelist) {
      try {
        const isAlreadyWhitelisted = await kyc.isWhitelisted(address);
        
        if (isAlreadyWhitelisted) {
          console.log(`  ⏭️  ${address} is already whitelisted`);
          continue;
        }

        const tx = await kyc.setWhitelisted(address, true);
        await tx.wait();
        
        console.log(`  ✅ Whitelisted: ${address}`);
        console.log(`     Tx hash: ${tx.hash}`);
      } catch (error: any) {
        console.log(`  ❌ Error whitelisting ${address}:`, error.message);
      }
    }

    // Batch whitelist example (more gas efficient)
    // const tx = await kyc.setBatchWhitelisted(addressesToWhitelist, true);
    // await tx.wait();
    // console.log("✅ Batch whitelisted:", addressesToWhitelist.length, "addresses");
  }

  // ============================================
  // BLACKLIST OPERATIONS
  // ============================================

  if (addressesToBlacklist.length > 0) {
    console.log("\n🚫 Blacklisting addresses...\n");

    for (const address of addressesToBlacklist) {
      try {
        const isAlreadyBlacklisted = await kyc.isBlacklisted(address);
        
        if (isAlreadyBlacklisted) {
          console.log(`  ⏭️  ${address} is already blacklisted`);
          continue;
        }

        const tx = await kyc.setBlacklisted(address, true);
        await tx.wait();
        
        console.log(`  ✅ Blacklisted: ${address}`);
        console.log(`     Tx hash: ${tx.hash}`);
      } catch (error: any) {
        console.log(`  ❌ Error blacklisting ${address}:`, error.message);
      }
    }
  }

  // ============================================
  // VERIFICATION STATUS
  // ============================================

  console.log("\n🔍 Verification Status:\n");
  
  const allAddresses = [...new Set([...addressesToWhitelist, ...addressesToBlacklist])];
  
  for (const address of allAddresses) {
    const isWhitelisted = await kyc.isWhitelisted(address);
    const isBlacklisted = await kyc.isBlacklisted(address);
    const isVerified = await kyc.isVerified(address);
    
    console.log(`  ${address}`);
    console.log(`    Whitelisted: ${isWhitelisted ? "✅" : "❌"}`);
    console.log(`    Blacklisted: ${isBlacklisted ? "🚫" : "✅"}`);
    console.log(`    Verified (can trade): ${isVerified ? "✅" : "❌"}`);
    console.log("");
  }

  console.log("✨ KYC management complete!");
  console.log("\n💡 Tips:");
  console.log("   - Use setBatchWhitelisted() for multiple addresses (gas efficient)");
  console.log("   - Blacklist overrides whitelist");
  console.log("   - Only verified users (whitelisted AND NOT blacklisted) can trade");
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Fonction pour retirer de la whitelist
export async function removeFromWhitelist(kycAddress: string, addresses: string[]) {
  const KYC = await ethers.getContractFactory("KYC");
  const kyc = await KYC.attach(kycAddress);
  
  console.log("\n🗑️  Removing from whitelist...\n");
  
  for (const address of addresses) {
    const tx = await kyc.setWhitelisted(address, false);
    await tx.wait();
    console.log(`  ✅ Removed: ${address}`);
  }
}

// Fonction pour retirer de la blacklist
export async function removeFromBlacklist(kycAddress: string, addresses: string[]) {
  const KYC = await ethers.getContractFactory("KYC");
  const kyc = await KYC.attach(kycAddress);
  
  console.log("\n🗑️  Removing from blacklist...\n");
  
  for (const address of addresses) {
    const tx = await kyc.setBlacklisted(address, false);
    await tx.wait();
    console.log(`  ✅ Removed: ${address}`);
  }
}

// Fonction pour vérifier le statut d'une adresse
export async function checkKYCStatus(kycAddress: string, address: string) {
  const KYC = await ethers.getContractFactory("KYC");
  const kyc = await KYC.attach(kycAddress);
  
  const isWhitelisted = await kyc.isWhitelisted(address);
  const isBlacklisted = await kyc.isBlacklisted(address);
  const isVerified = await kyc.isVerified(address);
  
  return {
    address,
    isWhitelisted,
    isBlacklisted,
    isVerified
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
