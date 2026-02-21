import { ethers } from "hardhat";

async function main() {
  console.log("💰 Checking Token Balances...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer Address:", deployer.address);
  console.log("═".repeat(60));

  // Token addresses from deployment
  const USDC_ADDRESS = "0x9b4E8F2508746a1b46b8775e11df7b7fFCBEf1b5";
  const USDT_ADDRESS = "0x2C38995a58A2D1dCAC75479191fbf8E74776481B";
  const WETH_ADDRESS = "0x378e9e822134C64ccCCE6F7A5C4CCf06762BDE81";

  const ERC20_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)"
  ];

  // Check balances for each token
  const tokens = [
    { name: "USDC", address: USDC_ADDRESS },
    { name: "USDT", address: USDT_ADDRESS },
    { name: "WETH", address: WETH_ADDRESS }
  ];

  console.log("\n📊 Deployer Token Balances:\n");
  
  for (const token of tokens) {
    const tokenContract = new ethers.Contract(token.address, ERC20_ABI, deployer);
    
    const balance = await tokenContract.balanceOf(deployer.address);
    const totalSupply = await tokenContract.totalSupply();
    const symbol = await tokenContract.symbol();
    
    const balanceFormatted = ethers.formatUnits(balance, 18);
    const totalSupplyFormatted = ethers.formatUnits(totalSupply, 18);
    
    console.log(`${symbol}:`);
    console.log(`  Balance:      ${balanceFormatted} ${symbol}`);
    console.log(`  Total Supply: ${totalSupplyFormatted} ${symbol}`);
    console.log(`  Contract:     ${token.address}`);
    console.log();
  }

  // Get ETH balance too
  const ethBalance = await ethers.provider.getBalance(deployer.address);
  const ethBalanceFormatted = ethers.formatEther(ethBalance);
  console.log(`Sepolia ETH: ${ethBalanceFormatted} ETH`);
  
  console.log("\n" + "═".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
