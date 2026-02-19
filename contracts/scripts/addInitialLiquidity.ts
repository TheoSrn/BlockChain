import { ethers } from "hardhat";

/**
 * Script pour ajouter liquidité initiale aux pools Uniswap V2
 * Ajoute 5,000 USDC + 5,000 USDT au pool USDC/USDT
 */

const UNISWAP_V2_ROUTER = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
const UNISWAP_V2_FACTORY = "0x7E0987E5b3a30e3f2828572Bb659A548460a3003";
const USDC_ADDRESS = "0x461Ca34a940680c2e34E6928F54BF38D0a29C494";
const USDT_ADDRESS = "0xf7d3677312e147c857e596583eB31185cf2b70e9";

// ABI minimal
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
];

const ROUTER_ABI = [
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
];

const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
];

const PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
];

async function main() {
  console.log("💧 Adding Initial Liquidity to Uniswap V2 Pools\n");
  console.log("=".repeat(70));

  const [signer] = await ethers.getSigners();
  const signerAddress = signer.address;
  console.log(`\n👤 Your address: ${signerAddress}\n`);

  // Connecter aux contrats
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
  const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
  const router = new ethers.Contract(UNISWAP_V2_ROUTER, ROUTER_ABI, signer);
  const factory = new ethers.Contract(UNISWAP_V2_FACTORY, FACTORY_ABI, signer);

  // Vérifier les balances
  console.log("📊 Checking balances...\n");
  const usdcBalance = await usdc.balanceOf(signerAddress);
  const usdtBalance = await usdt.balanceOf(signerAddress);
  const usdcDecimals = await usdc.decimals();
  const usdtDecimals = await usdt.decimals();

  console.log(`   USDC Balance: ${ethers.formatUnits(usdcBalance, usdcDecimals)} USDC`);
  console.log(`   USDT Balance: ${ethers.formatUnits(usdtBalance, usdtDecimals)} USDT\n`);

  // Montants à ajouter (5,000 de chaque)
  const amountUSDC = ethers.parseUnits("5000", usdcDecimals);
  const amountUSDT = ethers.parseUnits("5000", usdtDecimals);

  // Vérifier qu'on a assez
  if (usdcBalance < amountUSDC) {
    console.log(`❌ Insufficient USDC balance. Need 5000, have ${ethers.formatUnits(usdcBalance, usdcDecimals)}`);
    return;
  }
  if (usdtBalance < amountUSDT) {
    console.log(`❌ Insufficient USDT balance. Need 5000, have ${ethers.formatUnits(usdtBalance, usdtDecimals)}`);
    return;
  }

  // Vérifier que le pool existe
  const pairAddress = await factory.getPair(USDC_ADDRESS, USDT_ADDRESS);
  if (pairAddress === "0x0000000000000000000000000000000000000000") {
    console.log("❌ Pool doesn't exist! Run createLiquidityPools.ts first.");
    return;
  }
  console.log(`✅ Pool exists: ${pairAddress}\n`);

  // Vérifier les allowances
  console.log("🔐 Checking allowances...\n");
  const usdcAllowance = await usdc.allowance(signerAddress, UNISWAP_V2_ROUTER);
  const usdtAllowance = await usdt.allowance(signerAddress, UNISWAP_V2_ROUTER);

  // Approuver USDC si nécessaire
  if (usdcAllowance < amountUSDC) {
    console.log("🔓 Approving USDC...");
    const approveTx = await usdc.approve(UNISWAP_V2_ROUTER, amountUSDC);
    console.log(`   Tx: ${approveTx.hash}`);
    await approveTx.wait();
    console.log("   ✅ USDC approved\n");
  } else {
    console.log("✅ USDC already approved\n");
  }

  // Approuver USDT si nécessaire
  if (usdtAllowance < amountUSDT) {
    console.log("🔓 Approving USDT...");
    const approveTx = await usdt.approve(UNISWAP_V2_ROUTER, amountUSDT);
    console.log(`   Tx: ${approveTx.hash}`);
    await approveTx.wait();
    console.log("   ✅ USDT approved\n");
  } else {
    console.log("✅ USDT already approved\n");
  }

  // Ajouter la liquidité
  console.log("💧 Adding liquidity...\n");
  console.log(`   Adding: 5,000 USDC + 5,000 USDT`);
  console.log(`   Slippage: 0.5% (minimum 4,975 each)\n`);

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
  const amountAMin = amountUSDC * 995n / 1000n; // 0.5% slippage
  const amountBMin = amountUSDT * 995n / 1000n;

  try {
    const tx = await router.addLiquidity(
      USDC_ADDRESS,
      USDT_ADDRESS,
      amountUSDC,
      amountUSDT,
      amountAMin,
      amountBMin,
      signerAddress,
      deadline
    );

    console.log(`⏳ Transaction sent: ${tx.hash}`);
    console.log(`   🔗 https://sepolia.etherscan.io/tx/${tx.hash}\n`);

    const receipt = await tx.wait();
    console.log("✅ Liquidity added successfully!\n");
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);

    // Récupérer les LP tokens
    const pair = new ethers.Contract(pairAddress, PAIR_ABI, signer);
    const lpBalance = await pair.balanceOf(signerAddress);
    const lpTotalSupply = await pair.totalSupply();
    
    console.log(`\n💰 LP Token Info:`);
    console.log(`   Your LP Balance: ${ethers.formatEther(lpBalance)}`);
    console.log(`   Total LP Supply: ${ethers.formatEther(lpTotalSupply)}`);
    console.log(`   Your Pool Share: ${(Number(lpBalance) * 100 / Number(lpTotalSupply)).toFixed(2)}%`);

    // Afficher les réserves
    const reserves = await pair.getReserves();
    const token0 = await pair.token0();
    const isToken0USDC = token0.toLowerCase() === USDC_ADDRESS.toLowerCase();
    
    const reserve0 = reserves[0];
    const reserve1 = reserves[1];
    
    console.log(`\n📊 Pool Reserves:`);
    if (isToken0USDC) {
      console.log(`   USDC: ${ethers.formatUnits(reserve0, usdcDecimals)}`);
      console.log(`   USDT: ${ethers.formatUnits(reserve1, usdtDecimals)}`);
    } else {
      console.log(`   USDT: ${ethers.formatUnits(reserve0, usdtDecimals)}`);
      console.log(`   USDC: ${ethers.formatUnits(reserve1, usdcDecimals)}`);
    }

    console.log(`\n${"=".repeat(70)}`);
    console.log("🎉 SUCCESS!");
    console.log(`${"=".repeat(70)}`);
    console.log("\n✅ Pool USDC/USDT is now ready for trading!");
    console.log("✅ You can now test swaps in your frontend!");
    console.log(`\n🔗 View pool on Etherscan: https://sepolia.etherscan.io/address/${pairAddress}`);
    console.log(`${"=".repeat(70)}\n`);

  } catch (error: any) {
    console.log(`\n❌ Error adding liquidity: ${error.message}`);
    if (error.data) {
      console.log(`   Error data: ${error.data}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
