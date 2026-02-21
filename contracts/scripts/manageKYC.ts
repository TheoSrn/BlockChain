import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

// Charger les adresses depuis frontend/.env.local
const frontendEnvPath = path.join(__dirname, "../../frontend/.env.local");
dotenv.config({ path: frontendEnvPath });

/**
 * Script pour gérer le système KYC
 * Usage: npx hardhat run scripts/manageKYC.ts --network localhost
 */

async function main() {
  console.log("👤 KYC Management Script\n");

  const [deployer] = await ethers.getSigners();
  console.log("Managing KYC from:", deployer.address);

  // Adresse du contrat KYC depuis .env.local
  const kycAddress = process.env.NEXT_PUBLIC_KYC_ADDRESS;
  
  if (!kycAddress) {
    console.error("❌ NEXT_PUBLIC_KYC_ADDRESS not found in frontend/.env.local");
    process.exit(1);
  }
  
  console.log("KYC Contract:", kycAddress);
  
  // Connecter au contrat KYC
  const KYC = await ethers.getContractFactory("KYC");
  const kyc = await KYC.attach(kycAddress);

  // ============================================
  // CONFIGURATION: Modifier selon vos besoins
  // ============================================

  // Exemple d'adresses à whitelister (remplacer par vos adresses)
  const addressesToWhitelist = [
    "0xA24a49D62C3Dc81a9BADC056dc69a1B386593FcF", // Admin/Deployer Account
    process.env.NEXT_PUBLIC_PRIMARY_SALE_ADDRESS || "0xe4fdffb247e5D4a2E5dCeeB4a05d526C17336D03", // PrimarySale Contract (ERC20)
    process.env.NEXT_PUBLIC_PRIMARY_SALE_NFT_ADDRESS || "0xe602280Ed991B01Ba253Cd738aFCFcF498c31943", // PrimarySaleNFT Contract (NFT)
  ];

  // Adresse à retirer de la whitelist
  const addressesToUnwhitelist = [
    "0x17e08dD6C3b78cB618Db025EA3d4868180bb3550"
  ];
  // ============================================
  // UNWHITELIST OPERATIONS
  // ============================================

  if (addressesToUnwhitelist.length > 0) {
    await removeFromWhitelist(kycAddress, addressesToUnwhitelist);
  }

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
