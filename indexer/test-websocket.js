// Test WebSocket de l'indexer
// Usage: node test-websocket.js

import WebSocket from 'ws';

console.log('\n========================================');
console.log('  TEST WEBSOCKET - INDEXER EN TEMPS RÉEL');
console.log('========================================\n');

const ws = new WebSocket('ws://localhost:3030/events/stream');

let eventCount = 0;
let startTime = Date.now();

ws.on('open', () => {
  console.log('✅ Connecté au stream d\'événements\n');
  console.log('📡 En attente de nouveaux événements blockchain...');
  console.log('   (Les événements apparaîtront toutes les ~60s lors de la synchronisation)\n');
  console.log('💡 Astuce: Fais une transaction on-chain pour voir un événement en temps réel !');
  console.log('   (Transfer, Swap, Approval, etc.)\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

ws.on('message', (data) => {
  try {
    const event = JSON.parse(data);
    
    // Message de connexion initial
    if (event.type === 'connected') {
      console.log(`📢 ${event.message}`);
      console.log(`   Timestamp: ${new Date(event.timestamp).toLocaleString()}\n`);
      return;
    }
    
    // Nouvel événement blockchain
    eventCount++;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n🔔 NOUVEL ÉVÉNEMENT #${eventCount} (après ${elapsed}s)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Type: ${event.eventType} (${event.eventName})`);
    console.log(`🏭 Contrat: ${event.contractTag}`);
    console.log(`   Adresse: ${event.contractAddress}`);
    console.log(`📦 Bloc: ${event.blockNumber}`);
    console.log(`🔗 TX: ${event.transactionHash}`);
    console.log(`⏰ Timestamp: ${new Date(event.timestamp * 1000).toLocaleString()}`);
    
    if (event.from) {
      console.log(`👤 From: ${event.from}`);
    }
    if (event.to) {
      console.log(`👤 To: ${event.to}`);
    }
    if (event.amount) {
      console.log(`💰 Amount: ${event.amount}`);
    }
    if (event.amount0) {
      console.log(`💰 Amount In: ${event.amount0}`);
    }
    if (event.amount1) {
      console.log(`💰 Amount Out: ${event.amount1}`);
    }
    
    // Afficher les arguments bruts pour debug
    if (Object.keys(event.args).length > 0) {
      console.log(`\n📝 Arguments détaillés:`);
      Object.entries(event.args).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          console.log(`   • ${key}: ${value}`);
        }
      });
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ Erreur parsing événement:', error.message);
    console.log('   Raw data:', data.toString());
  }
});

ws.on('error', (error) => {
  console.error('\n❌ Erreur WebSocket:', error.message);
  console.log('\n💡 Vérifications:');
  console.log('   1. L\'indexer tourne-t-il ? (npm run dev dans indexer/)');
  console.log('   2. Le port 3030 est-il correct ? (vérifier indexer/.env)');
  process.exit(1);
});

ws.on('close', (code, reason) => {
  console.log(`\n🔌 Connexion fermée`);
  console.log(`   Code: ${code}`);
  console.log(`   Raison: ${reason || 'N/A'}`);
  console.log(`   Total événements reçus: ${eventCount}`);
  console.log(`   Durée: ${((Date.now() - startTime) / 1000).toFixed(1)}s\n`);
  process.exit(0);
});

// Gérer Ctrl+C proprement
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Arrêt du test WebSocket...');
  ws.close();
});

// Info toutes les 30 secondes si aucun événement
setInterval(() => {
  if (eventCount === 0) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    console.log(`⏳ En attente... (${elapsed}s écoulées)`);
    console.log('   💡 Les événements sont synchronisés toutes les ~60 secondes');
  }
}, 30000);
