import { ethers } from "hardhat";

/**
 * Script pour transférer de l'ETH à un compte
 * Usage: npx hardhat run scripts/fundAccount.ts --network localhost
 */

async function main() {
  console.log("💰 Funding account with ETH...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Sending from:", deployer.address);

  // Adresse à financer
  const targetAddress = "0x17e08dD6C3b78cB618Db025EA3d4868180bb3550";
  
  console.log("Target address:", targetAddress);
  console.log("");

  // Vérifier la balance avant
  const balanceBefore = await ethers.provider.getBalance(targetAddress);
  console.log("Balance before:", ethers.formatEther(balanceBefore), "ETH");

  // Transférer 10 ETH
  const ethAmount = ethers.parseEther("10");
  
  try {
    const tx = await deployer.sendTransaction({
      to: targetAddress,
      value: ethAmount,
    });

    console.log("Transaction hash:", tx.hash);
    await tx.wait();

    // Vérifier la nouvelle balance
    const balanceAfter = await ethers.provider.getBalance(targetAddress);
    console.log("\n✅ Transfer successful!");
    console.log("New balance:", ethers.formatEther(balanceAfter), "ETH");
  } catch (error) {
    console.error("❌ Error transferring ETH:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
