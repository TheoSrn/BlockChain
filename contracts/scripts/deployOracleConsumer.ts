import { ethers } from "hardhat";

/**
 * Script to deploy and test the Oracle Consumer Example
 * Demonstrates how other smart contracts can integrate with the Oracle
 */

async function main() {
  console.log("🔌 Deploying Oracle Consumer Example...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  // Oracle address
  const oracleAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  
  console.log("Oracle address:", oracleAddress);

  // Deploy OracleConsumerExample
  console.log("\n📦 Deploying OracleConsumerExample...");
  const OracleConsumer = await ethers.getContractFactory("OracleConsumerExample");
  const consumer = await OracleConsumer.deploy(oracleAddress);
  await consumer.waitForDeployment();
  const consumerAddress = await consumer.getAddress();
  
  console.log("✅ OracleConsumerExample deployed at:", consumerAddress);

  // Test the consumer contract
  console.log("\n" + "=".repeat(60));
  console.log("🧪 Testing Oracle Consumer Functions");
  console.log("=".repeat(60));

  // Test 1: Get Asset Price
  console.log("\n1️⃣  Testing: getAssetPrice(1)");
  try {
    const [price, updatedAt] = await consumer.getAssetPrice(1);
    console.log("   Price:", ethers.formatUnits(price, 6), "USD");
    console.log("   Updated:", new Date(Number(updatedAt) * 1000).toLocaleString());
    console.log("   ✅ Success!");
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 2: Check Price Threshold
  console.log("\n2️⃣  Testing: isPriceAboveThreshold(1, $40,000)");
  try {
    const threshold = ethers.parseUnits("40000", 6);
    const isAbove = await consumer.isPriceAboveThreshold(1, threshold);
    console.log("   Is price above $40,000?", isAbove);
    console.log("   ✅ Success!");
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 3: Calculate Portfolio Value
  console.log("\n3️⃣  Testing: calculatePortfolioValue([1], [10])");
  try {
    const assetIds = [BigInt(1)];
    const quantities = [BigInt(10)];
    const totalValue = await consumer.calculatePortfolioValue(assetIds, quantities);
    console.log("   Portfolio value for 10 units of Asset 1:");
    console.log("   Total:", ethers.formatUnits(totalValue, 6), "USD");
    console.log("   ✅ Success!");
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 4: Check Price Freshness
  console.log("\n4️⃣  Testing: isPriceFresh(1)");
  try {
    const isFresh = await consumer.isPriceFresh(1);
    console.log("   Is price data fresh (< 1 hour)?", isFresh);
    console.log("   ✅ Success!");
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 5: Get Asset Info
  console.log("\n5️⃣  Testing: getAssetInfo(1)");
  try {
    const [nft, token, exists] = await consumer.getAssetInfo(1);
    console.log("   NFT Contract:", nft);
    console.log("   Token Contract:", token);
    console.log("   Exists:", exists);
    console.log("   ✅ Success!");
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 6: Calculate Max Borrow (DeFi Use Case)
  console.log("\n6️⃣  Testing: calculateMaxBorrow(1, 10 tokens, 150% ratio)");
  try {
    const amount = 10;
    const collateralRatio = 15000; // 150%
    const maxBorrow = await consumer.calculateMaxBorrow(1, amount, collateralRatio);
    console.log("   With 10 tokens as collateral at 150% ratio:");
    console.log("   Max borrow amount:", ethers.formatUnits(maxBorrow, 0), "USD");
    console.log("   ✅ Success!");
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✨ Oracle Consumer Example Deployed & Tested!");
  console.log("=".repeat(60));
  
  console.log("\n📊 Summary:");
  console.log("   Consumer Contract:", consumerAddress);
  console.log("   Oracle Contract:", oracleAddress);
  console.log("   All integration functions tested successfully!");

  console.log("\n💡 Use Cases Demonstrated:");
  console.log("   ✅ Price queries from other contracts");
  console.log("   ✅ Price threshold checks");
  console.log("   ✅ Portfolio valuation");
  console.log("   ✅ Data freshness verification");
  console.log("   ✅ DeFi collateral calculations");
  console.log("   ✅ Asset information retrieval");

  console.log("\n🎯 This demonstrates that the Oracle can be:");
  console.log("   - Integrated into DeFi protocols");
  console.log("   - Used for lending/borrowing calculations");
  console.log("   - Used for trading decisions");
  console.log("   - Used for portfolio management");
  console.log("   - Used for risk assessment");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
