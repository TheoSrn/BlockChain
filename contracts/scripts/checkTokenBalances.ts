import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

function readEnvLocal(): Record<string, string> {
  const envPath = path.join(__dirname, "../../frontend/.env.local");
  const content = fs.readFileSync(envPath, "utf-8");
  const vars: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

async function main() {
  const env = readEnvLocal();
  
  // Adresses à vérifier
  const ADMIN_ADDRESS = "0xA24a49D62C3Dc81a9BADC056dc69a1B386593FcF";
  const USER_ADDRESS = "0x17e08dD6C3b78cB618Db025EA3d4868180bb3550";
  
  const USDC_ADDRESS = env["NEXT_PUBLIC_USDC_ADDRESS"];
  const USDT_ADDRESS = env["NEXT_PUBLIC_USDT_ADDRESS"];
  const WETH_ADDRESS = env["NEXT_PUBLIC_WETH_ADDRESS"];

  console.log("══════════════════════════════════════════════════════");
  console.log("💰 TOKEN BALANCES CHECK");
  console.log("══════════════════════════════════════════════════════\n");

  const tokens = [
    { name: "USDC", address: USDC_ADDRESS },
    { name: "USDT", address: USDT_ADDRESS },
    { name: "WETH", address: WETH_ADDRESS },
  ];

  for (const token of tokens) {
    if (!token.address) {
      console.log(`⚠️  ${token.name}: Address not found in .env.local\n`);
      continue;
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`${token.name} (${token.address})`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      const tokenContract = await ethers.getContractAt("TestERC20", token.address);
      const decimals = await tokenContract.decimals();
      const totalSupply = await tokenContract.totalSupply();
      
      const adminBalance = await tokenContract.balanceOf(ADMIN_ADDRESS);
      const userBalance = await tokenContract.balanceOf(USER_ADDRESS);

      console.log(`Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${token.name}`);
      console.log(`\nBalances:`);
      console.log(`  Admin (0xA24a...): ${ethers.formatUnits(adminBalance, decimals)} ${token.name}`);
      console.log(`  User  (0x17e0...): ${ethers.formatUnits(userBalance, decimals)} ${token.name}`);
      
      if (adminBalance === totalSupply) {
        console.log(`\n  ℹ️  Admin holds 100% of supply (minted during deployment)`);
      }
      
      console.log();
    } catch (err: any) {
      console.log(`❌ Error: ${err.message}\n`);
    }
  }

  console.log("══════════════════════════════════════════════════════");
  console.log("ℹ️  EXPLANATION");
  console.log("══════════════════════════════════════════════════════");
  console.log("During deployment, test tokens are minted to the deployer");
  console.log("address (0xA24a49D62C3Dc81a9BADC056dc69a1B386593FcF).");
  console.log("\nIf you're connecting with a different wallet in the frontend,");
  console.log("you need to transfer some tokens to that wallet first.");
  console.log("\nOr connect with the admin wallet to access all tokens.");
  console.log("══════════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
