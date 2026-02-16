# Script PowerShell pour tester le système KYC
# Usage: .\test-kyc-quick.ps1

Write-Host "🧪 Quick KYC System Test" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Vérifier qu'on est dans le bon dossier
if (-not (Test-Path "hardhat.config.ts")) {
    Write-Host "❌ Error: Run this script from the contracts/ directory" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Step 1/3: Running automated KYC tests..." -ForegroundColor Yellow
Write-Host ""

npx hardhat run scripts/testKYC.ts --network localhost

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All KYC tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🎉 KYC System Status: READY TO USE" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 What was tested:" -ForegroundColor White
    Write-Host "   ✅ Whitelist functionality"
    Write-Host "   ✅ Blacklist functionality (overrides whitelist)"
    Write-Host "   ✅ On-chain enforcement in ERC20 transfers"
    Write-Host "   ✅ Batch operations"
    Write-Host "   ✅ isVerified() function"
    Write-Host "   ✅ KYC can be disabled for special cases"
    Write-Host ""
    Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Deploy to your network: npx hardhat run scripts/deploy.ts --network localhost"
    Write-Host "   2. Manage KYC users: npx hardhat run scripts/manageKYC.ts --network localhost"
    Write-Host "   3. Use in frontend: Import components from @/components/web3/KYCStatus"
    Write-Host ""
    Write-Host "📖 Full documentation: contracts/KYC_SYSTEM.md" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Tests failed. Check error messages above." -ForegroundColor Red
    exit 1
}
