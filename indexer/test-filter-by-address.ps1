# Test de filtrage par adresse
# Usage: .\test-filter-by-address.ps1 <adresse>

param(
    [Parameter(Mandatory=$false)]
    [string]$Address = "0x17e08dD6C3b78cB618Db025EA3d4868180bb3550"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST FILTRAGE PAR ADRESSE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3030"

Write-Host "🔍 Recherche des événements pour l'adresse:" -ForegroundColor Yellow
Write-Host "   $Address`n" -ForegroundColor White

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/events?address=$Address&limit=50" -Method Get
    
    Write-Host "✅ Trouvé: $($response.events.Count) événements" -ForegroundColor Green
    Write-Host "   Dernier bloc sync: $($response.meta.lastSyncedBlock)`n" -ForegroundColor Gray
    
    if ($response.events.Count -eq 0) {
        Write-Host "ℹ️  Aucun événement trouvé pour cette adresse" -ForegroundColor Yellow
        Write-Host "   • Vérifie que l'adresse est correcte" -ForegroundColor Gray
        Write-Host "   • Cette adresse a peut-être interagi avant le bloc de départ de l'indexer" -ForegroundColor Gray
        Write-Host "   • Essaie de faire une transaction avec cette adresse`n" -ForegroundColor Gray
        exit
    }
    
    # Grouper par type
    $byType = $response.events | Group-Object -Property eventType | Sort-Object Count -Descending
    
    Write-Host "📊 Répartition par type:" -ForegroundColor Cyan
    foreach ($group in $byType) {
        Write-Host "   • $($group.Name): $($group.Count)" -ForegroundColor White
    }
    
    # Grouper par contrat
    $byContract = $response.events | Group-Object -Property contractTag | Sort-Object Count -Descending
    
    Write-Host "`n🏭 Répartition par contrat:" -ForegroundColor Cyan
    foreach ($group in $byContract) {
        Write-Host "   • $($group.Name): $($group.Count)" -ForegroundColor White
    }
    
    # Afficher les 5 derniers événements
    Write-Host "`n📋 5 derniers événements:" -ForegroundColor Cyan
    $recent = $response.events | Select-Object -First 5
    
    foreach ($event in $recent) {
        Write-Host "`n   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Host "   Type: $($event.eventType)" -ForegroundColor Yellow
        Write-Host "   Contrat: $($event.contractTag)" -ForegroundColor White
        Write-Host "   Bloc: $($event.blockNumber)" -ForegroundColor White
        Write-Host "   Date: $(([DateTimeOffset]::FromUnixTimeSeconds($event.timestamp)).LocalDateTime)" -ForegroundColor Gray
        
        if ($event.from -eq $Address.ToLower()) {
            Write-Host "   Rôle: SENDER (from)" -ForegroundColor Red
        }
        if ($event.to -eq $Address.ToLower()) {
            Write-Host "   Rôle: RECEIVER (to)" -ForegroundColor Green
        }
        
        if ($event.from) { Write-Host "   From: $($event.from)" -ForegroundColor DarkGray }
        if ($event.to) { Write-Host "   To: $($event.to)" -ForegroundColor DarkGray }
        if ($event.amount) { Write-Host "   Amount: $($event.amount)" -ForegroundColor Green }
    }
    
    Write-Host "`n"
    
} catch {
    Write-Host "❌ ÉCHEC: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n💡 L'indexer tourne-t-il ? Vérifie avec: curl http://localhost:3030/health`n" -ForegroundColor Yellow
}
