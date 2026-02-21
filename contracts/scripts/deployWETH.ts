import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Deploying WETH Test Token on Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const TestTokenFactory = await ethers.getContractFactory("TestERC20");
  
  // Deploy WETH with 18 decimals (1 million initial supply)
  const weth = await TestTokenFactory.deploy(
    "Wrapped Ether",
    "WETH",
    ethers.parseUnits("1000000", 18), // 1M WETH with 18 decimals
    deployer.address
  );
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();

  console.log("✅ WETH deployed at:", wethAddress);
  console.log("   Initial supply: 1,000,000 WETH (18 decimals)");
  console.log("   Owner:", deployer.address);

  // Update .env.local file
  const envPath = path.join(__dirname, "../../frontend/.env.local");
  let envContent = fs.readFileSync(envPath, "utf-8");
  
  // Check if WETH line already exists
  if (envContent.includes("NEXT_PUBLIC_WETH_ADDRESS=")) {
    // Replace existing line
    envContent = envContent.replace(
      /NEXT_PUBLIC_WETH_ADDRESS=.*/,
      `NEXT_PUBLIC_WETH_ADDRESS=${wethAddress}`
    );
    console.log("\n✅ Updated NEXT_PUBLIC_WETH_ADDRESS in .env.local");
  } else {
    // Add new line after USDT
    envContent = envContent.replace(
      /(NEXT_PUBLIC_USDT_ADDRESS=.*)/,
      `$1\nNEXT_PUBLIC_WETH_ADDRESS=${wethAddress}`
    );
    console.log("\n✅ Added NEXT_PUBLIC_WETH_ADDRESS to .env.local");
  }
  
  fs.writeFileSync(envPath, envContent);

  console.log("\n📝 Environment variable:");
  console.log(`NEXT_PUBLIC_WETH_ADDRESS=${wethAddress}`);
  
  console.log("\n✨ WETH deployment complete!");
  console.log("⚠️  Remember to restart your frontend server to load the new address.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
