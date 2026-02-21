import { ethers } from "hardhat";

async function main() {
  console.log("🔮 Upgrading Oracle contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  // Get existing Factory address
  const factoryAddress = "0xcD10F4847908eBBe7BAc14664F777c600b5f5Fd8";
  
  // 1. Deploy new Oracle with currency field
  console.log("\n🔮 Deploying new Oracle (with currency support)...");
  const OracleFactory = await ethers.getContractFactory("Oracle");
  const oracle = await OracleFactory.deploy(deployer.address);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("✅ New Oracle deployed at:", oracleAddress);

  // 2. Grant FACTORY_ROLE to existing Factory contract
  console.log("\n🔑 Granting FACTORY_ROLE to Factory...");
  const grantFactoryTx = await oracle.grantFactoryRole(factoryAddress);
  await grantFactoryTx.wait();
  console.log("✅ Factory role granted on new Oracle");

  // 2.5 Temporarily grant FACTORY_ROLE to deployer for asset registration
  console.log("\n🔑 Temporarily granting FACTORY_ROLE to deployer...");
  const grantDeployerTx = await oracle.grantFactoryRole(deployer.address);
  await grantDeployerTx.wait();
  console.log("✅ Deployer granted FACTORY_ROLE");

  // 3. Get asset count from Factory to know how many assets to register
  console.log("\n📊 Checking existing assets...");
  const factoryABI = [
    {
      "inputs": [],
      "name": "assetCount",
      "outputs": [{ "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "name": "assetId", "type": "uint256" }],
      "name": "getAsset",
      "outputs": [
        {
          "components": [
            { "name": "id", "type": "uint256" },
            { "name": "nft", "type": "address" },
            { "name": "token", "type": "address" },
            { "name": "pool", "type": "address" },
            { "name": "name", "type": "string" },
            { "name": "symbol", "type": "string" },
            { "name": "active", "type": "bool" }
          ],
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "name": "oracleAddress", "type": "address" }],
      "name": "setOracle",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];
  
  const factory = new ethers.Contract(factoryAddress, factoryABI, deployer);
  const assetCount = await factory.assetCount();
  console.log(`Found ${assetCount} existing assets`);

  // 4. Register existing assets in new Oracle
  if (assetCount > 0n) {
    console.log("\n📝 Registering existing assets in new Oracle...");
    for (let i = 1n; i <= assetCount; i++) {
      const asset = await factory.getAsset(i);
      const { name, symbol, nft, token } = asset;
      
      console.log(`Registering Asset ${i}: ${name} (${symbol})`);
      const registerTx = await oracle.registerAsset(i, nft, token);
      await registerTx.wait();
      console.log(`✅ Asset ${i} registered`);
    }
  }

  // 5. Update Factory to point to new Oracle
  console.log("\n🔄 Updating Factory to use new Oracle...");
  const setOracleTx = await factory.setOracle(oracleAddress);
  await setOracleTx.wait();
  console.log("✅ Factory updated to use new Oracle");

  // Print update instructions
  console.log("\n📝 Update your .env.local:\n");
  console.log(`NEXT_PUBLIC_ORACLE_ADDRESS=${oracleAddress}`);

  console.log("\n✨ Oracle upgrade complete!");
  console.log("\n📋 Summary:");
  console.log(`- New Oracle deployed at: ${oracleAddress}`);
  console.log(`- Factory updated to use new Oracle`);
  console.log(`- ${assetCount} assets registered in new Oracle`);
  console.log("\n✅ Next steps:");
  console.log("1. Update NEXT_PUBLIC_ORACLE_ADDRESS in frontend/.env.local");
  console.log("2. Restart your frontend dev server");
  console.log("3. Test price updates with the new currency field");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
