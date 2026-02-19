import { ethers } from "hardhat";

/**
 * Script pour donner le rôle ADMIN_ROLE sur le Factory à une adresse
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Exécution avec le compte:", deployer.address);

  // Adresse du Factory déployé sur Sepolia
  const FACTORY_ADDRESS = "0xfC3a627F295A4b60aF8d77ee4d69bDF58FDd1d0c";
  
  // Adresse à qui donner le rôle (votre wallet)
  const NEW_ADMIN = deployer.address; // Utilisez votre adresse ici
  
  console.log("Factory address:", FACTORY_ADDRESS);
  console.log("Nouvelle adresse admin:", NEW_ADMIN);

  // Récupérer le contrat Factory
  const Factory = await ethers.getContractAt("Factory", FACTORY_ADDRESS);

  // Le rôle ADMIN_ROLE
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  
  console.log("\n1. Vérification du rôle actuel...");
  const hasRole = await Factory.hasRole(ADMIN_ROLE, NEW_ADMIN);
  console.log(`   ${NEW_ADMIN} a le rôle ADMIN_ROLE:`, hasRole);

  if (!hasRole) {
    console.log("\n2. Attribution du rôle ADMIN_ROLE...");
    const tx = await Factory.grantRole(ADMIN_ROLE, NEW_ADMIN);
    console.log("   Transaction envoyée:", tx.hash);
    
    await tx.wait();
    console.log("   ✅ Rôle attribué avec succès!");
    
    // Vérification
    const hasRoleAfter = await Factory.hasRole(ADMIN_ROLE, NEW_ADMIN);
    console.log("   Vérification:", hasRoleAfter);
  } else {
    console.log("   ✅ L'adresse a déjà le rôle ADMIN_ROLE");
  }

  console.log("\n✅ Terminé! Vous pouvez maintenant créer des actifs.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
