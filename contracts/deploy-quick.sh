#!/usr/bin/env bash

# 🚀 Script de déploiement rapide TradingPool
# Usage: ./deploy-quick.sh

set -e

echo "🚀 TradingPool Deployment Script"
echo "================================"
echo ""

# Vérifier qu'on est dans le bon dossier
if [ ! -f "hardhat.config.ts" ]; then
    echo "❌ Erreur: Exécuter ce script depuis le dossier contracts/"
    exit 1
fi

# Vérifier .env
if [ ! -f ".env" ]; then
    echo "❌ Erreur: Fichier .env non trouvé"
    echo "💡 Créer .env à partir de .env.tradingpool.example"
    exit 1
fi

# Demander confirmation
echo "Réseau de déploiement: sepolia"
echo ""
echo "Continuer? (y/n)"
read -r response

if [ "$response" != "y" ]; then
    echo "❌ Déploiement annulé"
    exit 0
fi

echo ""
echo "📦 Compilation..."
npx hardhat compile

echo ""
echo "🚀 Déploiement sur Sepolia..."
npx hardhat run scripts/deployTradingPool.ts --network sepolia

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Copier l'adresse du contrat"
echo "2. Configurer frontend/.env.local"
echo "3. Whitelist votre adresse"
echo "4. Tester l'interface"
echo ""
