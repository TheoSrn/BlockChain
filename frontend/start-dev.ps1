# Script pour démarrer le serveur de développement
# Recharge les variables d'environnement

Write-Host "Rechargement des variables d'environnement..." -ForegroundColor Cyan
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "Démarrage du serveur de développement Next.js..." -ForegroundColor Green
npm run dev
