# Guide de Migration - Tests Complets (v1.3)

## 📋 Vue d'ensemble

Cette migration ajoute le support des **tests complets** avec 6 sous-tests et calcul automatique du score sur 600 points.

## 🆕 Nouvelle installation

Si vous installez le projet pour la première fois, la migration s'applique automatiquement :

```bash
# Clone le projet
git clone <repo-url>
cd tage-mage-tracker

# Installe les dépendances
npm install

# Configure Supabase
supabase init
supabase link --project-ref <your-project-ref>

# Applique toutes les migrations
supabase db push
```

✅ C'est fait ! Les tables `full_tests` et `full_test_subtests` sont créées.

## 🔄 Installation existante

Si vous avez déjà une installation fonctionnelle, suivez ces étapes :

### Option 1 : Via Supabase CLI (Recommandé)

```bash
# Assurez-vous d'être dans le dossier tage-mage-tracker
cd tage-mage-tracker

# Appliquez la nouvelle migration
supabase db push
```

Cette commande détecte automatiquement la nouvelle migration `005_full_tests.sql` et l'applique.

### Option 2 : Via Dashboard Supabase

1. **Connectez-vous** au [dashboard Supabase](https://app.supabase.com)

2. **Sélectionnez votre projet** Tage Mage Tracker

3. **Accédez à l'éditeur SQL** :
   - Menu latéral → "SQL Editor"
   - Cliquez sur "New query"

4. **Copiez le contenu** du fichier :
   ```
   tage-mage-tracker/supabase/migrations/005_full_tests.sql
   ```

5. **Collez et exécutez** :
   - Collez le contenu dans l'éditeur
   - Cliquez sur "Run" (en bas à droite)
   - Attendez la confirmation de succès ✅

6. **Vérifiez** que les tables ont été créées :
   - Menu latéral → "Table Editor"
   - Vous devriez voir `full_tests` et `full_test_subtests`

## ✅ Vérification

Pour vérifier que la migration a fonctionné :

### Via Supabase CLI

```bash
# Liste les tables
supabase db diff

# Vous devriez voir full_tests et full_test_subtests
```

### Via Dashboard Supabase

1. Table Editor → Vérifiez la présence de :
   - ✅ `full_tests`
   - ✅ `full_test_subtests`

2. Vérifiez les politiques RLS :
   - `full_tests` → Onglet "Policies" → 4 politiques (SELECT, INSERT, UPDATE, DELETE)
   - `full_test_subtests` → Onglet "Policies" → 4 politiques

## 🗄️ Nouvelles tables créées

### Table `full_tests`

Stocke les tests complets (un enregistrement par test de 6 sous-tests).

| Colonne            | Type         | Description                    |
|--------------------|--------------|--------------------------------|
| id                 | UUID         | Identifiant unique             |
| user_id            | UUID         | Référence à l'utilisateur      |
| date               | TIMESTAMPTZ  | Date du test                   |
| type               | TEXT         | 'TD' ou 'Blanc'                |
| total_score        | INTEGER      | Score total sur 600            |
| duration_minutes   | INTEGER      | Durée en minutes (optionnel)   |
| notes              | TEXT         | Commentaires (optionnel)       |
| created_at         | TIMESTAMPTZ  | Date de création               |
| updated_at         | TIMESTAMPTZ  | Date de modification           |

### Table `full_test_subtests`

Stocke les détails de chaque sous-test (6 enregistrements par test complet).

| Colonne           | Type    | Description                       |
|-------------------|---------|-----------------------------------|
| id                | UUID    | Identifiant unique                |
| full_test_id      | UUID    | Référence au test complet         |
| subtest           | TEXT    | Nom du sous-test                  |
| correct_answers   | INTEGER | Nombre de bonnes réponses (0-15)  |
| score             | INTEGER | Score calculé sur 60              |
| created_at        | TIMESTAMPTZ | Date de création              |

## 🔐 Sécurité (RLS)

Les politiques Row Level Security garantissent que :
- Chaque utilisateur ne voit que **ses propres tests**
- Les données sont protégées contre l'accès non autorisé
- Les opérations CRUD sont sécurisées

## 📊 Impact sur les données existantes

**Aucune modification** des données existantes :
- Les tests individuels (`tests` table) restent inchangés
- Aucune donnée n'est supprimée ou modifiée
- Les nouvelles tables sont créées à côté des anciennes

## 🚀 Déploiement sur Vercel

Si votre application est déployée sur Vercel :

1. **Appliquez d'abord la migration** sur votre base Supabase (production)

2. **Redéployez votre application** :
   ```bash
   git add .
   git commit -m "feat: Add full tests feature with scoring"
   git push origin main
   ```

3. Vercel redéploie automatiquement ✅

## ⚠️ Troubleshooting

### Erreur : "relation 'full_tests' already exists"

Vous avez déjà appliqué cette migration. Tout va bien ! ✅

### Erreur : Permission denied

Assurez-vous d'avoir les droits d'administration sur votre projet Supabase.

### Les tables n'apparaissent pas

1. Rafraîchissez le dashboard Supabase (F5)
2. Vérifiez que vous êtes sur le bon projet
3. Consultez l'historique SQL pour voir si la migration a été exécutée

### Erreur de RLS

Si vous ne pouvez pas insérer de tests complets :

```sql
-- Vérifiez que les politiques RLS sont actives
SELECT * FROM pg_policies 
WHERE tablename IN ('full_tests', 'full_test_subtests');
```

Vous devriez voir 4 politiques par table (SELECT, INSERT, UPDATE, DELETE).

## 📞 Support

En cas de problème :
1. Consultez le fichier `KNOWN_ISSUES.md`
2. Vérifiez les logs Supabase (Dashboard → Logs)
3. Consultez les autres fichiers de documentation

## 📚 Documentation associée

- `FULL_TESTS_FEATURE.md` : Guide d'utilisation de la fonctionnalité
- `CHANGELOG.md` : Détails de la version 1.3
- `SETUP.md` : Guide d'installation général
- `README.md` : Documentation principale

---

✨ **Après la migration, redémarrez votre serveur de développement** :

```bash
npm run dev
```

Vous devriez maintenant voir les boutons "Test complet" et les nouveaux onglets dans la page Tests ! 🎉

