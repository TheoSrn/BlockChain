import { ethers } from "hardhat";

/**
 * Script pour wrapper ETH en WETH sur Sepolia
 * WETH = Wrapped ETH (1 ETH = 1 WETH)
 */

async function main() {
  console.log("🔄 Wrapping ETH to WETH on Sepolia...\n");

  const [signer] = await ethers.getSigners();
  console.log("Wallet:", signer.address);

  // Adresse officielle WETH sur Sepolia
  const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

  // ABI minimal pour WETH (deposit et withdraw)
  const WETH_ABI = [
    "function deposit() public payable",
    "function withdraw(uint256 wad) public",
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  const weth = new ethers.Contract(WETH_ADDRESS, WETH_ABI, signer);

  // Vérifier le solde ETH
  const ethBalance = await ethers.provider.getBalance(signer.address);
  console.log(`ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

  // Vérifier le solde WETH actuel
  const wethBalanceBefore = await weth.balanceOf(signer.address);
  console.log(`WETH Balance (before): ${ethers.formatEther(wethBalanceBefore)} WETH\n`);

  // Wrapper 0.05 ETH en WETH (laisse de la marge pour gas)
  const amountToWrap = ethers.parseEther("0.05"); // 0.05 ETH
  console.log(`💰 Wrapping ${ethers.formatEther(amountToWrap)} ETH to WETH...`);

  const tx = await weth.deposit({ value: amountToWrap });
  console.log(`⏳ Transaction sent: ${tx.hash}`);
  
  const receipt = await tx.wait();
  console.log(`✅ Transaction confirmed in block ${receipt?.blockNumber}\n`);

  // Vérifier le nouveau solde WETH
  const wethBalanceAfter = await weth.balanceOf(signer.address);
  console.log(`WETH Balance (after): ${ethers.formatEther(wethBalanceAfter)} WETH`);
  console.log(`\n🎉 Successfully wrapped ETH to WETH!`);
  console.log(`\nWETH Contract: ${WETH_ADDRESS}`);
  console.log(`View on Etherscan: https://sepolia.etherscan.io/address/${WETH_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
