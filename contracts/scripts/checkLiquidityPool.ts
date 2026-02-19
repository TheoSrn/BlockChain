import { ethers } from "hardhat";
import { formatUnits } from "ethers";

// Adresses des contrats
const UNISWAP_V2_FACTORY = "0x7E0987E5b3a30e3f2828572Bb659A548460a3003";
const USDC_ADDRESS = "0x461Ca34a940680c2e34E6928F54BF38D0a29C494";
const USDT_ADDRESS = "0xf7d3677312e147c857e596583eB31185cf2b70e9";
const USER_ADDRESS = "0xA24a49D62C3Dc81a9BADC056dc69a1B386593FcF";

// ABIs minimales
const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
];

const PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
];

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
];

async function main() {
  console.log("🔍 Vérification du pool de liquidité USDC/USDT...\n");

  // Connexion à la factory
  const factory = await ethers.getContractAt(FACTORY_ABI, UNISWAP_V2_FACTORY);
  
  // Récupération de l'adresse du pair
  const pairAddress = await factory.getPair(USDC_ADDRESS, USDT_ADDRESS);
  console.log(`📍 Adresse du pool USDC/USDT: ${pairAddress}\n`);

  if (pairAddress === ethers.ZeroAddress) {
    console.log("❌ Le pool n'existe pas encore!");
    return;
  }

  // Connexion au pair
  const pair = await ethers.getContractAt(PAIR_ABI, pairAddress);
  
  // Récupération des tokens
  const token0Address = await pair.token0();
  const token1Address = await pair.token1();
  
  const token0 = await ethers.getContractAt(ERC20_ABI, token0Address);
  const token1 = await ethers.getContractAt(ERC20_ABI, token1Address);
  
  const symbol0 = await token0.symbol();
  const symbol1 = await token1.symbol();
  
  console.log(`Token 0: ${symbol0} (${token0Address})`);
  console.log(`Token 1: ${symbol1} (${token1Address})\n`);

  // Récupération des réserves
  const reserves = await pair.getReserves();
  const reserve0 = reserves[0];
  const reserve1 = reserves[1];
  
  console.log("💧 Réserves du pool:");
  console.log(`  ${symbol0}: ${formatUnits(reserve0, 18)} tokens`);
  console.log(`  ${symbol1}: ${formatUnits(reserve1, 18)} tokens\n`);

  // Vérification des LP tokens de l'utilisateur
  const userLpBalance = await pair.balanceOf(USER_ADDRESS);
  const totalSupply = await pair.totalSupply();
  
  console.log("🎯 Position de liquidité de l'utilisateur:");
  console.log(`  LP tokens: ${formatUnits(userLpBalance, 18)}`);
  console.log(`  Total supply: ${formatUnits(totalSupply, 18)}`);
  
  if (totalSupply > 0n) {
    const sharePercentage = (Number(userLpBalance) / Number(totalSupply)) * 100;
    console.log(`  Part du pool: ${sharePercentage.toFixed(2)}%\n`);
    
    // Calcul des tokens poolés
    const pooledToken0 = (userLpBalance * reserve0) / totalSupply;
    const pooledToken1 = (userLpBalance * reserve1) / totalSupply;
    
    console.log("💰 Tokens poolés par l'utilisateur:");
    console.log(`  ${symbol0}: ${formatUnits(pooledToken0, 18)}`);
    console.log(`  ${symbol1}: ${formatUnits(pooledToken1, 18)}\n`);
  }

  // Vérification des balances USDC/USDT de l'utilisateur
  const usdc = await ethers.getContractAt(ERC20_ABI, USDC_ADDRESS);
  const usdt = await ethers.getContractAt(ERC20_ABI, USDT_ADDRESS);
  
  const usdcBalance = await usdc.balanceOf(USER_ADDRESS);
  const usdtBalance = await usdt.balanceOf(USER_ADDRESS);
  
  console.log("💼 Balances restantes de l'utilisateur:");
  console.log(`  USDC: ${formatUnits(usdcBalance, 18)}`);
  console.log(`  USDT: ${formatUnits(usdtBalance, 18)}\n`);

  console.log("✅ Vérification terminée!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
