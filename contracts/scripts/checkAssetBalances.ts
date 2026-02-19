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
  const factoryAddress = env["NEXT_PUBLIC_ASSET_FACTORY_ADDRESS"];
  if (!factoryAddress) throw new Error("NEXT_PUBLIC_ASSET_FACTORY_ADDRESS not found in .env.local");

  const MAIN_WALLET = "0xA24a49D62C3Dc81a9BADC056dc69a1B386593FcF";

  console.log("📋 Checking asset balances for main wallet");
  console.log("   Wallet  :", MAIN_WALLET);
  console.log("   Factory :", factoryAddress);
  console.log("");

  const factory = await ethers.getContractAt("Factory", factoryAddress);
  const assetCount = Number(await factory.assetCount());

  if (assetCount === 0) {
    console.log("⚠️  No assets found in the factory.");
    return;
  }

  console.log(`Found ${assetCount} asset(s):\n`);

  for (let i = 1; i <= assetCount; i++) {
    const record = await factory.getAsset(i);
    const token = await ethers.getContractAt("AssetERC20", record.token);

    const balance = await token.balanceOf(MAIN_WALLET);
    const totalSupply = await token.totalSupply();
    const decimals = await token.decimals();

    const balanceFormatted = ethers.formatUnits(balance, decimals);
    const supplyFormatted = ethers.formatUnits(totalSupply, decimals);
    const pct =
      totalSupply > 0n
        ? ((balance * 10000n) / totalSupply).toString()
        : "0";
    const pctFormatted = (Number(pct) / 100).toFixed(2);

    console.log(`Asset #${i}: ${record.name} (${record.symbol})`);
    console.log(`   Token address : ${record.token}`);
    console.log(`   Balance       : ${balanceFormatted} ${record.symbol}`);
    console.log(`   Total supply  : ${supplyFormatted} ${record.symbol}`);
    console.log(`   Ownership     : ${pctFormatted}%`);
    if (balance === totalSupply) {
      console.log(`   ✅ Main wallet holds 100% of the supply`);
    } else {
      console.log(`   ℹ️  Main wallet holds ${pctFormatted}% of the supply`);
    }
    console.log("");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
