# Script de test pour l'indexer
# Usage: .\test-indexer.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST DE L'INDEXER - SUITE COMPLÈTE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3030"

# Test 1: Health Check
Write-Host "📊 Test 1: Health Check" -ForegroundColor Yellow
Write-Host "URL: $baseUrl/health`n" -ForegroundColor Gray
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Status: $($health.status)" -ForegroundColor Green
    Write-Host "   Service: $($health.service)" -ForegroundColor White
    Write-Host "   Chain ID: $($health.chainId)" -ForegroundColor White
    Write-Host "   Dernier bloc sync: $($health.lastSyncedBlock)" -ForegroundColor White
    Write-Host "   Total événements: $($health.totalEvents)" -ForegroundColor White
    Write-Host "   Polling interval: $($health.pollIntervalMs)ms ($($health.pollIntervalMs/1000)s)" -ForegroundColor White
    Write-Host "   Contrats trackés: $($health.trackedContracts.Count)" -ForegroundColor White
} catch {
    Write-Host "❌ ÉCHEC: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test 2: Liste des événements (5 derniers)
Write-Host "`n📋 Test 2: Récupération des 5 derniers événements" -ForegroundColor Yellow
Write-Host "URL: $baseUrl/events?limit=5`n" -ForegroundColor Gray
try {
    $events = Invoke-RestMethod -Uri "$baseUrl/events?limit=5" -Method Get
    Write-Host "✅ Récupéré: $($events.events.Count) événements" -ForegroundColor Green
    
    foreach ($event in $events.events) {
        Write-Host "`n   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Host "   Type: $($event.eventType)" -ForegroundColor Cyan
        Write-Host "   Contrat: $($event.contractTag) ($($event.contractAddress.Substring(0,10))...)" -ForegroundColor White
        Write-Host "   Bloc: $($event.blockNumber)" -ForegroundColor White
        Write-Host "   TX: $($event.transactionHash.Substring(0,20))..." -ForegroundColor DarkGray
        if ($event.from) { Write-Host "   From: $($event.from.Substring(0,10))..." -ForegroundColor White }
        if ($event.to) { Write-Host "   To: $($event.to.Substring(0,10))..." -ForegroundColor White }
        if ($event.amount) { Write-Host "   Amount: $($event.amount)" -ForegroundColor Yellow }
        if ($event.amount0) { Write-Host "   Amount0: $($event.amount0)" -ForegroundColor Yellow }
        if ($event.amount1) { Write-Host "   Amount1: $($event.amount1)" -ForegroundColor Yellow }
    }
} catch {
    Write-Host "❌ ÉCHEC: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test 3: Filtrer par type (Swaps)
Write-Host "`n`n🔄 Test 3: Filtrer les événements de type 'Swap'" -ForegroundColor Yellow
Write-Host "URL: $baseUrl/events?type=Swap&limit=5`n" -ForegroundColor Gray
try {
    $swaps = Invoke-RestMethod -Uri "$baseUrl/events?type=Swap&limit=5" -Method Get
    Write-Host "✅ Trouvé: $($swaps.events.Count) swaps" -ForegroundColor Green
    
    foreach ($swap in $swaps.events) {
        Write-Host "`n   📈 Swap au bloc $($swap.blockNumber)" -ForegroundColor Cyan
        Write-Host "      Trader: $($swap.from)" -ForegroundColor White
        if ($swap.amount0) { Write-Host "      In: $($swap.amount0)" -ForegroundColor Yellow }
        if ($swap.amount1) { Write-Host "      Out: $($swap.amount1)" -ForegroundColor Yellow }
    }
} catch {
    Write-Host "   ℹ️  Aucun swap trouvé (normal si aucun swap n'a été fait)" -ForegroundColor DarkYellow
}

Start-Sleep -Seconds 1

# Test 4: Filtrer par type (Transfers)
Write-Host "`n`n💸 Test 4: Filtrer les événements de type 'Transfer'" -ForegroundColor Yellow
Write-Host "URL: $baseUrl/events?type=Transfer&limit=5`n" -ForegroundColor Gray
try {
    $transfers = Invoke-RestMethod -Uri "$baseUrl/events?type=Transfer&limit=5" -Method Get
    Write-Host "✅ Trouvé: $($transfers.events.Count) transfers" -ForegroundColor Green
    
    foreach ($transfer in $transfers.events) {
        Write-Host "`n   💰 Transfer au bloc $($transfer.blockNumber)" -ForegroundColor Cyan
        Write-Host "      De: $($transfer.from.Substring(0,15))..." -ForegroundColor White
        Write-Host "      À: $($transfer.to.Substring(0,15))..." -ForegroundColor White
        Write-Host "      Montant: $($transfer.amount)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ ÉCHEC: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test 5: Filtrer par contrat
Write-Host "`n`n🏭 Test 5: Événements du contrat Factory" -ForegroundColor Yellow
Write-Host "URL: $baseUrl/events?contract=0xcD10F4847908eBBe7BAc14664F777c600b5f5Fd8&limit=5`n" -ForegroundColor Gray
try {
    $factoryEvents = Invoke-RestMethod -Uri "$baseUrl/events?contract=0xcD10F4847908eBBe7BAc14664F777c600b5f5Fd8&limit=5" -Method Get
    Write-Host "✅ Trouvé: $($factoryEvents.events.Count) événements factory" -ForegroundColor Green
    
    foreach ($evt in $factoryEvents.events) {
        Write-Host "`n   🏭 $($evt.eventType) au bloc $($evt.blockNumber)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ℹ️  Aucun événement factory trouvé" -ForegroundColor DarkYellow
}

Start-Sleep -Seconds 1

# Test 6: Vérifier les types d'événements disponibles
Write-Host "`n`n📊 Test 6: Analyse des types d'événements" -ForegroundColor Yellow
Write-Host "URL: $baseUrl/events?limit=100`n" -ForegroundColor Gray
try {
    $allEvents = Invoke-RestMethod -Uri "$baseUrl/events?limit=100" -Method Get
    $eventTypes = $allEvents.events | Group-Object -Property eventType | Sort-Object Count -Descending
    
    Write-Host "✅ Types d'événements détectés:" -ForegroundColor Green
    foreach ($type in $eventTypes) {
        Write-Host "   • $($type.Name): $($type.Count) événements" -ForegroundColor White
    }
} catch {
    Write-Host "❌ ÉCHEC: $($_.Exception.Message)" -ForegroundColor Red
}

# Résumé final
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host "  RÉSUMÉ DES TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

try {
    $finalHealth = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "`n✅ Indexer opérationnel" -ForegroundColor Green
    Write-Host "   • Bloc actuel: $($finalHealth.lastSyncedBlock)" -ForegroundColor White
    Write-Host "   • Total événements: $($finalHealth.totalEvents)" -ForegroundColor White
    Write-Host "   • Synchronisation: toutes les $($finalHealth.pollIntervalMs/1000)s" -ForegroundColor White
    Write-Host "`n💡 Endpoints disponibles:" -ForegroundColor Yellow
    Write-Host "   • Health: $baseUrl/health" -ForegroundColor White
    Write-Host "   • Events: $baseUrl/events" -ForegroundColor White
    Write-Host "   • WebSocket: ws://localhost:3030/events/stream" -ForegroundColor White
} catch {
    Write-Host "`n❌ Indexer ne répond pas" -ForegroundColor Red
}

Write-Host "`n"
