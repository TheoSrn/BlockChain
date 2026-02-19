import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const FACTORY_ADDRESS = "0xfC3a627F295A4b60aF8d77ee4d69bDF58FDd1d0c";
  
  console.log("Votre adresse:", deployer.address);
  console.log("Factory address:", FACTORY_ADDRESS);
  
  const Factory = await ethers.getContractAt("Factory", FACTORY_ADDRESS);
  
  // Vérifie les rôles
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash; // 0x00...00
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  
  console.log("\n📋 Vérification des rôles:");
  console.log("DEFAULT_ADMIN_ROLE pour votre compte:", await Factory.hasRole(DEFAULT_ADMIN_ROLE, deployer.address));
  console.log("ADMIN_ROLE pour votre compte:", await Factory.hasRole(ADMIN_ROLE, deployer.address));
  
  // Récupère l'admin configuré
  const adminAddress = await Factory.admin();
  console.log("\n👤 Admin configuré dans le contrat:", adminAddress);
  console.log("C'est votre adresse?", adminAddress.toLowerCase() === deployer.address.toLowerCase());
}

main().then(() => process.exit(0)).catch(console.error);
