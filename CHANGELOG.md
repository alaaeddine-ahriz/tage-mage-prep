# 📝 Changelog - Tage Mage Tracker

## Version 1.2 - Répétition espacée pour les erreurs 🔄

### ✨ Changement majeur : Système unifié

Les **erreurs** utilisent maintenant le **même système de répétition espacée** que les notions !

#### Nouveau système de révision

**Avant** : "À revoir" → "Compris" (système binaire)  
**Maintenant** : Niveaux de maîtrise 0-5 avec répétitions automatiques

- ✅ Ajout d'erreur → Révision demain (niveau 0)
- ✅ Révision : "Oublié" ❌ ou "Je sais" ✅
- ✅ Progression : 0 → 1 → 2 → 3 → 4 → 5
- ✅ Intervalles : 1j → 3j → 7j → 14j → 30j → 90j
- ✅ Historique complet dans table `error_reviews`

#### Interface mise à jour

**Page Erreurs** :
- 📊 Stats : Total / À réviser / Maîtrisées
- 🔴 Section "À réviser maintenant" (comme Notions)
- 📅 Section "Prochaines révisions"
- 📈 Barre de progression par erreur
- 🔢 Nombre de révisions

**Détail d'une erreur** :
- Niveau de maîtrise visuel (barre de progression)
- Stats de révision (nombre, dernière date)
- Boutons "Oublié" / "Je sais" (comme Notions)
- Conseils selon le niveau

**Dashboard** :
- "Erreurs à réviser" → Compte uniquement celles dues aujourd'hui

#### Migration des données

- Les erreurs existantes passent automatiquement au nouveau système
- Niveau initial = 0
- Prêtes à réviser immédiatement
- Aucune perte de données

#### Avantages

✅ **Scientifique** : Basé sur la courbe de l'oubli  
✅ **Efficace** : Révisions optimales jusqu'à maîtrise complète  
✅ **Cohérent** : Même système pour erreurs ET notions  
✅ **Motivant** : Progression visible (0 → 5)  
✅ **Automatique** : Plus besoin de penser à réviser  

Voir `SPACED_REPETITION_UPDATE.md` pour le guide complet.

---

## Version 1.1 - Simplification du carnet d'erreurs

### ✨ Ce qui a changé

#### Formulaire d'ajout d'erreur - SIMPLIFIÉ

**Avant :**
- Photo (requis)
- Sous-test
- Catégorie
- Bonne réponse
- Explication

**Maintenant :**
- 📷 **Photo** (optionnel) - Caméra ou galerie
- 🎯 **Sous-test** (requis)
- 📝 **Description** (optionnel)

→ Au moins une photo OU une description requise

#### Affichage des erreurs

- ✅ Vue liste simplifiée
- ✅ Affiche uniquement le sous-test et la description
- ✅ Dates d'ajout visibles
- ✅ Statut "À revoir" / "Compris"

#### Avantages

✅ **Plus rapide** : Ajout d'erreur en < 5 secondes
✅ **Plus simple** : Moins de champs à remplir
✅ **Plus flexible** : Photo OU description, au choix
✅ **Moins de friction** : Focus sur l'essentiel

### 🎯 Comment utiliser

1. **Ajouter une erreur avec photo uniquement** :
   - Cliquez sur "Nouvelle erreur"
   - Prenez une photo
   - Sélectionnez le sous-test
   - Enregistrez → C'est tout!

2. **Ajouter une erreur avec description** :
   - Cliquez sur "Nouvelle erreur"
   - Sélectionnez le sous-test
   - Tapez une description courte
   - Enregistrez

3. **Avec photo ET description** :
   - Les deux ensemble pour plus de contexte

### 💡 Bonnes pratiques

**Pour les questions complexes :**
- Photo + courte description (ex: "Oublié la formule ABC")

**Pour les erreurs récurrentes :**
- Juste une description suffit (ex: "Confonds toujours X et Y")

**Pour référence rapide :**
- Photo uniquement (relecture visuelle)

### 🔄 Migration des données existantes

Les erreurs existantes avec catégories, bonnes réponses, etc. sont conservées. Elles s'affichent normalement avec leur description complète.

Seules les **nouvelles erreurs** utilisent le format simplifié.

### 📊 Base de données

Aucun changement de schéma requis! Les champs suivants sont maintenant optionnels et non utilisés dans l'interface:
- `category`
- `correct_answer`
- `tags`

Le champ `explanation` contient maintenant votre description.

---

## Version 1.0 - Release initiale

- ✅ Authentication Google OAuth
- ✅ Dashboard avec stats
- ✅ Suivi des tests (TD et blancs)
- ✅ Carnet d'erreurs avec photos
- ✅ Répétition espacée des notions
- ✅ PWA installable
- ✅ Mode offline
- ✅ Dark mode
- ✅ Mobile-first responsive

---

**Date de mise à jour** : Octobre 2025

