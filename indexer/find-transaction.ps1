# Script pour rechercher une transaction spécifique dans l'indexer
# Usage: .\find-transaction.ps1 -TxHash "0x..."

param(
    [Parameter(Mandatory=$true)]
    [string]$TxHash
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RECHERCHE DE TRANSACTION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3030"
$txHashLower = $TxHash.ToLower()

Write-Host "🔍 Transaction recherchée:" -ForegroundColor Yellow
Write-Host "   $TxHash`n" -ForegroundColor White
Write-Host "🔗 Lien Etherscan:" -ForegroundColor Yellow
Write-Host "   https://sepolia.etherscan.io/tx/$TxHash`n" -ForegroundColor Blue

# Vérifier le health de l'indexer
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Indexer opérationnel" -ForegroundColor Green
    Write-Host "   Dernier bloc sync: $($health.lastSyncedBlock)" -ForegroundColor White
    Write-Host "   Total événements: $($health.totalEvents)" -ForegroundColor White
    Write-Host "`n📊 Contrats trackés:" -ForegroundColor Cyan
    foreach ($contract in $health.trackedContracts) {
        Write-Host "   • $($contract.tag): $($contract.address)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Indexer ne répond pas" -ForegroundColor Red
    Write-Host "   Vérifie qu'il tourne avec: curl http://localhost:3030/health`n" -ForegroundColor Yellow
    exit 1
}

# Rechercher dans tous les événements
Write-Host "`n🔎 Recherche dans les événements indexés...`n" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/events?limit=1000" -Method Get
    $found = $response.events | Where-Object { $_.transactionHash.ToLower() -eq $txHashLower }
    
    if ($found) {
        Write-Host "✅ TRANSACTION TROUVÉE !`n" -ForegroundColor Green
        
        if ($found -is [array]) {
            Write-Host "   Nombre d'événements dans cette transaction: $($found.Count)`n" -ForegroundColor Cyan
            
            foreach ($event in $found) {
                Write-Host "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
                Write-Host "   Type: $($event.eventType) ($($event.eventName))" -ForegroundColor Yellow
                Write-Host "   Contrat: $($event.contractTag)" -ForegroundColor White
                Write-Host "   Adresse contrat: $($event.contractAddress)" -ForegroundColor Gray
                Write-Host "   Bloc: $($event.blockNumber)" -ForegroundColor White
                Write-Host "   Log Index: $($event.logIndex)" -ForegroundColor Gray
                Write-Host "   Date: $(([DateTimeOffset]::FromUnixTimeSeconds($event.timestamp)).LocalDateTime)" -ForegroundColor Gray
                
                if ($event.from) { Write-Host "   From: $($event.from)" -ForegroundColor Cyan }
                if ($event.to) { Write-Host "   To: $($event.to)" -ForegroundColor Cyan }
                if ($event.amount) { Write-Host "   Amount: $($event.amount)" -ForegroundColor Green }
                if ($event.amount0) { Write-Host "   Amount In: $($event.amount0)" -ForegroundColor Green }
                if ($event.amount1) { Write-Host "   Amount Out: $($event.amount1)" -ForegroundColor Green }
            }
        } else {
            Write-Host "   Type: $($found.eventType) ($($found.eventName))" -ForegroundColor Yellow
            Write-Host "   Contrat: $($found.contractTag)" -ForegroundColor White
            Write-Host "   Adresse contrat: $($found.contractAddress)" -ForegroundColor Gray
            Write-Host "   Bloc: $($found.blockNumber)" -ForegroundColor White
            Write-Host "   Date: $(([DateTimeOffset]::FromUnixTimeSeconds($found.timestamp)).LocalDateTime)" -ForegroundColor Gray
            
            if ($found.from) { Write-Host "   From: $($found.from)" -ForegroundColor Cyan }
            if ($found.to) { Write-Host "   To: $($found.to)" -ForegroundColor Cyan }
            if ($found.amount) { Write-Host "   Amount: $($found.amount)" -ForegroundColor Green }
        }
        
        Write-Host "`n✅ L'indexer a bien détecté ta transaction !`n" -ForegroundColor Green
        
    } else {
        Write-Host "❌ TRANSACTION NON TROUVÉE`n" -ForegroundColor Red
        
        Write-Host "💡 Raisons possibles:" -ForegroundColor Yellow
        Write-Host "   1. La transaction n'est pas encore confirmée" -ForegroundColor White
        Write-Host "      → Vérifie sur Etherscan qu'elle est confirmée`n" -ForegroundColor Gray
        
        Write-Host "   2. L'indexer n'a pas encore synchronisé ce bloc (il poll toutes les 60s)" -ForegroundColor White
        Write-Host "      → Attends 1 minute et relance ce script`n" -ForegroundColor Gray
        
        Write-Host "   3. La transaction concerne un contrat NON tracké" -ForegroundColor White
        Write-Host "      → L'indexer ne tracke que les contrats listés ci-dessus" -ForegroundColor Gray
        Write-Host "      → Si tu as transféré de l'ETH directement, ce n'est PAS tracké" -ForegroundColor Gray
        Write-Host "      → Si tu as utilisé un autre token ERC20, il faut l'ajouter à la config`n" -ForegroundColor Gray
        
        Write-Host "🧪 Pour tester avec un contrat tracké:" -ForegroundColor Cyan
        Write-Host "   1. Fais un transfer sur le contrat USDT:" -ForegroundColor White
        Write-Host "      https://sepolia.etherscan.io/token/0x8AF094699d79a10Dffc243054d83FC888c4D1760#writeContract" -ForegroundColor Blue
        Write-Host "   2. Attends 60 secondes" -ForegroundColor White
        Write-Host "   3. Relance ce script avec le nouveau hash`n" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Erreur lors de la recherche: $($_.Exception.Message)`n" -ForegroundColor Red
}

Write-Host ""
