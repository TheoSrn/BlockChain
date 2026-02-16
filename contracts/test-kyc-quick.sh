#!/bin/bash
# Script de test rapide du système KYC
# Usage: ./test-kyc-quick.sh

echo "🧪 Quick KYC System Test"
echo "========================"
echo ""

# Vérifier qu'on est dans le bon dossier
if [ ! -f "hardhat.config.ts" ]; then
    echo "❌ Error: Run this script from the contracts/ directory"
    exit 1
fi

echo "📦 Step 1/3: Running automated KYC tests..."
echo ""
npx hardhat run scripts/testKYC.ts --network localhost

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All KYC tests passed!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 KYC System Status: READY TO USE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 What was tested:"
    echo "   ✅ Whitelist functionality"
    echo "   ✅ Blacklist functionality (overrides whitelist)"
    echo "   ✅ On-chain enforcement in ERC20 transfers"
    echo "   ✅ Batch operations"
    echo "   ✅ isVerified() function"
    echo "   ✅ KYC can be disabled for special cases"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Deploy to your network: npx hardhat run scripts/deploy.ts --network localhost"
    echo "   2. Manage KYC users: npx hardhat run scripts/manageKYC.ts --network localhost"
    echo "   3. Use in frontend: Import components from @/components/web3/KYCStatus"
    echo ""
    echo "📖 Full documentation: contracts/KYC_SYSTEM.md"
    echo ""
else
    echo ""
    echo "❌ Tests failed. Check error messages above."
    exit 1
fi
