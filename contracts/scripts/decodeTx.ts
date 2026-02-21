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

const TX_HASH = "0xd31154e384d95cd24da4354a8f5f71ab2452c292e4b53534f089dd5375d142d6";

async function main() {
  const env = readEnvLocal();
  const PRIMARY_SALE_NFT_ADDRESS = env["NEXT_PUBLIC_PRIMARY_SALE_NFT_ADDRESS"];

  console.log("🔍 Decoding Transaction Details...\n");

  const provider = ethers.provider;
  const tx = await provider.getTransaction(TX_HASH);

  if (!tx) {
    console.log("❌ Transaction not found");
    return;
  }

  console.log("Transaction Hash:", TX_HASH);
  console.log("From:", tx.from);
  console.log("To:", tx.to);
  console.log("Value:", ethers.formatEther(tx.value), "ETH");
  console.log("\n" + "=".repeat(80));

  // Decode input data
  const inputData = tx.data;
  console.log("\n📋 Input Data:", inputData);

  // Check function signatures
  const acceptBuyOrderSig = ethers.id("acceptBuyOrder(uint256)").substring(0, 10);
  const createBuyOrderSig = ethers.id("createBuyOrder(address,uint256,address,address,uint256)").substring(0, 10);
  
  console.log("\nacceptBuyOrder signature:", acceptBuyOrderSig);
  console.log("createBuyOrder signature:", createBuyOrderSig);
  console.log("Actual function signature:", inputData.substring(0, 10));

  if (inputData.startsWith(createBuyOrderSig)) {
    console.log("✅ This is a createBuyOrder call\n");
    
    // Decode the parameters
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const decodedParams = abiCoder.decode(
      ['address', 'uint256', 'address', 'address', 'uint256'],
      '0x' + inputData.substring(10)
    );
    
    const [assetToken, tokenId, seller, paymentToken, price] = decodedParams;
    console.log("📝 createBuyOrder Parameters:");
    console.log("  Asset Token (NFT):", assetToken);
    console.log("  Token ID:", tokenId.toString());
    console.log("  Seller:", seller);
    console.log("  Payment Token:", paymentToken);
    console.log("  Price:", ethers.formatUnits(price, 6), "(assuming 6 decimals)");
    console.log("\n" + "=".repeat(80));

    // Check current NFT owner
    console.log("\n🔍 Checking NFT Ownership & Why Transaction Failed...\n");
    
    try {
      const assetNFT = await ethers.getContractAt("AssetNFT", assetToken);
      const currentOwner = await assetNFT.ownerOf(tokenId);
      
      console.log("Current Owner of Token ID", tokenId.toString() + ":", currentOwner);
      console.log("Expected Seller:", seller);
      console.log("Buyer (tx.from):", tx.from);
      
      if (currentOwner.toLowerCase() === seller.toLowerCase()) {
        console.log("✅ Seller owns the NFT");
      } else {
        console.log("❌ SELLER DOES NOT OWN THE NFT!");
        console.log("   Current owner:", currentOwner);
        console.log("   Expected seller:", seller);
      }

      // Get NFT metadata
      const metadata = await assetNFT.getMetadata(tokenId);
      console.log("\nNFT Metadata:");
      console.log("  Name:", metadata.name);
      console.log("  Symbol:", metadata.symbol);
      console.log("  Documents:", metadata.documents);

      // Check buyer's payment token balance
      console.log("\n💰 Checking Buyer's Payment Token Balance...\n");
      const paymentTokenContract = await ethers.getContractAt("TestERC20", paymentToken);
      const buyerBalance = await paymentTokenContract.balanceOf(tx.from);
      const symbol = await paymentTokenContract.symbol();
      const decimals = await paymentTokenContract.decimals();
      
      console.log("Payment Token:", symbol);
      console.log("Buyer Balance:", ethers.formatUnits(buyerBalance, decimals), symbol);
      console.log("Required Price:", ethers.formatUnits(price, decimals), symbol);
      
      if (buyerBalance >= price) {
        console.log("✅ Buyer has sufficient balance");
        
        // Check allowance
        const allowance = await paymentTokenContract.allowance(tx.from, PRIMARY_SALE_NFT_ADDRESS!);
        console.log("Allowance:", ethers.formatUnits(allowance, decimals), symbol);
        
        if (allowance >= price) {
          console.log("✅ Buyer has sufficient allowance");
        } else {
          console.log("❌ INSUFFICIENT ALLOWANCE!");
        }
      } else {
        console.log("❌ INSUFFICIENT BALANCE!");
      }
      
    } catch (err: any) {
      console.log("❌ Error checking NFT:", err.message);
    }

  } else if (inputData.startsWith(acceptBuyOrderSig)) {
    console.log("✅ This is an acceptBuyOrder call\n");
    
    // Decode the orderId parameter
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const decodedParams = abiCoder.decode(
      ['uint256'],
      '0x' + inputData.substring(10)
    );
    
    const orderId = decodedParams[0];
    console.log("📝 Order ID:", orderId.toString());
    console.log("\n" + "=".repeat(80));

    // Now fetch the order details from PrimarySaleNFT
    if (PRIMARY_SALE_NFT_ADDRESS) {
      console.log("\n🔍 Fetching Order Details from PrimarySaleNFT...\n");
      const primarySaleNFT = await ethers.getContractAt("PrimarySaleNFT", PRIMARY_SALE_NFT_ADDRESS);
      
      try {
        const order = await primarySaleNFT.buyOrders(orderId);
        
        console.log("Order Details:");
        console.log("  Order ID:", order.orderId.toString());
        console.log("  Buyer:", order.buyer);
        console.log("  Seller:", order.seller);
        console.log("  Asset Token (NFT):", order.assetToken);
        console.log("  Token ID:", order.tokenId.toString());
        console.log("  Payment Token:", order.paymentToken);
        console.log("  Price:", ethers.formatUnits(order.price, 6), "(assuming 6 decimals)");
        console.log("  Pending:", order.pending);
        console.log("  Timestamp:", new Date(Number(order.timestamp) * 1000).toISOString());
        
        console.log("\n" + "=".repeat(80));
        
        // Check current NFT owner
        console.log("\n🔍 Checking Current NFT Ownership...\n");
        const assetNFT = await ethers.getContractAt("AssetNFT", order.assetToken);
        
        try {
          const currentOwner = await assetNFT.ownerOf(order.tokenId);
          console.log("Current Owner of Token ID", order.tokenId.toString() + ":", currentOwner);
          console.log("Order Seller:", order.seller);
          
          if (currentOwner.toLowerCase() === order.seller.toLowerCase()) {
            console.log("✅ Seller still owns the NFT");
          } else {
            console.log("❌ SELLER NO LONGER OWNS THE NFT!");
            console.log("   This is why the transaction failed with SELLER_NOT_OWNER");
          }

          // Get NFT metadata
          const metadata = await assetNFT.getMetadata(order.tokenId);
          console.log("\nNFT Metadata:");
          console.log("  Name:", metadata.name);
          console.log("  Symbol:", metadata.symbol);
          console.log("  Documents:", metadata.documents);
          
        } catch (err) {
          console.log("❌ Cannot fetch current owner (NFT might not exist)");
        }
        
      } catch (err) {
        console.log("❌ Cannot fetch order details:", err);
      }
    }
  } else {
    console.log("⚠️  This is NOT an acceptBuyOrder call");
    console.log("Function signature:", inputData.substring(0, 10));
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n🔗 View on Etherscan:");
  console.log(`https://sepolia.etherscan.io/tx/${TX_HASH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
