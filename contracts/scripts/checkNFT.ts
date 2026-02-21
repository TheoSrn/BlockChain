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
  const ASSET_NFT_ADDRESS = "0x7556d10A2Ad67c102304167074ABa53dbF52503D";
  const TOKEN_ID = 4;

  console.log("══════════════════════════════════════════════════════");
  console.log("🔍 NFT TOKEN ID #4 INVESTIGATION");
  console.log("══════════════════════════════════════════════════════");
  console.log(`NFT Contract: ${ASSET_NFT_ADDRESS}`);
  console.log(`Token ID: ${TOKEN_ID}\n`);

  const assetNFT = await ethers.getContractAt("AssetNFT", ASSET_NFT_ADDRESS);

  // 1. Check current owner
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("👤 CURRENT OWNERSHIP");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const currentOwner = await assetNFT.ownerOf(TOKEN_ID);
    console.log(`Current Owner: ${currentOwner}`);
    
    const addresses = {
      "0xA24a49D62C3Dc81a9BADC056dc69a1B386593FcF": "Admin Wallet (0xA24a...)",
      "0x17e08dD6C3b78cB618Db025EA3d4868180bb3550": "Your Wallet (0x17e...)",
    };
    
    if (addresses[currentOwner]) {
      console.log(`Identified as: ${addresses[currentOwner]}`);
    }
  } catch (err: any) {
    console.log("❌ Token does not exist or error:", err.message);
    return;
  }

  // 2. Get token URI and metadata
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📄 NFT METADATA");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const tokenURI = await assetNFT.tokenURI(TOKEN_ID);
    console.log(`Token URI: ${tokenURI}`);
  } catch (err) {
    console.log("Token URI: Not available or error");
  }

  // Try to get metadata if function exists
  try {
    // Check if getMetadata exists by trying the call
    const metadata = await assetNFT.getMetadata(TOKEN_ID);
    console.log(`Name: ${metadata.name}`);
    console.log(`Symbol: ${metadata.symbol}`);
    console.log(`Documents: ${metadata.documents}`);
  } catch (err) {
    console.log("Extended metadata: Not available (old contract version)");
  }

  // 3. Get transfer history from events
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📜 TRANSFER HISTORY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Get Transfer events for this token ID
  const transferEventSignature = ethers.id("Transfer(address,address,uint256)");
  
  try {
    const currentBlock = await ethers.provider.getBlockNumber();
    const fromBlock = currentBlock - 50000; // Last ~50k blocks (~1 week on Sepolia)
    
    console.log(`Scanning blocks ${fromBlock} to ${currentBlock}...\n`);
    
    const filter = {
      address: ASSET_NFT_ADDRESS,
      topics: [
        transferEventSignature,
        null, // from (any)
        null, // to (any)
        ethers.zeroPadValue(ethers.toBeHex(TOKEN_ID), 32) // tokenId
      ],
      fromBlock: fromBlock,
      toBlock: currentBlock
    };

    const logs = await ethers.provider.getLogs(filter);
    
    if (logs.length === 0) {
      console.log("⚠️  No transfer events found in recent blocks");
      console.log("   (The NFT might have been minted earlier or on a different network)");
    } else {
      console.log(`Found ${logs.length} transfer(s):\n`);
      
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        const block = await ethers.provider.getBlock(log.blockNumber);
        const timestamp = block ? new Date(Number(block.timestamp) * 1000).toLocaleString() : "Unknown";
        
        // Decode the log
        const iface = new ethers.Interface([
          "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
        ]);
        const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
        
        if (parsed) {
          console.log(`Transfer #${i + 1}:`);
          console.log(`  From: ${parsed.args.from}`);
          console.log(`  To: ${parsed.args.to}`);
          console.log(`  Block: ${log.blockNumber}`);
          console.log(`  Tx Hash: ${log.transactionHash}`);
          console.log(`  Time: ${timestamp}`);
          console.log();
        }
      }
    }
  } catch (err: any) {
    console.log("❌ Error fetching transfer history:", err.message);
  }

  // 4. Check if there are any pending orders for this NFT
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 PENDING ORDERS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const PRIMARY_SALE_NFT_ADDRESS = env["NEXT_PUBLIC_PRIMARY_SALE_NFT_ADDRESS"];
  
  if (PRIMARY_SALE_NFT_ADDRESS) {
    try {
      const primarySaleNFT = await ethers.getContractAt("PrimarySaleNFT", PRIMARY_SALE_NFT_ADDRESS);
      const orderIdCounter = await primarySaleNFT.orderIdCounter();
      
      let foundOrders = false;
      
      for (let i = 1n; i < orderIdCounter; i++) {
        try {
          const order = await primarySaleNFT.buyOrders(i);
          
          if (order.assetToken.toLowerCase() === ASSET_NFT_ADDRESS.toLowerCase() &&
              order.tokenId.toString() === TOKEN_ID.toString() &&
              order.pending) {
            foundOrders = true;
            console.log(`\nOrder #${i}:`);
            console.log(`  Buyer: ${order.buyer}`);
            console.log(`  Seller: ${order.seller}`);
            console.log(`  Price: ${ethers.formatUnits(order.price, 6)} (assuming USDC/USDT)`);
            console.log(`  Status: PENDING`);
            
            const currentOwner = await assetNFT.ownerOf(TOKEN_ID);
            if (currentOwner.toLowerCase() === order.seller.toLowerCase()) {
              console.log(`  ✅ Seller still owns the NFT`);
            } else {
              console.log(`  ❌ WARNING: Seller no longer owns the NFT!`);
              console.log(`     Current owner: ${currentOwner}`);
            }
          }
        } catch (err) {
          // Skip invalid orders
        }
      }
      
      if (!foundOrders) {
        console.log("\n  ℹ️  No pending orders for this NFT");
      }
    } catch (err: any) {
      console.log("\n❌ Error checking orders:", err.message);
    }
  }

  // 5. Check associated ERC20 token
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🏢 ASSOCIATED ASSET (ERC20)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const FACTORY_ADDRESS = env["NEXT_PUBLIC_ASSET_FACTORY_ADDRESS"];
  
  if (FACTORY_ADDRESS) {
    try {
      const factory = await ethers.getContractAt("Factory", FACTORY_ADDRESS);
      const assetCount = Number(await factory.assetCount());
      
      // Token ID corresponds to asset ID in Factory
      if (TOKEN_ID <= assetCount) {
        const record = await factory.getAsset(TOKEN_ID);
        console.log(`\nAsset #${TOKEN_ID}:`);
        console.log(`  Name: ${record.name}`);
        console.log(`  Symbol: ${record.symbol}`);
        console.log(`  ERC20 Token: ${record.token}`);
        console.log(`  NFT Token: ${record.nftToken}`);
        console.log(`  Asset Type: ${record.assetType === 0 ? "DIVISIBLE" : "UNIQUE"}`);
        
        // Check who owns the ERC20 tokens
        const erc20 = await ethers.getContractAt("AssetERC20", record.token);
        const totalSupply = await erc20.totalSupply();
        const decimals = await erc20.decimals();
        
        console.log(`\n  ERC20 Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${record.symbol}`);
        
        // Check ownership distribution
        const adminBalance = await erc20.balanceOf("0xA24a49D62C3Dc81a9BADC056dc69a1B386593FcF");
        const yourBalance = await erc20.balanceOf("0x17e08dD6C3b78cB618Db025EA3d4868180bb3550");
        
        console.log(`\n  ERC20 Ownership:`);
        console.log(`    Admin (0xA24a...): ${ethers.formatUnits(adminBalance, decimals)} ${record.symbol}`);
        console.log(`    Your Wallet (0x17e...): ${ethers.formatUnits(yourBalance, decimals)} ${record.symbol}`);
      } else {
        console.log(`\n  ⚠️  Token ID ${TOKEN_ID} exceeds asset count (${assetCount})`);
      }
    } catch (err: any) {
      console.log("\n❌ Error checking factory:", err.message);
    }
  }

  console.log("\n══════════════════════════════════════════════════════");
  console.log("✅ INVESTIGATION COMPLETE");
  console.log("══════════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
