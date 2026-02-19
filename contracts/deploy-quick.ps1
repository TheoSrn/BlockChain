# 🚀 Script de déploiement rapide TradingPool (PowerShell)
# Usage: .\deploy-quick.ps1

Write-Host "🚀 TradingPool Deployment Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier qu'on est dans le bon dossier
if (-not (Test-Path "hardhat.config.ts")) {
    Write-Host "❌ Erreur: Exécuter ce script depuis le dossier contracts/" -ForegroundColor Red
    exit 1
}

# Vérifier .env
if (-not (Test-Path ".env")) {
    Write-Host "❌ Erreur: Fichier .env non trouvé" -ForegroundColor Red
    Write-Host "💡 Créer .env à partir de .env.tradingpool.example" -ForegroundColor Yellow
    exit 1
}

# Demander confirmation
Write-Host "Réseau de déploiement: sepolia" -ForegroundColor Yellow
Write-Host ""
$response = Read-Host "Continuer? (y/n)"

if ($response -ne "y") {
    Write-Host "❌ Déploiement annulé" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "📦 Compilation..." -ForegroundColor Blue
npx hardhat compile

Write-Host ""
Write-Host "🚀 Déploiement sur Sepolia..." -ForegroundColor Blue
npx hardhat run scripts/deployTradingPool.ts --network sepolia

Write-Host ""
Write-Host "✅ Déploiement terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Copier l'adresse du contrat"
Write-Host "2. Configurer frontend/.env.local"
Write-Host "3. Whitelist votre adresse"
Write-Host "4. Tester l'interface"
Write-Host ""
