# Mise à jour de la logique de retake - Double critère

## 📋 Résumé

La logique de détermination des tests à refaire a été améliorée pour prendre en compte deux critères :

1. **Première tentative** : Un test fait une seule fois doit être refait après un délai défini (par défaut 15 jours)
2. **Tests refaits** : Un test refait (avec au moins une tentative supplémentaire) doit être refait si le score de la dernière tentative est inférieur à un seuil personnalisable (par défaut 90%)

## 🎯 Nouvelle logique

### Tests individuels (TD)
- **Aucune tentative** : À refaire si le délai depuis `test.date` est écoulé
- **Au moins une tentative** : À refaire si le score de la dernière tentative < seuil
  - Score calculé : `(lastAttempt.score / 60) * 100`
  - Seuil par défaut : 90%

### Tests complets (Blancs)
- **Aucune tentative** : À refaire si le délai depuis `test.date` est écoulé
- **Au moins une tentative** : À refaire si le score de la dernière tentative < seuil
  - Score calculé : `(lastAttempt.total_score / 600) * 100`
  - Seuil par défaut : 90%

## 🔧 Modifications apportées

### 1. Fonctions de calcul (`lib/utils/retakes.ts`)
- ✅ Ajout de `DEFAULT_RETAKE_SCORE_THRESHOLD = 90`
- ✅ Ajout du paramètre `scoreThreshold` aux fonctions :
  - `isTestDueForRetake()`
  - `isFullTestDueForRetake()`
  - `isTestUpcomingRetake()`
  - `isFullTestUpcomingRetake()`
- ✅ Ajout de `getUserRetakeScoreThreshold()` pour récupérer le seuil utilisateur

### 2. Context global (`lib/state/dashboard-data.tsx`)
- ✅ Ajout de `retakeScoreThreshold` dans le context
- ✅ Chargement du seuil au démarrage
- ✅ Fonction `refreshRetakePreferences()` mise à jour pour charger les deux préférences

### 3. Formulaire de préférences (`components/forms/RetakePreferencesForm.tsx`)
- ✅ Ajout du champ "Seuil de score pour refaire un test"
- ✅ Validation : entre 1% et 100%
- ✅ Sauvegarde des deux préférences en une seule opération

### 4. Pages utilisant la logique
- ✅ `app/(dashboard)/tests/page.tsx` : Passage du `retakeScoreThreshold` aux fonctions
- ✅ `app/(dashboard)/page.tsx` : Calcul du compteur "À refaire" avec le nouveau critère

### 5. Types (`lib/types/database.types.ts`)
- ✅ Ajout de `retake_score_threshold` à la table `user_preferences`

### 6. Migration SQL (`supabase/migrations/013_add_retake_score_threshold.sql`)
- ✅ Ajout de la colonne `retake_score_threshold` (INTEGER, DEFAULT 90)
- ✅ Contrainte de validation : valeur entre 1 et 100

## 📊 Exemples de comportement

### Exemple 1 : Test fait une seule fois
```
Test : Logique TD
Date : 2025-10-01
Attempts : []
Délai configuré : 15 jours
Date actuelle : 2025-10-21

Résultat : ✅ À REFAIRE (délai écoulé : 20 jours)
```

### Exemple 2 : Test refait avec bon score
```
Test : Logique TD
Date : 2025-09-01
Attempts : [
  { date: '2025-10-01', score: 56/60 } // 93.33%
]
Seuil configuré : 90%

Résultat : ✅ OK (score > seuil, pas à refaire)
```

### Exemple 3 : Test refait avec score insuffisant
```
Test : Logique TD
Date : 2025-09-01
Attempts : [
  { date: '2025-10-01', score: 52/60 } // 86.67%
]
Seuil configuré : 90%

Résultat : ⚠️ À REFAIRE (score < seuil)
```

### Exemple 4 : Test complet avec score insuffisant
```
Test : Blanc complet
Date : 2025-09-01
Attempts : [
  { date: '2025-10-01', total_score: 520/600 } // 86.67%
]
Seuil configuré : 90%

Résultat : ⚠️ À REFAIRE (score < seuil)
```

## 🎨 Interface utilisateur

### Formulaire de préférences
Le formulaire dans Header (desktop) et Dashboard (mobile) affiche maintenant :

1. **Revoir mes tests après** : X jours (pour la première tentative)
2. **Seuil de score pour refaire un test** : X % (pour les tentatives suivantes)

### Badges dans la liste des tests
- 🔴 **À refaire** : Badge destructive (rouge) si le test doit être refait
- 🔵 **Bientôt** : Badge secondary (bleu) si le test sera bientôt à refaire
- Date relative affichée : "À refaire dans X jours" ou "En retard de X jours"

### Filtres
- Possibilité de filtrer par "À refaire" et/ou "Bientôt"
- Multi-sélection possible
- Position : à droite des filtres de sous-tests (desktop) ou entre le filtre et le bouton + (mobile)

## 🗄️ Base de données

### Migration à appliquer
Exécutez la migration `013_add_retake_score_threshold.sql` dans votre base Supabase :

```sql
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS retake_score_threshold INTEGER NOT NULL DEFAULT 90;

ALTER TABLE user_preferences
ADD CONSTRAINT retake_score_threshold_range 
CHECK (retake_score_threshold >= 1 AND retake_score_threshold <= 100);
```

### Valeurs par défaut
- `default_retake_delay_days` : 15 jours
- `retake_score_threshold` : 90%

## ✅ Vérifications effectuées

- [x] Build réussie sans erreurs
- [x] Types TypeScript correctement définis
- [x] Linter sans erreurs bloquantes
- [x] Logique de retake cohérente entre tests individuels et complets
- [x] UI responsive (mobile + desktop)
- [x] Formulaire de préférences fonctionnel
- [x] Event custom pour rafraîchir le context global
- [x] Migration SQL créée

## 🚀 Déploiement

1. Appliquez la migration SQL dans Supabase
2. Déployez le code mis à jour
3. Les utilisateurs existants utiliseront automatiquement les valeurs par défaut (15 jours, 90%)
4. Les utilisateurs peuvent modifier leurs préférences via Header > Préférences ou Dashboard > Préférences de révision

## 📝 Notes techniques

- Les tentatives (`attempts`) sont triées par date décroissante, donc `attempts[0]` est toujours la dernière tentative
- Le calcul du pourcentage est basé sur 60 points pour les tests individuels et 600 pour les tests complets
- La logique de "Bientôt" ne s'applique que si le score est suffisant (sinon c'est directement "À refaire")
- Tous les calculs sont effectués côté client pour une meilleure réactivité

