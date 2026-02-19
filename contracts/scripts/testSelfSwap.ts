import { ethers } from "hardhat";
import { formatUnits, parseUnits } from "ethers";

// Adresses des contrats
const UNISWAP_V2_ROUTER = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
const UNISWAP_V2_FACTORY = "0x7E0987E5b3a30e3f2828572Bb659A548460a3003";
const USDC_ADDRESS = "0x461Ca34a940680c2e34E6928F54BF38D0a29C494";
const USDT_ADDRESS = "0xf7d3677312e147c857e596583eB31185cf2b70e9";

// ABIs
const ROUTER_ABI = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
];

const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
];

const PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
];

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function symbol() external view returns (string)",
];

async function main() {
  const [signer] = await ethers.getSigners();
  const userAddress = signer.address;

  console.log("🧪 Test: Swap sur son propre pool de liquidité\n");
  console.log(`👤 Utilisateur: ${userAddress}\n`);

  // Connexion aux contrats
  const factory = await ethers.getContractAt(FACTORY_ABI, UNISWAP_V2_FACTORY);
  const usdc = await ethers.getContractAt(ERC20_ABI, USDC_ADDRESS);
  const usdt = await ethers.getContractAt(ERC20_ABI, USDT_ADDRESS);
  const router = await ethers.getContractAt(ROUTER_ABI, UNISWAP_V2_ROUTER);

  // Récupérer l'adresse du pool
  const pairAddress = await factory.getPair(USDC_ADDRESS, USDT_ADDRESS);
  const pair = await ethers.getContractAt(PAIR_ABI, pairAddress);

  console.log("📊 ÉTAT AVANT LE SWAP\n");
  console.log("=".repeat(50));

  // Balances utilisateur AVANT
  const usdcBalanceBefore = await usdc.balanceOf(userAddress);
  const usdtBalanceBefore = await usdt.balanceOf(userAddress);
  console.log(`\n💼 Balances de l'utilisateur:`);
  console.log(`  USDC: ${formatUnits(usdcBalanceBefore, 18)}`);
  console.log(`  USDT: ${formatUnits(usdtBalanceBefore, 18)}`);

  // Réserves du pool AVANT
  const reservesBefore = await pair.getReserves();
  const token0 = await pair.token0();
  const isToken0USDC = token0.toLowerCase() === USDC_ADDRESS.toLowerCase();
  const usdcReserveBefore = isToken0USDC ? reservesBefore[0] : reservesBefore[1];
  const usdtReserveBefore = isToken0USDC ? reservesBefore[1] : reservesBefore[0];
  
  console.log(`\n💧 Réserves du pool:`);
  console.log(`  USDC: ${formatUnits(usdcReserveBefore, 18)}`);
  console.log(`  USDT: ${formatUnits(usdtReserveBefore, 18)}`);

  // Position LP AVANT
  const lpBalanceBefore = await pair.balanceOf(userAddress);
  const totalSupplyBefore = await pair.totalSupply();
  const poolShareBefore = (Number(lpBalanceBefore) * 100 / Number(totalSupplyBefore)).toFixed(4);
  
  console.log(`\n🎯 Position de liquidité:`);
  console.log(`  LP tokens: ${formatUnits(lpBalanceBefore, 18)}`);
  console.log(`  Part du pool: ${poolShareBefore}%`);

  // Calcul de la valeur des LP tokens AVANT
  const userShareBefore = Number(lpBalanceBefore) / Number(totalSupplyBefore);
  const pooledUsdcBefore = Number(formatUnits(usdcReserveBefore, 18)) * userShareBefore;
  const pooledUsdtBefore = Number(formatUnits(usdtReserveBefore, 18)) * userShareBefore;
  
  console.log(`\n💰 Tokens poolés (valeur des LP):`);
  console.log(`  USDC poolé: ${pooledUsdcBefore.toFixed(6)}`);
  console.log(`  USDT poolé: ${pooledUsdtBefore.toFixed(6)}`);

  // SWAP: 100 USDC → USDT
  const swapAmount = parseUnits("100", 18);
  console.log("\n" + "=".repeat(50));
  console.log(`\n🔄 EXÉCUTION DU SWAP: 100 USDC → USDT\n`);

  // Approuver le Router
  console.log("⏳ Approval en cours...");
  const approveTx = await usdc.approve(UNISWAP_V2_ROUTER, swapAmount);
  await approveTx.wait();
  console.log("✅ Approval confirmé");

  // Effectuer le swap
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const path = [USDC_ADDRESS, USDT_ADDRESS];
  const amountOutMin = 0; // Pour ce test, on accepte n'importe quel montant

  console.log("⏳ Swap en cours...");
  const swapTx = await router.swapExactTokensForTokens(
    swapAmount,
    amountOutMin,
    path,
    userAddress,
    deadline
  );
  const receipt = await swapTx.wait();
  console.log(`✅ Swap confirmé! (Gas: ${receipt?.gasUsed.toString()})`);

  console.log("\n" + "=".repeat(50));
  console.log("📊 ÉTAT APRÈS LE SWAP\n");
  console.log("=".repeat(50));

  // Balances utilisateur APRÈS
  const usdcBalanceAfter = await usdc.balanceOf(userAddress);
  const usdtBalanceAfter = await usdt.balanceOf(userAddress);
  console.log(`\n💼 Balances de l'utilisateur:`);
  console.log(`  USDC: ${formatUnits(usdcBalanceAfter, 18)}`);
  console.log(`  USDT: ${formatUnits(usdtBalanceAfter, 18)}`);

  // Réserves du pool APRÈS
  const reservesAfter = await pair.getReserves();
  const usdcReserveAfter = isToken0USDC ? reservesAfter[0] : reservesAfter[1];
  const usdtReserveAfter = isToken0USDC ? reservesAfter[1] : reservesAfter[0];
  
  console.log(`\n💧 Réserves du pool:`);
  console.log(`  USDC: ${formatUnits(usdcReserveAfter, 18)}`);
  console.log(`  USDT: ${formatUnits(usdtReserveAfter, 18)}`);

  // Position LP APRÈS
  const lpBalanceAfter = await pair.balanceOf(userAddress);
  const totalSupplyAfter = await pair.totalSupply();
  const poolShareAfter = (Number(lpBalanceAfter) * 100 / Number(totalSupplyAfter)).toFixed(4);
  
  console.log(`\n🎯 Position de liquidité:`);
  console.log(`  LP tokens: ${formatUnits(lpBalanceAfter, 18)}`);
  console.log(`  Part du pool: ${poolShareAfter}%`);

  // Calcul de la valeur des LP tokens APRÈS
  const userShareAfter = Number(lpBalanceAfter) / Number(totalSupplyAfter);
  const pooledUsdcAfter = Number(formatUnits(usdcReserveAfter, 18)) * userShareAfter;
  const pooledUsdtAfter = Number(formatUnits(usdtReserveAfter, 18)) * userShareAfter;
  
  console.log(`\n💰 Tokens poolés (valeur des LP):`);
  console.log(`  USDC poolé: ${pooledUsdcAfter.toFixed(6)}`);
  console.log(`  USDT poolé: ${pooledUsdtAfter.toFixed(6)}`);

  // ANALYSE DES RÉSULTATS
  console.log("\n" + "=".repeat(50));
  console.log("📈 ANALYSE DES RÉSULTATS\n");
  console.log("=".repeat(50));

  // Variation des balances
  const usdcDiff = Number(formatUnits(usdcBalanceAfter - usdcBalanceBefore, 18));
  const usdtDiff = Number(formatUnits(usdtBalanceAfter - usdtBalanceBefore, 18));
  
  console.log(`\n💳 Variation des balances de l'utilisateur:`);
  console.log(`  USDC: ${usdcDiff > 0 ? '+' : ''}${usdcDiff.toFixed(6)} (${usdcDiff < 0 ? 'payé' : 'reçu'})`);
  console.log(`  USDT: ${usdtDiff > 0 ? '+' : ''}${usdtDiff.toFixed(6)} (${usdtDiff < 0 ? 'payé' : 'reçu'})`);

  // Variation des réserves (= frais accumulés dans le pool)
  const usdcReserveDiff = Number(formatUnits(usdcReserveAfter - usdcReserveBefore, 18));
  const usdtReserveDiff = Number(formatUnits(usdtReserveAfter - usdtReserveBefore, 18));
  
  console.log(`\n💧 Variation des réserves du pool:`);
  console.log(`  USDC: ${usdcReserveDiff > 0 ? '+' : ''}${usdcReserveDiff.toFixed(6)}`);
  console.log(`  USDT: ${usdtReserveDiff > 0 ? '+' : ''}${usdtReserveDiff.toFixed(6)}`);

  // Frais gagnés via les LP tokens
  const lpUsdcGain = pooledUsdcAfter - pooledUsdcBefore;
  const lpUsdtGain = pooledUsdtAfter - pooledUsdtBefore;
  
  console.log(`\n💰 Gains via position de liquidité (valeur des LP):`);
  console.log(`  USDC: ${lpUsdcGain > 0 ? '+' : ''}${lpUsdcGain.toFixed(6)}`);
  console.log(`  USDT: ${lpUsdtGain > 0 ? '+' : ''}${lpUsdtGain.toFixed(6)}`);

  // Calcul des frais théoriques (0.3%)
  const theoreticalFees = 100 * 0.003;
  console.log(`\n💵 Frais théoriques (0.3% de 100 USDC): ${theoreticalFees.toFixed(6)} USDC`);

  // Bilan net
  const netUsdcChange = usdcDiff + lpUsdcGain;
  const netUsdtChange = usdtDiff + lpUsdtGain;
  
  console.log(`\n🎯 BILAN NET (balances + LP value):`);
  console.log(`  USDC net: ${netUsdcChange > 0 ? '+' : ''}${netUsdcChange.toFixed(6)}`);
  console.log(`  USDT net: ${netUsdtChange > 0 ? '+' : ''}${netUsdtChange.toFixed(6)}`);

  console.log(`\n📝 CONCLUSION:`);
  if (Math.abs(netUsdcChange) < 0.01 && Math.abs(netUsdtChange) < 0.01) {
    console.log(`  ✅ Comme prévu: swap sur son propre pool = coût net ≈ 0`);
    console.log(`  ✅ Les frais payés en tant que swapper (≈${theoreticalFees.toFixed(3)} USDC)`);
    console.log(`  ✅ ...sont récupérés en tant que LP (${lpUsdcGain.toFixed(6)} USDC dans le pool)`);
  } else {
    console.log(`  ⚠️ Variation nette détectée (due au slippage et à la formule x*y=k)`);
  }

  console.log("\n✅ Test terminé!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
