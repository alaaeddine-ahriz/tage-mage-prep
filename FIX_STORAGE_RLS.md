# 🔧 Fix: "new row violates row-level security policy" pour les images

## Le Problème

Quand vous uploadez une image d'erreur, vous obtenez cette erreur car le bucket Storage `error-images` n'a pas les bonnes policies RLS.

## Solution Rapide (2 méthodes)

### Méthode 1: SQL Policies (Recommandé)

1. Allez dans Supabase Dashboard → SQL Editor
2. Copiez et exécutez le contenu de `supabase/migrations/002_storage_policies.sql`
3. Rafraîchissez votre app et réessayez

### Méthode 2: Configuration Manuelle (Plus simple)

1. Allez dans **Supabase Dashboard** → **Storage** → **error-images**
2. Cliquez sur **Policies**
3. Créez ces 4 policies:

#### Policy 1: Upload (INSERT)
```
Policy name: Users can upload own error images
Allowed operation: INSERT
Target roles: authenticated
USING expression: (bucket_id = 'error-images' AND (storage.foldername(name))[1] = auth.uid()::text)
```

#### Policy 2: Update
```
Policy name: Users can update own error images
Allowed operation: UPDATE
Target roles: authenticated
USING expression: (bucket_id = 'error-images' AND (storage.foldername(name))[1] = auth.uid()::text)
```

#### Policy 3: Delete
```
Policy name: Users can delete own error images
Allowed operation: DELETE
Target roles: authenticated
USING expression: (bucket_id = 'error-images' AND (storage.foldername(name))[1] = auth.uid()::text)
```

#### Policy 4: Read (SELECT)
```
Policy name: Anyone can view error images
Allowed operation: SELECT
Target roles: public
USING expression: bucket_id = 'error-images'
```

## Vérification

Après avoir configuré les policies:

1. Déconnectez-vous et reconnectez-vous à l'app
2. Allez dans **Erreurs** → **Ajouter une erreur**
3. Prenez/uploadez une photo
4. Ça devrait fonctionner ! ✅

## Explications

Les policies RLS garantissent que:
- ✅ Chaque utilisateur peut uniquement uploader dans son propre dossier (`user_id/`)
- ✅ Chaque utilisateur peut uniquement modifier/supprimer ses propres images
- ✅ Tout le monde peut voir les images (car le bucket est public)

Si vous voulez que seuls les utilisateurs authentifiés voient les images, changez la policy 4 de `public` à `authenticated`.

## Si ça ne marche toujours pas

Vérifiez que:
1. Le bucket `error-images` existe
2. Le bucket est configuré en **Public**
3. Vous êtes bien connecté à l'app
4. Les environment variables sont correctes dans `.env.local`

## Alternative: Bucket Public Sans RLS

Si vous voulez éviter les policies RLS sur le storage (moins sécurisé mais plus simple):

1. Allez dans Storage → error-images
2. Configuration → Public bucket: **ON**
3. Policies → Désactivez toutes les policies
4. Choisissez "Allow all operations" (pas recommandé en production)

⚠️ **Note**: Cette méthode est moins sécurisée car n'importe qui pourrait uploader dans votre bucket.

---

**Solution recommandée**: Utilisez la Méthode 1 (SQL) ou Méthode 2 (Manuelle) pour une sécurité optimale.


