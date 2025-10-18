# 🔄 Mise à jour majeure : Répétition espacée pour les erreurs

## ✨ Nouveau système unifié

Les **erreurs** utilisent maintenant le **même système de répétition espacée** que les notions !

### Avant vs Après

#### ❌ Ancien système
- Erreur ajoutée → Statut "À revoir"
- On clique "J'ai compris" → Statut "Compris"
- **Problème** : On oublie souvent les erreurs qu'on pensait avoir comprises

#### ✅ Nouveau système
- Erreur ajoutée → Niveau 0 → Révision demain
- Révision : "Oublié" ou "Je sais"
- Niveau de maîtrise : 0 → 1 → 2 → 3 → 4 → 5
- **Avantage** : Révisions automatiques jusqu'à vraiment maîtriser l'erreur

---

## 📊 Comment ça marche

### 1. Ajouter une erreur

```
Photo ou description + Sous-test → Enregistrer
```

→ L'erreur sera à réviser **demain** (niveau 0)

### 2. Réviser une erreur

Quand vous ouvrez une erreur à réviser :

**Question** : "Avez-vous retenu votre erreur ?"

- ❌ **Oublié** → Niveau -1 → Révision dans 1 jour
- ✅ **Je sais** → Niveau +1 → Révision espacée

### 3. Algorithme de répétition

| Niveau | Intervalle | Signification |
|--------|------------|---------------|
| 0      | 1 jour     | Nouvelle erreur |
| 1      | 3 jours    | En cours d'apprentissage |
| 2      | 7 jours    | Bonne compréhension |
| 3      | 14 jours   | Très bien maîtrisée |
| 4      | 30 jours   | Excellente maîtrise |
| 5      | 90 jours   | Parfaitement retenue |

### 4. Affichage

**Page Erreurs** :
- 📊 Stats : Total / À réviser / Maîtrisées (niveau 4-5)
- 🔴 **À réviser maintenant** : Erreurs dont la date de révision est arrivée
- 📅 **Prochaines révisions** : Erreurs planifiées pour plus tard

**Chaque carte montre** :
- Niveau de maîtrise (0-5)
- Barre de progression
- Nombre de révisions effectuées
- Prochaine date de révision

---

## 🎯 Avantages du système

### 1. **Pas d'oubli**
Vous êtes forcé de réviser jusqu'à vraiment retenir l'erreur

### 2. **Efficacité scientifique**
Basé sur la courbe de l'oubli d'Ebbinghaus

### 3. **Suivi précis**
Vous savez exactement quelles erreurs vous maîtrisez

### 4. **Motivation**
Voir la progression (niveau 0 → 5) est gratifiant

### 5. **Optimisation du temps**
Vous révisez uniquement ce qui est nécessaire, quand c'est nécessaire

---

## 📱 Utilisation pratique

### Workflow quotidien

**Matin** :
1. Ouvrir l'app
2. Dashboard → Voir "X erreurs à réviser"
3. Aller dans Erreurs → Section "À réviser maintenant"
4. Réviser chaque erreur (< 30 secondes par erreur)

**Après un TD** :
1. Ajouter les erreurs du test
2. Photo OU description rapide
3. C'est tout ! Elles seront programmées automatiquement

**Résultat** :
- Aucune erreur oubliée
- Révisions espacées optimales
- Maîtrise progressive

---

## 🔧 Migration technique

### Base de données

Nouveaux champs ajoutés à la table `errors` :
- `mastery_level` (0-5)
- `last_reviewed_at` (timestamp)
- `next_review_at` (timestamp)
- `review_count` (integer)

Nouvelle table `error_reviews` :
- Historique de toutes les révisions
- Tracking de la progression

### Pour les erreurs existantes

Les anciennes erreurs dans la DB :
- Auront `mastery_level = 0`
- `next_review_at` sera mis à maintenant
- Apparaîtront dans "À réviser maintenant"

→ **Aucune perte de données**

---

## 📝 SQL à exécuter

Si vous avez déjà une base de données existante :

```sql
-- Exécutez le fichier de migration
supabase/migrations/003_errors_spaced_repetition.sql
```

Ou manuellement dans Supabase SQL Editor.

---

## 🤝 Comparaison : Erreurs vs Notions

### Similitudes ✅

| Fonctionnalité | Erreurs | Notions |
|----------------|---------|---------|
| Niveaux de maîtrise | 0-5 | 0-5 |
| Répétition espacée | ✅ | ✅ |
| Historique des révisions | ✅ | ✅ |
| Interface de révision | Identique | Identique |
| Dashboard | Affichées | Affichées |

### Différences 🎯

| Aspect | Erreurs | Notions |
|--------|---------|---------|
| **Contenu** | Photo OU description | Titre + Description |
| **Objectif** | Ne plus refaire l'erreur | Retenir une règle/formule |
| **Ajout** | Après un test | Pendant l'apprentissage |
| **Question** | "Avez-vous retenu votre erreur ?" | "Maîtrisez-vous cette notion ?" |

---

## 💡 Conseils d'utilisation

### Pour les erreurs récurrentes

Si vous cliquez souvent "Oublié" sur la même erreur :
- Niveau baisse → Révisions plus fréquentes
- Prenez le temps de vraiment comprendre
- Ajoutez une meilleure description

### Pour progresser rapidement

1. **Soyez honnête** : Ne cliquez pas "Je sais" si vous hésitez
2. **Révisez quotidiennement** : 5 minutes/jour suffisent
3. **Notez les patterns** : Certains types d'erreurs reviennent ?

### Objectif

**Toutes vos erreurs au niveau 4-5** = Vous êtes prêt pour l'examen ! 🎯

---

## 📞 Support

En cas de problème :
1. Vérifiez que la migration SQL a été exécutée
2. Rafraîchissez l'app (F5)
3. Déconnectez/reconnectez-vous

Les données existantes sont **préservées** et fonctionnent avec le nouveau système.

---

**Version** : 1.2  
**Date** : Octobre 2025  
**Changement** : Système de répétition espacée appliqué aux erreurs

