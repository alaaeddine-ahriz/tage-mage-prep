# 📝 Changelog - Tage Mage Tracker

## Version 1.3 - Tests Complets avec calcul automatique 📊

### ✨ Nouvelle fonctionnalité majeure

Enregistrez vos **tests complets du Tage Mage** (6 sous-tests) avec calcul automatique du score !

#### Système de notation

**Par sous-test** :
- 15 questions maximum
- +4 points par bonne réponse
- Score maximum : 60 points

**Test complet** :
- 6 sous-tests obligatoires : Compréhension, Calcul, Conditions, Logique, Expression, Argumentation
- Score total maximum : 600 points (6 × 60)

#### Interface

**Nouveau formulaire "Test Complet"** :
- 📅 Date et type (TD/Blanc)
- ⏱️ Durée totale (optionnel)
- 🎯 Saisie des bonnes réponses par sous-test (0-15)
- 🔢 Calcul automatique des scores en temps réel
- 💯 Total sur 600 affiché en direct

**Page Tests mise à jour** :
- 🗂️ Onglets : "Tests individuels" / "Tests complets"
- 📊 Affichage détaillé par sous-test avec scores
- 📈 Graphique unifié (normalisation en %)
- 🎨 Design moderne avec cartes colorées

**Visualisation** :
- Carte expansive pour chaque test complet
- Détail des 6 sous-tests en grille
- Bonnes réponses + score sur 60 par sous-test
- Score total sur 600 mis en avant

#### Graphique de progression amélioré

- Combine tests individuels (sur 15) et complets (sur 600)
- Normalisation en pourcentage pour comparaison
- Tooltip intelligent avec score brut + pourcentage
- Identification visuelle du type de test

#### Migration de base de données

**Nouvelles tables** :
- `full_tests` : Tests complets (score total, date, type)
- `full_test_subtests` : Détails des 6 sous-tests
- Row Level Security (RLS) activé
- Indexes optimisés pour les performances

**Installation** :
```bash
# Migration automatique pour nouvelles installations
supabase db push

# Ou via SQL dashboard pour installations existantes
# Fichier : supabase/migrations/005_full_tests.sql
```

#### Avantages

✅ **Réaliste** : Simule le vrai test Tage Mage (6 sous-tests)  
✅ **Automatique** : Calcul des scores sans erreur  
✅ **Complet** : Vision globale + détail par sous-test  
✅ **Comparatif** : Graphique unifié pour suivre la progression  
✅ **Motivant** : Score sur 600 pour mesurer votre niveau  

Voir `FULL_TESTS_FEATURE.md` pour le guide complet d'utilisation.

---

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
- ✅ Suivi des tests (TD et Blancs)
- ✅ Carnet d'erreurs avec photos
- ✅ Répétition espacée des notions
- ✅ PWA installable
- ✅ Mode offline
- ✅ Dark mode
- ✅ Mobile-first responsive

---

**Dernière mise à jour** : Octobre 2025

