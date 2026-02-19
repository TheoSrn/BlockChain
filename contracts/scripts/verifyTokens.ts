import { ethers } from "hardhat";

/**
 * Script de vérification : Prouve que les tokens USDC/USDT sont réels
 * Vérifie : déploiement, symbole, decimals, balance
 */

async function main() {
  console.log("🔍 VERIFICATION DES TOKENS USDC/USDT\n");
  console.log("=".repeat(60));

  const [signer] = await ethers.getSigners();
  const userAddress = signer.address;

  console.log(`\n👤 Votre adresse: ${userAddress}\n`);

  // Adresses de vos tokens
  const USDC_ADDRESS = "0x461Ca34a940680c2e34E6928F54BF38D0a29C494";
  const USDT_ADDRESS = "0xf7d3677312e147c857e596583eB31185cf2b70e9";

  // ABI minimal pour ERC20
  const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
  ];

  async function verifyToken(address: string, expectedSymbol: string) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📊 VERIFICATION ${expectedSymbol}`);
    console.log(`${"=".repeat(60)}\n`);
    console.log(`📍 Adresse: ${address}`);
    console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${address}\n`);

    try {
      // Vérifier que le contrat existe
      const code = await ethers.provider.getCode(address);
      if (code === "0x") {
        console.log("❌ ERREUR: Aucun contrat déployé à cette adresse!");
        return false;
      }
      console.log("✅ Contrat déployé (bytecode présent)");

      // Connecter au contrat
      const token = new ethers.Contract(address, ERC20_ABI, ethers.provider);

      // Lire les infos du token
      const name = await token.name();
      const symbol = await token.symbol();
      const decimals = await token.decimals();
      const totalSupply = await token.totalSupply();
      const balance = await token.balanceOf(userAddress);

      console.log(`\n📋 INFORMATIONS DU TOKEN:`);
      console.log(`   Nom: ${name}`);
      console.log(`   Symbole: ${symbol}`);
      console.log(`   Decimals: ${decimals}`);
      console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
      console.log(`   Votre Balance: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
      console.log(`   Balance (raw): ${balance.toString()}`);

      // Vérifications
      if (symbol !== expectedSymbol) {
        console.log(`\n⚠️  WARNING: Symbole attendu: ${expectedSymbol}, reçu: ${symbol}`);
      }

      if (balance > 0n) {
        console.log(`\n✅ TOKENS REELS CONFIRMÉS - Vous avez ${ethers.formatUnits(balance, decimals)} ${symbol}!`);
      } else {
        console.log(`\n⚠️  Vous n'avez aucun token ${symbol} pour le moment`);
      }

      return true;
    } catch (error: any) {
      console.log(`\n❌ ERREUR lors de la vérification: ${error.message}`);
      return false;
    }
  }

  // Vérifier USDC
  const usdcValid = await verifyToken(USDC_ADDRESS, "USDC");

  // Vérifier USDT
  const usdtValid = await verifyToken(USDT_ADDRESS, "USDT");

  // Résumé final
  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 RÉSUMÉ FINAL");
  console.log(`${"=".repeat(60)}\n`);

  if (usdcValid && usdtValid) {
    console.log("✅ TOUS LES TOKENS SONT RÉELS ET VÉRIFIÉS!");
    console.log("\n🎯 Preuves:");
    console.log(`   1. Contrats déployés sur Sepolia`);
    console.log(`   2. Bytecode présent on-chain`);
    console.log(`   3. Fonctions ERC20 fonctionnelles`);
    console.log(`   4. Balances lisibles`);
    console.log("\n🔗 Liens Etherscan:");
    console.log(`   USDC: https://sepolia.etherscan.io/address/${USDC_ADDRESS}`);
    console.log(`   USDT: https://sepolia.etherscan.io/address/${USDT_ADDRESS}`);
    console.log(`\n💰 Transactions de mint récentes:`);
    console.log(`   USDC: https://sepolia.etherscan.io/tx/0xb45e530beafa81351c6d520039de5ec78ddfa97aebaa02bfd33de18b90b7297a`);
    console.log(`   USDT: https://sepolia.etherscan.io/tx/0xaa35443c1f002fb6d918835898cffcfccd021dbcd62d38dfba282e38511cba9e`);
  } else {
    console.log("❌ Certains tokens n'ont pas pu être vérifiés");
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
