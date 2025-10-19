# Fonctionnalité Tests Complets

## Vue d'ensemble

Cette fonctionnalité permet d'enregistrer des tests complets du Tage Mage (6 sous-tests) avec un calcul automatique du score total sur 600 points.

## Système de notation

### Par sous-test
- **Chaque sous-test** : 15 questions maximum
- **Points par bonne réponse** : +4 points
- **Score maximum par sous-test** : 60 points (15 × 4)

### Test complet
- **6 sous-tests** obligatoires :
  1. Compréhension
  2. Calcul
  3. Conditions
  4. Logique
  5. Expression
  6. Argumentation

- **Score total maximum** : 600 points (6 × 60)

## Comment utiliser

### 1. Accéder à la page Tests
Naviguez vers la section "Tests & Scores" depuis le menu principal.

### 2. Ajouter un test complet
- Cliquez sur le bouton **"Test complet"** (ou **"+"** sur mobile)
- Remplissez les informations générales :
  - Date du test
  - Type (TD ou Blanc)
  - Durée totale (optionnel)
  
### 3. Saisir les résultats
Pour chaque sous-test, indiquez le **nombre de bonnes réponses** (0-15) :
- Le score sur 60 points est calculé automatiquement
- Le score total sur 600 est mis à jour en temps réel

### 4. Ajouter des notes (optionnel)
Ajoutez des commentaires sur votre performance globale.

### 5. Enregistrer
Cliquez sur **"Enregistrer le test complet"** pour sauvegarder.

## Visualisation

### Onglets
La page Tests contient deux onglets :
- **Tests individuels** : Sous-tests enregistrés séparément (score sur 15)
- **Tests complets** : Tests avec les 6 sous-tests (score sur 600)

### Affichage des tests complets
Chaque test complet affiche :
- Date et type (TD/Blanc)
- Score total sur 600
- Détail de chaque sous-test avec :
  - Nombre de bonnes réponses
  - Score sur 60 points

### Graphique de progression
Le graphique combine tests individuels et complets :
- Affichage en pourcentage de réussite pour comparaison
- Tooltip détaillé au survol (score brut + pourcentage)

## Installation / Migration

### Pour une nouvelle installation
La migration `005_full_tests.sql` sera appliquée automatiquement.

### Pour une installation existante
Exécutez la migration manuellement :

```bash
# Si vous utilisez Supabase local
supabase db push

# Ou via le dashboard Supabase
# Copiez le contenu de supabase/migrations/005_full_tests.sql
# et exécutez-le dans l'éditeur SQL du dashboard
```

## Structure de la base de données

### Table `full_tests`
- `id` : UUID (clé primaire)
- `user_id` : UUID (référence auth.users)
- `date` : Date du test
- `type` : 'TD' ou 'Blanc'
- `total_score` : Score total sur 600
- `duration_minutes` : Durée en minutes (optionnel)
- `notes` : Commentaires (optionnel)

### Table `full_test_subtests`
- `id` : UUID (clé primaire)
- `full_test_id` : UUID (référence full_tests)
- `subtest` : Nom du sous-test
- `correct_answers` : Nombre de bonnes réponses (0-15)
- `score` : Score calculé sur 60 points

## Sécurité

Les tables utilisent Row Level Security (RLS) :
- Chaque utilisateur ne peut voir que ses propres tests
- Les politiques empêchent l'accès non autorisé aux données

## Calculs automatiques

Le formulaire effectue les calculs suivants en temps réel :
- **Score par sous-test** = Nombre de bonnes réponses × 4
- **Score total** = Somme des 6 sous-tests (max 600)
- **Pourcentage de réussite** = (Score / Score max) × 100

## Exemple

### Résultats saisis
```
Compréhension : 12/15 bonnes réponses
Calcul        : 10/15 bonnes réponses
Conditions    : 13/15 bonnes réponses
Logique       : 9/15 bonnes réponses
Expression    : 11/15 bonnes réponses
Argumentation : 8/15 bonnes réponses
```

### Scores calculés
```
Compréhension : 48/60 pts
Calcul        : 40/60 pts
Conditions    : 52/60 pts
Logique       : 36/60 pts
Expression    : 44/60 pts
Argumentation : 32/60 pts

TOTAL : 252/600 pts (42%)
```

## Avantages

1. **Vision globale** : Score total sur 600 pour évaluer votre niveau général
2. **Détail par sous-test** : Identifiez vos points forts et faibles
3. **Comparaison** : Le graphique normalise les scores pour comparer tests individuels et complets
4. **Historique** : Suivez votre progression au fil des tests blancs
5. **Calcul automatique** : Plus d'erreurs de calcul manuel

## Support

Pour toute question ou problème, consultez les autres fichiers de documentation :
- `README.md` : Documentation générale
- `SETUP.md` : Guide d'installation
- `KNOWN_ISSUES.md` : Problèmes connus

