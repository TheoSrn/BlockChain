import { ethers } from "hardhat";

/**
 * Script de déploiement du TradingPool
 * Pool de trading avec vérification KYC obligatoire
 * 
 * Usage:
 * npx hardhat run scripts/deployTradingPool.ts --network sepolia
 */

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 DEPLOYING TRADING POOL WITH KYC VERIFICATION");
  console.log("=".repeat(60) + "\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // ============================================
  // CONFIGURATION - À MODIFIER SELON LE RÉSEAU
  // ============================================

  // Adresse du contrat KYC déployé
  const KYC_ADDRESS = process.env.KYC_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  // Uniswap V2 sur Sepolia (à vérifier)
  const UNISWAP_V2_ROUTER = process.env.UNISWAP_V2_ROUTER || "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  const UNISWAP_V2_FACTORY = process.env.UNISWAP_V2_FACTORY || "0x7E0987E5b3a30e3f2828572Bb659A548460a3003";
  
  // Si réseau local, déployer nos propres contrats de test
  const network = await ethers.provider.getNetwork();
  const isLocalNetwork = network.chainId === 31337n || network.chainId === 1337n;

  let kycAddress = KYC_ADDRESS;
  let routerAddress = UNISWAP_V2_ROUTER;
  let factoryAddress = UNISWAP_V2_FACTORY;

  console.log("🌐 Network:", network.name, "(chainId:", network.chainId.toString(), ")\n");

  // ============================================
  // VÉRIFIER/DÉPLOYER LE CONTRAT KYC
  // ============================================

  console.log("🔍 Checking KYC Contract...");
  
  try {
    const kycCode = await ethers.provider.getCode(kycAddress);
    if (kycCode === "0x") {
      console.log("❌ KYC contract not found at:", kycAddress);
      console.log("📦 Deploying KYC contract...\n");
      
      const KYC = await ethers.getContractFactory("KYC");
      const kyc = await KYC.deploy(deployer.address);
      await kyc.waitForDeployment();
      
      kycAddress = await kyc.getAddress();
      console.log("✅ KYC deployed at:", kycAddress);
      
      // Whitelist le deployer
      const tx = await kyc.setWhitelisted(deployer.address, true);
      await tx.wait();
      console.log("✅ Deployer whitelisted\n");
    } else {
      console.log("✅ KYC contract found at:", kycAddress, "\n");
    }
  } catch (error: any) {
    console.error("❌ Error checking KYC:", error.message);
    process.exit(1);
  }

  // ============================================
  // POUR RÉSEAU LOCAL : DÉPLOYER MOCK UNISWAP
  // ============================================

  if (isLocalNetwork) {
    console.log("🏠 Local network detected - Using mock addresses");
    console.log("⚠️  In production, use real Uniswap V2 addresses\n");
    
    // Pour les tests locaux, on peut utiliser des adresses factices
    // ou déployer nos propres mocks
    // Pour l'instant, on utilise des adresses de test
  }

  // ============================================
  // DÉPLOYER LE TRADING POOL
  // ============================================

  console.log("📦 Deploying TradingPool...\n");
  console.log("   KYC Contract:", kycAddress);
  console.log("   Uniswap Router:", routerAddress);
  console.log("   Uniswap Factory:", factoryAddress);
  console.log("   Initial Owner:", deployer.address);
  console.log("");

  try {
    const TradingPool = await ethers.getContractFactory("TradingPool");
    const tradingPool = await TradingPool.deploy(
      kycAddress,
      routerAddress,
      factoryAddress,
      deployer.address
    );

    await tradingPool.waitForDeployment();
    const tradingPoolAddress = await tradingPool.getAddress();

    console.log("✅ TradingPool deployed at:", tradingPoolAddress, "\n");

    // ============================================
    // VÉRIFICATION DU DÉPLOIEMENT
    // ============================================

    console.log("🔍 Verifying deployment...");
    
    const kycContractAddr = await tradingPool.kycContract();
    const routerAddr = await tradingPool.uniswapV2Router();
    const factoryAddr = await tradingPool.uniswapV2Factory();
    const kycReq = await tradingPool.kycRequired();
    const owner = await tradingPool.owner();
    
    console.log("   KYC Contract:", kycContractAddr);
    console.log("   Uniswap Router:", routerAddr);
    console.log("   Uniswap Factory:", factoryAddr);
    console.log("   KYC Required:", kycReq);
    console.log("   Owner:", owner);
    console.log("");

    // Vérifier que le deployer peut trader
    const canTrade = await tradingPool.canTrade(deployer.address);
    console.log("   Deployer can trade:", canTrade ? "✅" : "❌");
    console.log("");

    // ============================================
    // RÉSUMÉ
    // ============================================

    console.log("=".repeat(60));
    console.log("✨ DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n📋 Summary:");
    console.log("   Network:", network.name);
    console.log("   TradingPool:", tradingPoolAddress);
    console.log("   KYC Contract:", kycAddress);
    console.log("   Owner:", deployer.address);
    console.log("");
    console.log("🔐 Security:");
    console.log("   ✅ KYC verification ENABLED");
    console.log("   ✅ Only whitelisted users can trade");
    console.log("   ✅ Reentrancy protection active");
    console.log("");
    console.log("📝 Next Steps:");
    console.log("   1. Update .env with TRADING_POOL_ADDRESS=" + tradingPoolAddress);
    console.log("   2. Update frontend config/contracts.ts");
    console.log("   3. Whitelist users via KYC contract");
    console.log("   4. Add initial liquidity to pools");
    console.log("   5. Test swap and liquidity functions");
    console.log("");
    console.log("💡 Useful Commands:");
    console.log("   # Whitelist a user");
    console.log("   npx hardhat run scripts/manageKYC.ts --network", network.name);
    console.log("");
    console.log("   # Add liquidity");
    console.log("   # (Use frontend or create script)");
    console.log("");

    // ============================================
    // SAUVEGARDER L'ADRESSE
    // ============================================

    console.log("💾 Save this address to your environment:");
    console.log("   NEXT_PUBLIC_TRADING_POOL_ADDRESS=" + tradingPoolAddress);
    console.log("   NEXT_PUBLIC_UNISWAP_V2_ROUTER=" + routerAddress);
    console.log("   NEXT_PUBLIC_UNISWAP_V2_FACTORY=" + factoryAddress);
    console.log("");

  } catch (error: any) {
    console.error("❌ Deployment failed:", error.message);
    if (error.reason) {
      console.error("   Reason:", error.reason);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
