import { ethers } from "hardhat";

/**
 * Script pour mint des tokens de test (USDC/USDT)
 * 100% GRATUIT - juste les gas fees
 */

async function main() {
  console.log("💰 Minting Test Tokens...\n");

  const [signer] = await ethers.getSigners();
  const recipient = signer.address;

  console.log("Recipient:", recipient);

  // Adresses de tes tokens déployés
  const USDC_ADDRESS = "0x461Ca34a940680c2e34E6928F54BF38D0a29C494";
  const USDT_ADDRESS = "0xf7d3677312e147c857e596583eB31185cf2b70e9";

  const TestERC20 = await ethers.getContractFactory("TestERC20");

  // Mint USDC (6 decimals)
  console.log("\n💵 Minting USDC...");
  const usdc = TestERC20.attach(USDC_ADDRESS);
  const usdcAmount = ethers.parseUnits("10000", 6); // 10,000 USDC
  const txUsdc = await usdc.mint(recipient, usdcAmount);
  await txUsdc.wait();
  console.log(`✅ Minted 10,000 USDC to ${recipient}`);
  console.log(`   Tx: ${txUsdc.hash}`);

  // Mint USDT (6 decimals)
  console.log("\n💵 Minting USDT...");
  const usdt = TestERC20.attach(USDT_ADDRESS);
  const usdtAmount = ethers.parseUnits("10000", 6); // 10,000 USDT
  const txUsdt = await usdt.mint(recipient, usdtAmount);
  await txUsdt.wait();
  console.log(`✅ Minted 10,000 USDT to ${recipient}`);
  console.log(`   Tx: ${txUsdt.hash}`);

  console.log("\n🎉 Done! You now have free test tokens!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
