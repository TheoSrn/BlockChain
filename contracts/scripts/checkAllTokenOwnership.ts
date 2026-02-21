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
  
  // Wallets
  const ADMIN_ADDRESS = "0xA24a49D62C3Dc81a9BADC056dc69a1B386593FcF";
  const USER_ADDRESS = "0x17e08dD6C3b78cB618Db025EA3d4868180bb3550";
  
  // Test tokens
  const USDC_ADDRESS = env["NEXT_PUBLIC_USDC_ADDRESS"];
  const USDT_ADDRESS = env["NEXT_PUBLIC_USDT_ADDRESS"];
  const WETH_ADDRESS = env["NEXT_PUBLIC_WETH_ADDRESS"];
  
  // Factory
  const FACTORY_ADDRESS = env["NEXT_PUBLIC_ASSET_FACTORY_ADDRESS"];

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║         🏦 COMPREHENSIVE TOKEN OWNERSHIP             ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  console.log("👥 Wallets:");
  console.log(`   Admin: ${ADMIN_ADDRESS}`);
  console.log(`   User:  ${USER_ADDRESS}\n`);

  // ==================== TEST TOKENS ====================
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║              💵 TEST TOKENS (USDC, USDT, WETH)      ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  const testTokens = [
    { name: "USDC", address: USDC_ADDRESS },
    { name: "USDT", address: USDT_ADDRESS },
    { name: "WETH", address: WETH_ADDRESS },
  ];

  for (const token of testTokens) {
    if (!token.address) {
      console.log(`⚠️  ${token.name}: Address not found\n`);
      continue;
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`${token.name} - ${token.address}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      const tokenContract = await ethers.getContractAt("TestERC20", token.address);
      const decimals = await tokenContract.decimals();
      const totalSupply = await tokenContract.totalSupply();
      
      const adminBalance = await tokenContract.balanceOf(ADMIN_ADDRESS);
      const userBalance = await tokenContract.balanceOf(USER_ADDRESS);

      const adminFormatted = ethers.formatUnits(adminBalance, decimals);
      const userFormatted = ethers.formatUnits(userBalance, decimals);
      const supplyFormatted = ethers.formatUnits(totalSupply, decimals);

      console.log(`Total Supply: ${supplyFormatted} ${token.name}\n`);
      console.log(`  👤 Admin: ${adminFormatted} ${token.name} ${adminBalance > 0n ? '✅' : '❌'}`);
      console.log(`  👤 User:  ${userFormatted} ${token.name} ${userBalance > 0n ? '✅' : '❌'}`);
      
      if (adminBalance + userBalance !== totalSupply) {
        const diff = totalSupply - adminBalance - userBalance;
        const diffFormatted = ethers.formatUnits(diff, decimals);
        console.log(`  ⚠️  Other: ${diffFormatted} ${token.name} (held elsewhere)`);
      }
      
      console.log();
    } catch (err: any) {
      console.log(`❌ Error: ${err.message}\n`);
    }
  }

  // ==================== ASSET TOKENS ====================
  if (!FACTORY_ADDRESS) {
    console.log("⚠️  Factory address not found in .env.local");
    return;
  }

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║         🏢 ASSET TOKENS (Created via Factory)       ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  console.log(`Factory: ${FACTORY_ADDRESS}\n`);

  try {
    const factory = await ethers.getContractAt("Factory", FACTORY_ADDRESS);
    const assetCount = Number(await factory.assetCount());

    if (assetCount === 0) {
      console.log("⚠️  No assets found in the factory.\n");
      return;
    }

    console.log(`Found ${assetCount} asset(s):\n`);

    for (let i = 1; i <= assetCount; i++) {
      const record = await factory.getAsset(i);
      const token = await ethers.getContractAt("AssetERC20", record.token);

      const totalSupply = await token.totalSupply();
      const decimals = await token.decimals();
      const adminBalance = await token.balanceOf(ADMIN_ADDRESS);
      const userBalance = await token.balanceOf(USER_ADDRESS);

      const adminFormatted = ethers.formatUnits(adminBalance, decimals);
      const userFormatted = ethers.formatUnits(userBalance, decimals);
      const supplyFormatted = ethers.formatUnits(totalSupply, decimals);

      const adminPct = totalSupply > 0n ? Number((adminBalance * 10000n) / totalSupply) / 100 : 0;
      const userPct = totalSupply > 0n ? Number((userBalance * 10000n) / totalSupply) / 100 : 0;

      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Asset #${i}: ${record.name} (${record.symbol})`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Token:        ${record.token}`);
      console.log(`NFT:          ${record.nft}`);
      console.log(`Total Supply: ${supplyFormatted} ${record.symbol}\n`);
      
      console.log(`  👤 Admin: ${adminFormatted} ${record.symbol} (${adminPct.toFixed(2)}%) ${adminBalance > 0n ? '✅' : '❌'}`);
      console.log(`  👤 User:  ${userFormatted} ${record.symbol} (${userPct.toFixed(2)}%) ${userBalance > 0n ? '✅' : '❌'}`);

      if (adminBalance + userBalance !== totalSupply) {
        const diff = totalSupply - adminBalance - userBalance;
        const diffFormatted = ethers.formatUnits(diff, decimals);
        const diffPct = totalSupply > 0n ? Number((diff * 10000n) / totalSupply) / 100 : 0;
        console.log(`  ⚠️  Other: ${diffFormatted} ${record.symbol} (${diffPct.toFixed(2)}%) - held elsewhere`);
      }

      // Check NFT ownership
      try {
        const nftContract = await ethers.getContractAt("AssetNFT", record.nft);
        const nftSupply = Number(await nftContract.totalSupply());
        
        if (nftSupply > 0) {
          console.log(`\n  🖼️  NFTs (${nftSupply} total):`);
          
          let adminNFTs: number[] = [];
          let userNFTs: number[] = [];
          let otherNFTs: number[] = [];
          
          for (let tokenId = 1; tokenId <= nftSupply; tokenId++) {
            try {
              const owner = await nftContract.ownerOf(tokenId);
              if (owner.toLowerCase() === ADMIN_ADDRESS.toLowerCase()) {
                adminNFTs.push(tokenId);
              } else if (owner.toLowerCase() === USER_ADDRESS.toLowerCase()) {
                userNFTs.push(tokenId);
              } else {
                otherNFTs.push(tokenId);
              }
            } catch {
              // NFT doesn't exist or is burned
            }
          }
          
          if (adminNFTs.length > 0) {
            console.log(`     Admin owns: #${adminNFTs.join(', #')}`);
          }
          if (userNFTs.length > 0) {
            console.log(`     User owns:  #${userNFTs.join(', #')}`);
          }
          if (otherNFTs.length > 0) {
            console.log(`     Others own: #${otherNFTs.join(', #')}`);
          }
        }
      } catch (err: any) {
        console.log(`\n  ⚠️  Could not check NFT ownership: ${err.message}`);
      }

      console.log();
    }
  } catch (err: any) {
    console.log(`❌ Error reading factory: ${err.message}\n`);
  }

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║                    📊 SUMMARY                        ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log("✅ = Has tokens");
  console.log("❌ = No tokens");
  console.log("⚠️  = Tokens held by other addresses\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
