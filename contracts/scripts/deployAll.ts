import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

function updateEnvVariable(key: string, value: string, envPath: string) {
  let envContent = fs.readFileSync(envPath, "utf-8");
  
  if (envContent.includes(`${key}=`)) {
    envContent = envContent.replace(
      new RegExp(`${key}=.*`),
      `${key}=${value}`
    );
  } else {
    envContent += `\n${key}=${value}`;
  }
  
  fs.writeFileSync(envPath, envContent);
}

async function main() {
  console.log("🚀 Complete Redeployment on Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("═".repeat(60));

  // 1. Deploy KYC Manager
  console.log("\n📋 Deploying KYC Manager...");
  const KYCFactory = await ethers.getContractFactory("KYC");
  const kyc = await KYCFactory.deploy(deployer.address);
  await kyc.waitForDeployment();
  const kycAddress = await kyc.getAddress();
  console.log("✅ KYC Manager:", kycAddress);

  const kycWhitelistTx = await kyc.setWhitelisted(deployer.address, true);
  await kycWhitelistTx.wait();
  console.log("   - Deployer whitelisted");

  // 2. Deploy Oracle
  console.log("\n🔮 Deploying Oracle...");
  const OracleFactory = await ethers.getContractFactory("Oracle");
  const oracle = await OracleFactory.deploy(deployer.address);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("✅ Oracle:", oracleAddress);

  // 3. Deploy Implementations
  console.log("\n🧱 Deploying Implementations...");
  const ERC20Factory = await ethers.getContractFactory("AssetERC20");
  const NFTFactory = await ethers.getContractFactory("AssetNFT");
  const PoolFactory = await ethers.getContractFactory("AssetPool");

  const erc20Impl = await ERC20Factory.deploy();
  await erc20Impl.waitForDeployment();
  const erc20ImplAddress = await erc20Impl.getAddress();

  const nftImpl = await NFTFactory.deploy();
  await nftImpl.waitForDeployment();
  const nftImplAddress = await nftImpl.getAddress();

  const poolImpl = await PoolFactory.deploy();
  await poolImpl.waitForDeployment();
  const poolImplAddress = await poolImpl.getAddress();

  console.log("✅ ERC20 Implementation:", erc20ImplAddress);
  console.log("✅ NFT Implementation:", nftImplAddress);
  console.log("✅ Pool Implementation:", poolImplAddress);

  // 4. Deploy Test Tokens (USDC, USDT, WETH)
  console.log("\n💰 Deploying Test Tokens...");
  const TestTokenFactory = await ethers.getContractFactory("TestERC20");
  
  const usdc = await TestTokenFactory.deploy(
    "USD Coin",
    "USDC",
    ethers.parseUnits("1000000", 18),
    deployer.address
  );
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();

  const usdt = await TestTokenFactory.deploy(
    "Tether USD",
    "USDT",
    ethers.parseUnits("1000000", 18),
    deployer.address
  );
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();

  const weth = await TestTokenFactory.deploy(
    "Wrapped Ether",
    "WETH",
    ethers.parseUnits("1000000", 18),
    deployer.address
  );
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();

  console.log("✅ USDC:", usdcAddress);
  console.log("✅ USDT:", usdtAddress);
  console.log("✅ WETH:", wethAddress);

  // 5. Deploy Factory
  console.log("\n🏭 Deploying Asset Factory...");
  const FactoryFactory = await ethers.getContractFactory("Factory");
  const routerAddress = deployer.address;
  const baseTokenAddress = usdcAddress;
  
  const factory = await FactoryFactory.deploy(
    deployer.address,
    kycAddress,
    oracleAddress,
    routerAddress,
    baseTokenAddress,
    erc20ImplAddress,
    nftImplAddress,
    poolImplAddress
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ Factory:", factoryAddress);

  const grantFactoryTx = await oracle.grantFactoryRole(factoryAddress);
  await grantFactoryTx.wait();
  console.log("   - Factory role granted on Oracle");

  // 6. Deploy PrimarySale (ERC20)
  console.log("\n🏪 Deploying PrimarySale (ERC20)...");
  const PrimarySaleFactory = await ethers.getContractFactory("PrimarySale");
  const primarySale = await PrimarySaleFactory.deploy(kycAddress, deployer.address);
  await primarySale.waitForDeployment();
  const primarySaleAddress = await primarySale.getAddress();
  console.log("✅ PrimarySale:", primarySaleAddress);

  // 7. Deploy PrimarySaleNFT
  console.log("\n🖼️  Deploying PrimarySaleNFT...");
  const PrimarySaleNFTFactory = await ethers.getContractFactory("PrimarySaleNFT");
  const primarySaleNFT = await PrimarySaleNFTFactory.deploy(deployer.address, kycAddress);
  await primarySaleNFT.waitForDeployment();
  const primarySaleNFTAddress = await primarySaleNFT.getAddress();
  console.log("✅ PrimarySaleNFT:", primarySaleNFTAddress);

  // 8. Deploy TradingPool
  console.log("\n🔄 Deploying TradingPool...");
  
  // Use existing Uniswap V2 addresses from Sepolia or environment
  const uniswapRouterAddress = process.env.NEXT_PUBLIC_UNISWAP_V2_ROUTER || "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  const uniswapFactoryAddress = process.env.NEXT_PUBLIC_UNISWAP_V2_FACTORY || "0x7E0987E5b3a30e3f2828572Bb659A548460a3003";
  
  console.log("   Using Uniswap Router:", uniswapRouterAddress);
  console.log("   Using Uniswap Factory:", uniswapFactoryAddress);

  const TradingPoolFactory = await ethers.getContractFactory("TradingPool");
  const tradingPool = await TradingPoolFactory.deploy(
    kycAddress,
    uniswapRouterAddress,
    uniswapFactoryAddress,
    deployer.address
  );
  await tradingPool.waitForDeployment();
  const tradingPoolAddress = await tradingPool.getAddress();
  console.log("✅ TradingPool:", tradingPoolAddress);

  // 9. Whitelist contracts in KYC
  console.log("\n🔐 Whitelisting contracts in KYC...");
  const contractsToWhitelist = [
    primarySaleAddress,
    primarySaleNFTAddress,
    tradingPoolAddress,
  ];

  for (const contractAddr of contractsToWhitelist) {
    const tx = await kyc.setWhitelisted(contractAddr, true);
    await tx.wait();
    console.log(`   ✅ ${contractAddr.substring(0, 10)}...`);
  }

  // 10. Update .env.local
  console.log("\n📝 Updating .env.local...");
  const envPath = path.join(__dirname, "../../frontend/.env.local");
  
  const updates: { [key: string]: string } = {
    "NEXT_PUBLIC_ASSET_FACTORY_ADDRESS": factoryAddress,
    "NEXT_PUBLIC_KYC_ADDRESS": kycAddress,
    "NEXT_PUBLIC_ORACLE_ADDRESS": oracleAddress,
    "NEXT_PUBLIC_ROUTER_ADDRESS": routerAddress,
    "NEXT_PUBLIC_BASE_TOKEN_ADDRESS": baseTokenAddress,
    "NEXT_PUBLIC_USDC_ADDRESS": usdcAddress,
    "NEXT_PUBLIC_USDT_ADDRESS": usdtAddress,
    "NEXT_PUBLIC_WETH_ADDRESS": wethAddress,
    "NEXT_PUBLIC_PRIMARY_SALE_ADDRESS": primarySaleAddress,
    "NEXT_PUBLIC_PRIMARY_SALE_NFT_ADDRESS": primarySaleNFTAddress,
    "NEXT_PUBLIC_TRADING_POOL_ADDRESS": tradingPoolAddress,
    "NEXT_PUBLIC_UNISWAP_V2_ROUTER": uniswapRouterAddress,
    "NEXT_PUBLIC_UNISWAP_V2_FACTORY": uniswapFactoryAddress,
  };

  for (const [key, value] of Object.entries(updates)) {
    updateEnvVariable(key, value, envPath);
  }

  console.log("✅ .env.local updated with all contract addresses");

  // Print summary
  console.log("\n" + "═".repeat(60));
  console.log("✨ DEPLOYMENT COMPLETE!");
  console.log("═".repeat(60));
  console.log("\n📋 Contract Addresses:\n");
  console.log("KYC Manager:           ", kycAddress);
  console.log("Oracle:                ", oracleAddress);
  console.log("Factory:               ", factoryAddress);
  console.log("PrimarySale (ERC20):   ", primarySaleAddress);
  console.log("PrimarySaleNFT:        ", primarySaleNFTAddress);
  console.log("TradingPool:           ", tradingPoolAddress);
  console.log("\n💰 Test Tokens:\n");
  console.log("USDC:                  ", usdcAddress);
  console.log("USDT:                  ", usdtAddress);
  console.log("WETH:                  ", wethAddress);
  console.log("\n🔀 Uniswap V2:\n");
  console.log("Factory:               ", uniswapFactoryAddress);
  console.log("Router:                ", uniswapRouterAddress);
  console.log("\n⚠️  Remember to restart your frontend server!");
  console.log("═".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
