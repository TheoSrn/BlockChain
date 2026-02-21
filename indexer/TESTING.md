# 🧪 Guide de Test de l'Indexer

Scripts de test pour valider le bon fonctionnement de l'indexer.

## 📋 Scripts disponibles

### 1. `test-indexer.ps1` - Suite de tests complète (REST API)

Test tous les endpoints REST de l'indexer.

**🚀 Usage:**
```powershell
cd indexer
.\test-indexer.ps1
```

**✅ Tests inclus:**
- Health check
- Récupération des événements
- Filtrage par type (Swap, Transfer)
- Filtrage par contrat
- Analyse des types d'événements

---

### 2. `test-websocket.js` - Test du stream temps réel

Connecte au WebSocket et affiche les événements en temps réel.

**🚀 Usage:**
```powershell
cd indexer
node test-websocket.js
```

**💡 Que faire:**
1. Lance le script
2. Fais une transaction on-chain (Transfer, Swap, Approval, etc.)
3. Attends max 60 secondes
4. L'événement s'affiche automatiquement !

**⏹️ Arrêter:** `Ctrl+C`

---

### 3. `test-filter-by-address.ps1` - Test filtrage par adresse

Affiche tous les événements impliquant une adresse spécifique.

**🚀 Usage:**
```powershell
cd indexer

# Avec l'adresse par défaut
.\test-filter-by-address.ps1

# Avec ton adresse
.\test-filter-by-address.ps1 -Address "0xVotreAdresse"
```

**✅ Affiche:**
- Nombre d'événements par type
- Nombre d'événements par contrat
- Les 5 derniers événements détaillés
- Le rôle de l'adresse (sender/receiver)

---

## 🎯 Scénarios de test recommandés

### ✅ Test 1: Vérifier que l'indexer fonctionne

```powershell
cd indexer
.\test-indexer.ps1
```

**Attendu:** Tous les tests passent, tu vois des événements.

---

### ✅ Test 2: Vérifier le temps réel (WebSocket)

**Terminal 1:**
```powershell
cd indexer
node test-websocket.js
```

**Terminal 2:** Fais une transaction (depuis Remix, MetaMask, ou un script)

**Attendu:** L'événement apparaît dans le terminal 1 dans les 60 secondes.

---

### ✅ Test 3: Vérifier la détection d'actions HORS UI

**Étapes:**
1. Va sur Sepolia Etherscan ou utilise Remix
2. Fais un `transfer` directement sur un contrat token (pas depuis ton UI)
3. Attends 60 secondes
4. Lance:
   ```powershell
   .\test-indexer.ps1
   ```
5. Vérifie que ton transfer apparaît dans les résultats

**✅ C'est LE test qui prouve la conformité avec l'énoncé !**

---

### ✅ Test 4: Vérifier tes propres transactions

```powershell
# Remplace par TON adresse de wallet
.\test-filter-by-address.ps1 -Address "0xTonAdresse"
```

**Attendu:** Tous TES transfers, swaps, approvals apparaissent.

---

## 🔧 Dépannage

### ❌ "Connection refused" ou "Cannot connect"

**Solution:**
```powershell
# Vérifie que l'indexer tourne
curl http://localhost:3030/health

# Si erreur, démarre l'indexer
cd indexer
npm run dev
```

---

### ❌ "No events found" ou 0 événements

**Causes possibles:**
1. L'indexer vient de démarrer et n'a pas encore synchronisé
   - **Attends 60 secondes** puis réessaie

2. Aucune transaction sur les contrats trackés
   - Fais un transfer ou swap de test

3. L'indexer démarre après les transactions historiques
   - Modifie `INITIAL_LOOKBACK_BLOCKS` dans `indexer/.env`

---

### ❌ WebSocket se déconnecte immédiatement

**Solution:**
```powershell
# Vérifie que le port est correct
Test-NetConnection -ComputerName localhost -Port 3030

# Vérifie les logs de l'indexer
# (dans le terminal où tu as lancé npm run dev)
```

---

## 📊 Commandes curl rapides

```powershell
# Health
curl http://localhost:3030/health

# Tous les événements
curl http://localhost:3030/events

# 5 derniers
curl "http://localhost:3030/events?limit=5"

# Swaps uniquement
curl "http://localhost:3030/events?type=Swap"

# Transfers uniquement
curl "http://localhost:3030/events?type=Transfer&limit=10"

# Événements d'une adresse
curl "http://localhost:3030/events?address=0xVotreAdresse"

# Événements du contrat Factory
curl "http://localhost:3030/events?contract=0xcD10F4847908eBBe7BAc14664F777c600b5f5Fd8"
```

---

## ✅ Checklist de validation

Avant de considérer l'indexer comme validé, vérifie:

- [ ] `test-indexer.ps1` passe tous les tests
- [ ] Le health check montre `status: "ok"`
- [ ] Des événements sont indexés (`totalEvents > 0`)
- [ ] Le `lastSyncedBlock` augmente toutes les ~60 secondes
- [ ] Le WebSocket se connecte et reçoit des événements
- [ ] Les filtres fonctionnent (type, address, contract)
- [ ] **CRITIQUE:** Une transaction faite HORS UI apparaît dans l'indexer

---

## 🎓 Pour la démo/évaluation

**Montre ces 3 choses:**

1. **Health check** → L'indexer tourne
   ```powershell
   curl http://localhost:3030/health
   ```

2. **Stream temps réel** → Les événements arrivent automatiquement
   ```powershell
   node test-websocket.js
   # Puis fais une transaction
   ```

3. **Détection hors UI** → Fais un swap sur Etherscan, montre qu'il apparaît
   ```powershell
   .\test-indexer.ps1
   # Montre que le swap externe est détecté
   ```

✅ **Cela prouve 100% la conformité avec l'énoncé !**
