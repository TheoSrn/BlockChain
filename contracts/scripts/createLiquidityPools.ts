import { ethers } from "hardhat";

/**
 * Script pour créer les liquidity pools sur Uniswap V2 Sepolia
 * Créé les pools USDC/USDT et USDC/WETH
 */

const UNISWAP_V2_FACTORY = "0x7E0987E5b3a30e3f2828572Bb659A548460a3003";
const USDC_ADDRESS = "0x461Ca34a940680c2e34E6928F54BF38D0a29C494";
const USDT_ADDRESS = "0xf7d3677312e147c857e596583eB31185cf2b70e9";
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // WETH Sepolia officiel

// ABI minimal pour Uniswap V2 Factory
const FACTORY_ABI = [
  "function createPair(address tokenA, address tokenB) external returns (address pair)",
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
];

async function main() {
  console.log("🏊 Creating Liquidity Pools on Uniswap V2 Sepolia\n");
  console.log("=".repeat(70));

  const [signer] = await ethers.getSigners();
  console.log(`\n👤 Deployer: ${signer.address}\n`);

  // Connecter à la Factory
  const factory = new ethers.Contract(UNISWAP_V2_FACTORY, FACTORY_ABI, signer);

  async function createOrGetPool(tokenA: string, tokenB: string, symbolA: string, symbolB: string) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`📊 Pool ${symbolA}/${symbolB}`);
    console.log(`${"=".repeat(70)}\n`);

    try {
      // Vérifier si le pool existe déjà
      const existingPair = await factory.getPair(tokenA, tokenB);
      
      if (existingPair !== "0x0000000000000000000000000000000000000000") {
        console.log(`✅ Pool exists already!`);
        console.log(`   Pool Address: ${existingPair}`);
        console.log(`   🔗 Etherscan: https://sepolia.etherscan.io/address/${existingPair}`);
        return existingPair;
      }

      // Créer le pool
      console.log(`🔨 Creating new pool...`);
      console.log(`   Token A (${symbolA}): ${tokenA}`);
      console.log(`   Token B (${symbolB}): ${tokenB}`);
      
      const tx = await factory.createPair(tokenA, tokenB);
      console.log(`\n⏳ Transaction sent: ${tx.hash}`);
      console.log(`   🔗 https://sepolia.etherscan.io/tx/${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`\n✅ Pool created successfully!`);
      
      // Récupérer l'adresse du pool créé
      const pairAddress = await factory.getPair(tokenA, tokenB);
      console.log(`   Pool Address: ${pairAddress}`);
      console.log(`   🔗 Etherscan: https://sepolia.etherscan.io/address/${pairAddress}`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
      
      return pairAddress;

    } catch (error: any) {
      console.log(`\n❌ Error: ${error.message}`);
      return null;
    }
  }

  // Créer pool USDC/USDT
  const usdcUsdtPool = await createOrGetPool(USDC_ADDRESS, USDT_ADDRESS, "USDC", "USDT");

  // Créer pool USDC/WETH
  const usdcWethPool = await createOrGetPool(USDC_ADDRESS, WETH_ADDRESS, "USDC", "WETH");

  // Résumé final
  console.log(`\n${"=".repeat(70)}`);
  console.log("📊 SUMMARY");
  console.log(`${"=".repeat(70)}\n`);

  if (usdcUsdtPool) {
    console.log(`✅ USDC/USDT Pool: ${usdcUsdtPool}`);
  } else {
    console.log(`❌ USDC/USDT Pool: Failed to create`);
  }

  if (usdcWethPool) {
    console.log(`✅ USDC/WETH Pool: ${usdcWethPool}`);
  } else {
    console.log(`❌ USDC/WETH Pool: Failed to create`);
  }

  console.log(`\n💡 Next step: Run addInitialLiquidity.ts to add liquidity to these pools`);
  console.log(`\n${"=".repeat(70)}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
