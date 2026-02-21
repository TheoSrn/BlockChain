// Script pour faire une transaction de test
// Cela va générer un événement que l'indexer détectera
// Usage: node make-test-transaction.js

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config({ path: '../contracts/.env' });

const RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/SWik4ageW7yrIlrkLaa62';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Adresse du contrat USDT de test
const USDT_ADDRESS = '0x8AF094699d79a10Dffc243054d83FC888c4D1760';

// ABI minimal pour Transfer et Approval
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function symbol() view returns (string)',
];

async function makeTestTransaction() {
  console.log('\n========================================');
  console.log('  GÉNÉRATION D\'UNE TRANSACTION TEST');
  console.log('========================================\n');

  if (!PRIVATE_KEY) {
    console.log('❌ PRIVATE_KEY non trouvée dans contracts/.env');
    console.log('\n💡 Alternative: Fais une transaction manuellement:');
    console.log('   1. Va sur https://sepolia.etherscan.io/');
    console.log(`   2. Visite le contrat USDT: ${USDT_ADDRESS}`);
    console.log('   3. Onglet "Write Contract"');
    console.log('   4. Connecte ton wallet');
    console.log('   5. Fais un transfer() ou approve()');
    console.log('   6. Attends 60 secondes');
    console.log('   7. L\'événement apparaîtra dans l\'indexer!\n');
    process.exit(1);
  }

  try {
    console.log('🔌 Connexion au réseau Sepolia...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`✅ Wallet connecté: ${wallet.address}`);
    
    // Vérifier le solde
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Solde ETH: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther('0.001')) {
      console.log('❌ Solde ETH insuffisant (besoin de ~0.001 ETH pour les frais)');
      console.log('   Utilise un faucet Sepolia: https://sepoliafaucet.com/\n');
      process.exit(1);
    }
    
    // Connexion au contrat USDT
    const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, wallet);
    const symbol = await usdt.symbol();
    const usdtBalance = await usdt.balanceOf(wallet.address);
    
    console.log(`\n📄 Contrat: ${symbol} (${USDT_ADDRESS})`);
    console.log(`💵 Solde ${symbol}: ${ethers.formatEther(usdtBalance)} ${symbol}`);
    
    // Faire un approve de 1 token comme test
    console.log('\n🚀 Envoi d\'une transaction approve()...');
    console.log('   (Cette transaction sera détectée par l\'indexer)');
    
    const spenderAddress = '0x0000000000000000000000000000000000000001'; // Adresse dummy
    const amount = ethers.parseEther('1'); // 1 token
    
    const tx = await usdt.approve(spenderAddress, amount);
    console.log(`\n✅ Transaction envoyée!`);
    console.log(`   Hash: ${tx.hash}`);
    console.log(`   Lien: https://sepolia.etherscan.io/tx/${tx.hash}`);
    
    console.log('\n⏳ Attente de la confirmation...');
    const receipt = await tx.wait();
    
    console.log(`✅ Transaction confirmée au bloc ${receipt.blockNumber}`);
    console.log(`   Gas utilisé: ${receipt.gasUsed.toString()}`);
    
    console.log('\n🎯 MAINTENANT:');
    console.log('   1. L\'indexer va détecter cet événement dans les ~60 prochaines secondes');
    console.log('   2. Regarde le terminal du test WebSocket');
    console.log('   3. Ou lance: curl "http://localhost:3030/events?limit=5"');
    console.log('   4. Tu verras l\'événement "Approval" apparaître!\n');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log('\n💡 Ton wallet n\'a pas assez d\'ETH pour les gas fees');
      console.log('   Utilise un faucet Sepolia: https://sepoliafaucet.com/\n');
    }
    process.exit(1);
  }
}

makeTestTransaction();
