import { ethers } from "hardhat";

async function main() {
  console.log("💎 Checking OLD WETH Balance...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer Address:", deployer.address);
  console.log("═".repeat(60));

  // OLD WETH address
  const OLD_WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

  const ERC20_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function owner() view returns (address)"
  ];

  const weth = new ethers.Contract(OLD_WETH_ADDRESS, ERC20_ABI, deployer);
  
  try {
    const name = await weth.name();
    const symbol = await weth.symbol();
    const totalSupply = await weth.totalSupply();
    const balance = await weth.balanceOf(deployer.address);
    
    const balanceFormatted = ethers.formatUnits(balance, 18);
    const totalSupplyFormatted = ethers.formatUnits(totalSupply, 18);
    
    console.log("\n📊 OLD WETH Contract Info:\n");
    console.log(`Name:         ${name}`);
    console.log(`Symbol:       ${symbol}`);
    console.log(`Contract:     ${OLD_WETH_ADDRESS}`);
    console.log(`Total Supply: ${totalSupplyFormatted} ${symbol}`);
    console.log(`Your Balance: ${balanceFormatted} ${symbol}`);
    
    try {
      const owner = await weth.owner();
      console.log(`Owner:        ${owner}`);
      console.log(`You are owner: ${owner.toLowerCase() === deployer.address.toLowerCase() ? "✅ YES" : "❌ NO"}`);
    } catch (e) {
      console.log("Owner:        (contract doesn't have owner() function)");
    }
    
    console.log("\n✅ L'ancien contrat WETH est toujours actif!");
    console.log("✅ .env.local a été mis à jour pour utiliser cette adresse");
    console.log("\n⚠️  Redémarrez le frontend pour utiliser l'ancien WETH:");
    console.log("   cd frontend && npm run dev");
    
  } catch (error) {
    console.error("❌ Error reading OLD WETH contract:", error);
  }
  
  console.log("\n" + "═".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
