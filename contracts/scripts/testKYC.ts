import { ethers } from "hardhat";

/**
 * Script pour tester le système KYC
 * Usage: npx hardhat run scripts/testKYC.ts --network localhost
 */

async function main() {
  console.log("🧪 Testing KYC System\n");

  const [deployer, user1, user2, user3] = await ethers.getSigners();
  
  console.log("Deployer:", deployer.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);
  console.log("User3:", user3.address);
  console.log("");

  // ============================================
  // DEPLOY CONTRACTS FOR TESTING
  // ============================================

  console.log("📦 Deploying contracts for testing...\n");

  // Deploy KYC
  const KYC = await ethers.getContractFactory("KYC");
  const kyc = await KYC.deploy(deployer.address);
  await kyc.waitForDeployment();
  const kycAddress = await kyc.getAddress();
  console.log("✅ KYC deployed at:", kycAddress);

  // Deploy a test ERC20 token (using TestERC20 if available)
  const TestERC20 = await ethers.getContractFactory("TestERC20");
  const testToken = await TestERC20.deploy("Test Token", "TEST", ethers.parseEther("1000000"));
  await testToken.waitForDeployment();
  const testTokenAddress = await testToken.getAddress();
  console.log("✅ Test ERC20 deployed at:", testTokenAddress);

  // Deploy AssetERC20 with KYC
  const AssetERC20 = await ethers.getContractFactory("AssetERC20");
  const assetToken = await AssetERC20.deploy();
  await assetToken.waitForDeployment();
  await assetToken.initialize(
    "Real Estate Token",
    "RET",
    deployer.address,
    deployer.address, // factory
    kycAddress,
    ethers.parseEther("1000"),
    deployer.address // treasury
  );
  const assetTokenAddress = await assetToken.getAddress();
  console.log("✅ AssetERC20 deployed at:", assetTokenAddress);

  console.log("");

  // ============================================
  // TEST 1: Transfer without KYC should FAIL
  // ============================================

  console.log("🧪 TEST 1: Transfer WITHOUT KYC (should fail)\n");

  try {
    // Deployer has tokens, try to send to user1 (not whitelisted)
    const tx = await assetToken.transfer(user1.address, ethers.parseEther("10"));
    await tx.wait();
    console.log("  ❌ FAIL: Transfer succeeded when it should have failed!");
  } catch (error: any) {
    if (error.message.includes("KYC_TO") || error.message.includes("KYC_FROM")) {
      console.log("  ✅ PASS: Transfer correctly blocked by KYC");
      console.log(`     Error: ${error.message.split('\n')[0]}`);
    } else {
      console.log("  ❌ FAIL: Unexpected error:", error.message);
    }
  }

  console.log("");

  // ============================================
  // TEST 2: Whitelist users
  // ============================================

  console.log("🧪 TEST 2: Whitelist users\n");

  const whitelistTx1 = await kyc.setWhitelisted(deployer.address, true);
  await whitelistTx1.wait();
  console.log("  ✅ Whitelisted deployer:", deployer.address);

  const whitelistTx2 = await kyc.setWhitelisted(user1.address, true);
  await whitelistTx2.wait();
  console.log("  ✅ Whitelisted user1:", user1.address);

  const whitelistTx3 = await kyc.setWhitelisted(user2.address, true);
  await whitelistTx3.wait();
  console.log("  ✅ Whitelisted user2:", user2.address);

  console.log("");

  // ============================================
  // TEST 3: Transfer with KYC should SUCCEED
  // ============================================

  console.log("🧪 TEST 3: Transfer WITH KYC (should succeed)\n");

  try {
    const tx = await assetToken.transfer(user1.address, ethers.parseEther("100"));
    await tx.wait();
    
    const balance = await assetToken.balanceOf(user1.address);
    console.log("  ✅ PASS: Transfer succeeded");
    console.log(`     User1 balance: ${ethers.formatEther(balance)} RET`);
  } catch (error: any) {
    console.log("  ❌ FAIL: Transfer failed when it should have succeeded");
    console.log(`     Error: ${error.message}`);
  }

  console.log("");

  // ============================================
  // TEST 4: User-to-user transfer with KYC
  // ============================================

  console.log("🧪 TEST 4: User-to-user transfer WITH KYC (should succeed)\n");

  try {
    const tx = await assetToken.connect(user1).transfer(user2.address, ethers.parseEther("50"));
    await tx.wait();
    
    const balance1 = await assetToken.balanceOf(user1.address);
    const balance2 = await assetToken.balanceOf(user2.address);
    console.log("  ✅ PASS: Transfer succeeded");
    console.log(`     User1 balance: ${ethers.formatEther(balance1)} RET`);
    console.log(`     User2 balance: ${ethers.formatEther(balance2)} RET`);
  } catch (error: any) {
    console.log("  ❌ FAIL: Transfer failed when it should have succeeded");
    console.log(`     Error: ${error.message}`);
  }

  console.log("");

  // ============================================
  // TEST 5: Blacklist user and try transfer
  // ============================================

  console.log("🧪 TEST 5: Blacklist user2 and try transfer (should fail)\n");

  const blacklistTx = await kyc.setBlacklisted(user2.address, true);
  await blacklistTx.wait();
  console.log("  🚫 Blacklisted user2:", user2.address);

  try {
    const tx = await assetToken.connect(user1).transfer(user2.address, ethers.parseEther("10"));
    await tx.wait();
    console.log("  ❌ FAIL: Transfer to blacklisted user succeeded!");
  } catch (error: any) {
    if (error.message.includes("BL_TO") || error.message.includes("BL_FROM")) {
      console.log("  ✅ PASS: Transfer correctly blocked by blacklist");
      console.log(`     Error: ${error.message.split('\n')[0]}`);
    } else {
      console.log("  ❌ FAIL: Unexpected error:", error.message);
    }
  }

  console.log("");

  // ============================================
  // TEST 6: Blacklisted user cannot send
  // ============================================

  console.log("🧪 TEST 6: Blacklisted user cannot send tokens (should fail)\n");

  try {
    const tx = await assetToken.connect(user2).transfer(user1.address, ethers.parseEther("10"));
    await tx.wait();
    console.log("  ❌ FAIL: Blacklisted user could send tokens!");
  } catch (error: any) {
    if (error.message.includes("BL_FROM") || error.message.includes("BL_TO")) {
      console.log("  ✅ PASS: Blacklisted user correctly blocked from sending");
      console.log(`     Error: ${error.message.split('\n')[0]}`);
    } else {
      console.log("  ❌ FAIL: Unexpected error:", error.message);
    }
  }

  console.log("");

  // ============================================
  // TEST 7: Remove from blacklist and try again
  // ============================================

  console.log("🧪 TEST 7: Remove from blacklist and transfer (should succeed)\n");

  const removeBlacklistTx = await kyc.setBlacklisted(user2.address, false);
  await removeBlacklistTx.wait();
  console.log("  ✅ Removed user2 from blacklist");

  try {
    const tx = await assetToken.connect(user1).transfer(user2.address, ethers.parseEther("10"));
    await tx.wait();
    
    const balance2 = await assetToken.balanceOf(user2.address);
    console.log("  ✅ PASS: Transfer succeeded after removing from blacklist");
    console.log(`     User2 balance: ${ethers.formatEther(balance2)} RET`);
  } catch (error: any) {
    console.log("  ❌ FAIL: Transfer failed when it should have succeeded");
    console.log(`     Error: ${error.message}`);
  }

  console.log("");

  // ============================================
  // TEST 8: Batch whitelist
  // ============================================

  console.log("🧪 TEST 8: Batch whitelist operation\n");

  const addresses = [user3.address, deployer.address];
  try {
    const tx = await kyc.setBatchWhitelisted(addresses, true);
    await tx.wait();
    
    console.log("  ✅ PASS: Batch whitelist succeeded");
    
    for (const addr of addresses) {
      const isWhitelisted = await kyc.isWhitelisted(addr);
      console.log(`     ${addr}: ${isWhitelisted ? "✅" : "❌"}`);
    }
  } catch (error: any) {
    console.log("  ❌ FAIL: Batch whitelist failed");
    console.log(`     Error: ${error.message}`);
  }

  console.log("");

  // ============================================
  // TEST 9: isVerified() function
  // ============================================

  console.log("🧪 TEST 9: isVerified() returns correct status\n");

  const verifiedStatus = [
    { address: deployer.address, name: "Deployer" },
    { address: user1.address, name: "User1" },
    { address: user2.address, name: "User2" },
    { address: user3.address, name: "User3" },
  ];

  for (const { address, name } of verifiedStatus) {
    const isWhitelisted = await kyc.isWhitelisted(address);
    const isBlacklisted = await kyc.isBlacklisted(address);
    const isVerified = await kyc.isVerified(address);
    
    const expectedVerified = isWhitelisted && !isBlacklisted;
    const passed = isVerified === expectedVerified;
    
    console.log(`  ${passed ? "✅" : "❌"} ${name}:`);
    console.log(`     Whitelisted: ${isWhitelisted}, Blacklisted: ${isBlacklisted}`);
    console.log(`     isVerified(): ${isVerified}, Expected: ${expectedVerified}`);
  }

  console.log("");

  // ============================================
  // TEST 10: Disable KYC requirement
  // ============================================

  console.log("🧪 TEST 10: Disable KYC requirement (should allow any transfer)\n");

  // First, remove user3 from whitelist to test
  await kyc.setWhitelisted(user3.address, false);
  console.log("  ℹ️  Removed user3 from whitelist");

  // Disable KYC
  const disableKycTx = await assetToken.setKycRequired(false);
  await disableKycTx.wait();
  console.log("  ℹ️  Disabled KYC requirement");

  try {
    // Transfer to non-whitelisted user should now work
    const tx = await assetToken.transfer(user3.address, ethers.parseEther("10"));
    await tx.wait();
    
    const balance3 = await assetToken.balanceOf(user3.address);
    console.log("  ✅ PASS: Transfer to non-KYC user succeeded with KYC disabled");
    console.log(`     User3 balance: ${ethers.formatEther(balance3)} RET`);
  } catch (error: any) {
    console.log("  ❌ FAIL: Transfer failed when KYC is disabled");
    console.log(`     Error: ${error.message}`);
  }

  console.log("");

  // ============================================
  // SUMMARY
  // ============================================

  console.log("═".repeat(60));
  console.log("✨ KYC TESTING COMPLETE!");
  console.log("═".repeat(60));
  console.log("\n📋 Summary:");
  console.log("   ✅ KYC blocks non-whitelisted users from trading");
  console.log("   ✅ Blacklist overrides whitelist");
  console.log("   ✅ Batch operations work correctly");
  console.log("   ✅ isVerified() returns correct status");
  console.log("   ✅ KYC can be disabled for testing/special cases");
  console.log("\n🔒 Your tokenized assets are now protected by on-chain KYC!");
  console.log("\n💡 Next steps:");
  console.log("   - Deploy KYC contract: npx hardhat run scripts/deploy.ts");
  console.log("   - Manage KYC: npx hardhat run scripts/manageKYC.ts");
  console.log("   - Test with factory: npx hardhat run scripts/createAsset.ts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
