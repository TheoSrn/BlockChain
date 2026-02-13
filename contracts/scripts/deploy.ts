import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying contracts...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  // 1. Deploy KYC Manager
  console.log("\n📋 Deploying KYC Manager...");
  const KYCFactory = await ethers.getContractFactory("KYC");
  const kyc = await KYCFactory.deploy(deployer.address);
  await kyc.waitForDeployment();
  const kycAddress = await kyc.getAddress();
  console.log("✅ KYC Manager deployed at:", kycAddress);

  const kycWhitelistTx = await kyc.setWhitelisted(deployer.address, true);
  await kycWhitelistTx.wait();
  console.log("✅ Deployer whitelisted in KYC");

  // 2. Deploy Oracle
  console.log("\n🔮 Deploying Oracle...");
  const OracleFactory = await ethers.getContractFactory("Oracle");
  const oracle = await OracleFactory.deploy(deployer.address);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("✅ Oracle deployed at:", oracleAddress);

  // 3. Deploy Implementations (for clones)
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

  console.log("✅ ERC20 implementation:", erc20ImplAddress);
  console.log("✅ NFT implementation:", nftImplAddress);
  console.log("✅ Pool implementation:", poolImplAddress);

  // 4. Deploy Test Tokens (USDC/USDT)
  console.log("\n💰 Deploying Test Tokens...");
  const TestTokenFactory = await ethers.getContractFactory("TestERC20");
  const usdc = await TestTokenFactory.deploy(
    "USD Coin",
    "USDC",
    ethers.parseUnits("1000000", 6),
    deployer.address
  );
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();

  const usdt = await TestTokenFactory.deploy(
    "Tether USD",
    "USDT",
    ethers.parseUnits("1000000", 6),
    deployer.address
  );
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();

  console.log("✅ USDC deployed at:", usdcAddress);
  console.log("✅ USDT deployed at:", usdtAddress);

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
  console.log("✅ Factory deployed at:", factoryAddress);

  const grantFactoryTx = await oracle.grantFactoryRole(factoryAddress);
  await grantFactoryTx.wait();
  console.log("✅ Factory role granted on Oracle");

  // Print environment variables for .env.local
  console.log("\n📝 Add these to your .env.local:\n");
  console.log(`NEXT_PUBLIC_ASSET_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`NEXT_PUBLIC_KYC_ADDRESS=${kycAddress}`);
  console.log(`NEXT_PUBLIC_ORACLE_ADDRESS=${oracleAddress}`);
  console.log(`NEXT_PUBLIC_ROUTER_ADDRESS=${routerAddress}`);
  console.log(`NEXT_PUBLIC_BASE_TOKEN_ADDRESS=${baseTokenAddress}`);
  console.log(`NEXT_PUBLIC_LOCAL_RPC_URL=http://127.0.0.1:8545`);
  console.log(`NEXT_PUBLIC_DEFAULT_ASSET_ID=1`);
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${usdcAddress}`);
  console.log(`NEXT_PUBLIC_USDT_ADDRESS=${usdtAddress}`);

  console.log("\n✨ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
