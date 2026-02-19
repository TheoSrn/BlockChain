import { ethers } from "hardhat";

/**
 * Script pour mint des tokens de test avec 18 decimals
 * Les contrats TestERC20 utilisent 18 decimals par défaut
 */

async function main() {
  console.log("💰 Minting Test Tokens (18 decimals)...\n");

  const [signer] = await ethers.getSigners();
  const recipient = signer.address;

  console.log("Recipient:", recipient);

  // Adresses de tes tokens déployés
  const USDC_ADDRESS = "0x461Ca34a940680c2e34E6928F54BF38D0a29C494";
  const USDT_ADDRESS = "0xf7d3677312e147c857e596583eB31185cf2b70e9";

  const TestERC20 = await ethers.getContractFactory("TestERC20");

  // Mint USDC (18 decimals car TestERC20 utilise 18 par défaut)
  console.log("\n💵 Minting USDC...");
  const usdc = TestERC20.attach(USDC_ADDRESS);
  const usdcAmount = ethers.parseUnits("10000", 18); // 10,000 USDC avec 18 decimals
  const txUsdc = await usdc.mint(recipient, usdcAmount);
  console.log("⏳ Waiting for confirmation...");
  await txUsdc.wait();
  console.log(`✅ Minted 10,000 USDC to ${recipient}`);
  console.log(`   Tx: ${txUsdc.hash}`);

  // Mint USDT (18 decimals)
  console.log("\n💵 Minting USDT...");
  const usdt = TestERC20.attach(USDT_ADDRESS);
  const usdtAmount = ethers.parseUnits("10000", 18); // 10,000 USDT avec 18 decimals
  const txUsdt = await usdt.mint(recipient, usdtAmount);
  console.log("⏳ Waiting for confirmation...");
  await txUsdt.wait();
  console.log(`✅ Minted 10,000 USDT to ${recipient}`);
  console.log(`   Tx: ${txUsdt.hash}`);

  console.log("\n🎉 Done! You now have 10,000 USDC + 10,000 USDT!");
  console.log("\n📊 Summary:");
  console.log(`   USDC: 10,000 tokens (${usdcAmount.toString()} raw with 18 decimals)`);
  console.log(`   USDT: 10,000 tokens (${usdtAmount.toString()} raw with 18 decimals)`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
