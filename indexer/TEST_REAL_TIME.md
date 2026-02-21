# 🧪 Guide de Test en Temps Réel de l'Indexer

Ce guide te permet de prouver que l'indexer détecte **automatiquement** les transactions faites **hors de ton UI**.

## 🎯 Test 1 : WebSocket en Temps Réel

### Étape 1 : Lance le test WebSocket

**Terminal dédié :**
```powershell
cd indexer
node test-websocket.js
```

Tu devrais voir :
```
✅ Connecté au stream d'événements
📡 En attente de nouveaux événements blockchain...
```

**Laisse ce terminal ouvert !** Il affichera automatiquement chaque nouvel événement détecté.

---

### Étape 2 : Génère une transaction

**Option A - Script automatique (recommandé) :**

Nouveau terminal :
```powershell
cd indexer
node make-test-transaction.js
```

Ce script va :
- ✅ Faire un `approve()` sur le contrat USDT
- ✅ Attendre la confirmation
- ✅ Te donner le lien Etherscan

**Option B - Transaction manuelle :**

1. Va sur [Sepolia Etherscan](https://sepolia.etherscan.io/token/0x8AF094699d79a10Dffc243054d83FC888c4D1760#writeContract)
2. Connecte ton wallet (MetaMask)
3. Fais un `approve()` ou `transfer()`
4. Confirme la transaction

---

### Étape 3 : Observe le résultat

**Dans le terminal du WebSocket, tu verras dans les ~60 secondes :**

```
🔔 NOUVEL ÉVÉNEMENT #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Type: Approval
🏭 Contrat: usdt
📦 Bloc: 10303xxx
🔗 TX: 0xabc123...
💰 Amount: 1000000000000000000
```

**✅ SUCCÈS !** L'indexer a détecté ta transaction automatiquement !

---

## 🏆 Test 2 : Swap Hors UI (Test Critique)

Ce test prouve que l'indexer détecte les actions faites **complètement en dehors de ton interface**.

### Méthode 1 : Via Remix (Recommandé)

**Étape 1 : Prépare Remix**

1. Va sur [Remix IDE](https://remix.ethereum.org/)
2. Crée un nouveau fichier `TestSwap.sol` :

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract TestSwap {
    // Juste pour générer une transaction de test
    function doApprove(address token, address spender, uint256 amount) external {
        IERC20(token).approve(spender, amount);
    }
    
    function doTransfer(address token, address to, uint256 amount) external {
        IERC20(token).transfer(to, amount);
    }
}
```

**Étape 2 : Déploie et exécute**

1. Compile le contrat
2. Change le réseau vers **Sepolia** dans MetaMask
3. Déploie le contrat
4. Appelle `doApprove()` avec :
   - `token`: `0x8AF094699d79a10Dffc243054d83FC888c4D1760` (USDT)
   - `spender`: n'importe quelle adresse
   - `amount`: `1000000000000000000` (1 token)

**Étape 3 : Vérifie la détection**

Attends 60 secondes max, puis :

```powershell
# Dans un nouveau terminal
cd indexer
.\test-indexer.ps1
```

Ou directement :
```powershell
curl "http://localhost:3030/events?type=Approval&limit=5"
```

**✅ Ton événement doit apparaître !**

---

### Méthode 2 : Via Etherscan (Plus simple)

**Étape 1 : Va sur le contrat**

Lien direct : [USDT sur Sepolia](https://sepolia.etherscan.io/token/0x8AF094699d79a10Dffc243054d83FC888c4D1760#writeContract)

**Étape 2 : Fais une transaction**

1. Clique sur **"Write Contract"**
2. **"Connect to Web3"** (MetaMask)
3. Trouve la fonction `approve()` ou `transfer()`
4. Remplis :
   - `spender` / `to`: `0x0000000000000000000000000000000000000001`
   - `amount`: `1000000000000000000`
5. **"Write"** → Confirme dans MetaMask

**Étape 3 : Vérifie**

Attends ~60 secondes :

```powershell
curl "http://localhost:3030/events?limit=5" | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

**✅ Ton approve/transfer doit être dans la liste !**

---

### Méthode 3 : Via le script automatique

```powershell
cd indexer
node make-test-transaction.js
```

Suit les instructions à l'écran.

---

## 📊 Validation Finale

Pour prouver la conformité avec l'énoncé, montre ces 3 choses :

### ✅ 1. L'indexer tourne et synchronise

```powershell
curl http://localhost:3030/health
```

Vérifie que `lastSyncedBlock` augmente toutes les 60 secondes.

### ✅ 2. WebSocket reçoit les événements en temps réel

Le terminal du test WebSocket affiche les nouveaux événements automatiquement.

### ✅ 3. Une transaction HORS UI est détectée

Après avoir fait une transaction via Remix/Etherscan/Script :

```powershell
# Vérifie qu'elle apparaît
curl "http://localhost:3030/events?limit=10"

# Ou avec filtres
curl "http://localhost:3030/events?type=Approval"
```

---

## 🎬 Scénario de Démonstration

**Pour impressionner lors de l'évaluation :**

1. **Ouvre 3 terminaux côte à côte**
   - Terminal 1 : `node test-websocket.js` (stream en direct)
   - Terminal 2 : Pour faire des transactions
   - Terminal 3 : Pour vérifier avec curl

2. **Dis à l'évaluateur :**
   > "Je vais maintenant faire une transaction directement sur Etherscan, 
   > sans passer par mon interface, et l'indexer va la détecter automatiquement."

3. **Fais la transaction sur Etherscan**

4. **Montre Terminal 1 :**
   > "Dans maximum 60 secondes, l'événement va apparaître ici..."

5. **Quand l'événement apparaît :**
   > "Voilà ! L'indexer a détecté ma transaction même si elle n'a pas 
   > été faite depuis mon interface. C'est la preuve que l'indexer 
   > surveille activement la blockchain."

6. **Bonus - Montre le filtrage :**
   ```powershell
   curl "http://localhost:3030/events?type=Approval&limit=5"
   ```

---

## 🚨 Troubleshooting

### Le WebSocket ne se connecte pas

```powershell
# Vérifie que l'indexer tourne
curl http://localhost:3030/health

# Si pas de réponse, redémarre l'indexer
cd indexer
npm run dev
```

### Aucun événement n'apparaît

1. **Attends 60 secondes** (temps de polling)
2. Vérifie que la transaction est confirmée sur Etherscan
3. Vérifie que le contrat est dans la liste trackée :
   ```powershell
   curl http://localhost:3030/health
   # Regarde "trackedContracts"
   ```

### Transaction échoue (Insufficient funds)

Tu as besoin d'ETH Sepolia pour les gas fees.

**Faucets Sepolia :**
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

---

## ✅ Checklist Finale

Avant de valider, assure-toi que :

- [ ] L'indexer tourne (`http://localhost:3030/health` répond)
- [ ] Le WebSocket se connecte (test-websocket.js)
- [ ] Une transaction manuelle a été faite (Etherscan/Remix)
- [ ] Cette transaction apparaît dans les résultats
- [ ] Le filtrage fonctionne (par type, address, contract)
- [ ] Le lastSyncedBlock augmente régulièrement

**Si tout est ✅, ton indexer est 100% conforme à l'énoncé !** 🎉
