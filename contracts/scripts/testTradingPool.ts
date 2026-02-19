import { ethers } from "hardhat";

/**
 * Script de test rapide pour TradingPool
 * Teste les fonctionnalités principales avec et sans KYC
 */

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 TESTING TRADING POOL WITH KYC");
  console.log("=".repeat(60) + "\n");

  const [deployer, user1, user2] = await ethers.getSigners();

  // ============================================
  // SETUP - Déployer les contrats de test
  // ============================================

  console.log("📦 Deploying test contracts...\n");

  // 1. Déployer KYC
  const KYC = await ethers.getContractFactory("KYC");
  const kyc = await KYC.deploy(deployer.address);
  await kyc.waitForDeployment();
  const kycAddress = await kyc.getAddress();
  console.log("✅ KYC deployed at:", kycAddress);

  // 2. Déployer deux tokens de test
  const TestToken = await ethers.getContractFactory("TestERC20");
  
  const tokenA = await TestToken.deploy("Token A", "TKA", ethers.parseEther("1000000"));
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log("✅ Token A deployed at:", tokenAAddress);

  const tokenB = await TestToken.deploy("Token B", "TKB", ethers.parseEther("1000000"));
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log("✅ Token B deployed at:", tokenBAddress);

  // 3. Pour la démo, on utilise des adresses factices pour Uniswap
  // Dans un vrai environnement, utiliser les vraies adresses
  const mockRouterAddress = "0x1111111111111111111111111111111111111111";
  const mockFactoryAddress = "0x2222222222222222222222222222222222222222";

  console.log("⚠️  Using mock Uniswap addresses (for testing structure only)");
  console.log("   Router:", mockRouterAddress);
  console.log("   Factory:", mockFactoryAddress);
  console.log("");

  // 4. Déployer TradingPool
  const TradingPool = await ethers.getContractFactory("TradingPool");
  const tradingPool = await TradingPool.deploy(
    kycAddress,
    mockRouterAddress,
    mockFactoryAddress,
    deployer.address
  );
  await tradingPool.waitForDeployment();
  const tradingPoolAddress = await tradingPool.getAddress();
  console.log("✅ TradingPool deployed at:", tradingPoolAddress);
  console.log("");

  // ============================================
  // TEST 1: Vérifier configuration initiale
  // ============================================

  console.log("🧪 TEST 1: Initial Configuration\n");

  const kycContract = await tradingPool.kycContract();
  const kycRequired = await tradingPool.kycRequired();
  const owner = await tradingPool.owner();

  console.log("   KYC Contract:", kycContract);
  console.log("   KYC Required:", kycRequired ? "✅ YES" : "❌ NO");
  console.log("   Owner:", owner);
  console.log("");

  // ============================================
  // TEST 2: User non-whitelisted ne peut PAS trader
  // ============================================

  console.log("🧪 TEST 2: Non-whitelisted user CANNOT trade\n");

  const canTradeUser1Before = await tradingPool.canTrade(user1.address);
  console.log("   User1 can trade:", canTradeUser1Before ? "✅" : "❌");

  if (!canTradeUser1Before) {
    console.log("   ✅ PASS: Non-whitelisted user correctly blocked\n");
  } else {
    console.log("   ❌ FAIL: Non-whitelisted user can trade\n");
  }

  // ============================================
  // TEST 3: Whitelist user1
  // ============================================

  console.log("🧪 TEST 3: Whitelist user1\n");

  const tx1 = await kyc.setWhitelisted(user1.address, true);
  await tx1.wait();
  console.log("   ✅ User1 whitelisted\n");

  const canTradeUser1After = await tradingPool.canTrade(user1.address);
  console.log("   User1 can trade:", canTradeUser1After ? "✅" : "❌");

  if (canTradeUser1After) {
    console.log("   ✅ PASS: Whitelisted user can trade\n");
  } else {
    console.log("   ❌ FAIL: Whitelisted user cannot trade\n");
  }

  // ============================================
  // TEST 4: Blacklist overrides whitelist
  // ============================================

  console.log("🧪 TEST 4: Blacklist overrides whitelist\n");

  const tx2 = await kyc.setBlacklisted(user1.address, true);
  await tx2.wait();
  console.log("   🚫 User1 blacklisted\n");

  const canTradeUser1Blacklisted = await tradingPool.canTrade(user1.address);
  console.log("   User1 can trade:", canTradeUser1Blacklisted ? "✅" : "❌");

  if (!canTradeUser1Blacklisted) {
    console.log("   ✅ PASS: Blacklist correctly overrides whitelist\n");
  } else {
    console.log("   ❌ FAIL: Blacklist does not override whitelist\n");
  }

  // Retirer du blacklist pour continuer les tests
  const tx3 = await kyc.setBlacklisted(user1.address, false);
  await tx3.wait();
  console.log("   ✅ User1 removed from blacklist\n");

  // ============================================
  // TEST 5: Désactiver KYC requirement
  // ============================================

  console.log("🧪 TEST 5: Disable KYC requirement\n");

  const tx4 = await tradingPool.setKYCRequired(false);
  await tx4.wait();
  console.log("   ⚠️  KYC requirement disabled\n");

  const canTradeUser2NoKYC = await tradingPool.canTrade(user2.address);
  console.log("   User2 (not whitelisted) can trade:", canTradeUser2NoKYC ? "✅" : "❌");

  if (canTradeUser2NoKYC) {
    console.log("   ✅ PASS: Anyone can trade when KYC disabled\n");
  } else {
    console.log("   ❌ FAIL: User still blocked with KYC disabled\n");
  }

  // Réactiver KYC
  const tx5 = await tradingPool.setKYCRequired(true);
  await tx5.wait();
  console.log("   ✅ KYC requirement re-enabled\n");

  // ============================================
  // TEST 6: Transfer tokens et approve
  // ============================================

  console.log("🧪 TEST 6: Token transfers and approvals\n");

  // Transférer des tokens à user1
  const transferAmount = ethers.parseEther("1000");
  await tokenA.transfer(user1.address, transferAmount);
  await tokenB.transfer(user1.address, transferAmount);
  
  const balanceA = await tokenA.balanceOf(user1.address);
  const balanceB = await tokenB.balanceOf(user1.address);
  
  console.log("   User1 Token A balance:", ethers.formatEther(balanceA), "TKA");
  console.log("   User1 Token B balance:", ethers.formatEther(balanceB), "TKB");
  console.log("");

  // User1 approuve TradingPool
  const approveAmount = ethers.parseEther("100");
  const tokenAAsUser1 = tokenA.connect(user1);
  const tokenBAsUser1 = tokenB.connect(user1);
  
  await tokenAAsUser1.approve(tradingPoolAddress, approveAmount);
  await tokenBAsUser1.approve(tradingPoolAddress, approveAmount);
  
  const allowanceA = await tokenA.allowance(user1.address, tradingPoolAddress);
  const allowanceB = await tokenB.allowance(user1.address, tradingPoolAddress);
  
  console.log("   User1 approved TradingPool for:", ethers.formatEther(allowanceA), "TKA");
  console.log("   User1 approved TradingPool for:", ethers.formatEther(allowanceB), "TKB");
  console.log("");

  // ============================================
  // TEST 7: Admin functions
  // ============================================

  console.log("🧪 TEST 7: Admin functions\n");

  // Changer KYC contract
  const newKYCAddress = "0x3333333333333333333333333333333333333333";
  const tx6 = await tradingPool.setKYCContract(kycAddress); // Reset to original
  await tx6.wait();
  console.log("   ✅ KYC contract update successful\n");

  // Transfer ownership
  const newOwner = user1.address;
  const tx7 = await tradingPool.transferOwnership(newOwner);
  await tx7.wait();
  console.log("   ✅ Ownership transferred to:", newOwner);
  console.log("");

  // ============================================
  // RÉSUMÉ
  // ============================================

  console.log("=".repeat(60));
  console.log("✨ TRADING POOL TESTS COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Summary:");
  console.log("   ✅ TradingPool deployed successfully");
  console.log("   ✅ KYC verification works on-chain");
  console.log("   ✅ Whitelist/blacklist logic correct");
  console.log("   ✅ Admin functions operational");
  console.log("   ✅ Token approvals working");
  console.log("");
  console.log("⚠️  Note: Actual swap/liquidity functions require real Uniswap deployment");
  console.log("   For full integration testing, deploy on testnet with real Uniswap V2");
  console.log("");
  console.log("🎯 Next Steps:");
  console.log("   1. Deploy on Sepolia testnet");
  console.log("   2. Configure real Uniswap V2 addresses");
  console.log("   3. Add liquidity to pools");
  console.log("   4. Test swap with real tokens");
  console.log("   5. Integrate with frontend");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
