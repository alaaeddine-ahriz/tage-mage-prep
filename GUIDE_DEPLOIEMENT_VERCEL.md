# 🚀 Guide de Déploiement sur Vercel

Ce guide vous accompagne pas à pas pour déployer votre application **Tage Mage Prep Tracker** sur Vercel via GitHub.

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :

- ✅ Un compte [GitHub](https://github.com)
- ✅ Un compte [Vercel](https://vercel.com) (peut être créé avec votre compte GitHub)
- ✅ Un projet Supabase configuré avec les tables nécessaires
- ✅ Votre code prêt et testé en local

---

## 📂 Étape 1 : Préparation du Projet

### 1.1 Vérifier le fichier `.gitignore`

Assurez-vous que votre `.gitignore` ignore bien les fichiers sensibles :

```
.env*
.vercel
node_modules
.next
```

✅ **Déjà configuré** dans votre projet !

### 1.2 Créer un fichier `.env.example`

Créez un fichier `.env.example` à la racine du dossier `tage-mage-tracker` pour documenter les variables d'environnement nécessaires :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

⚠️ **Important** : Ne mettez jamais vos vraies clés dans ce fichier, seulement des exemples !

### 1.3 Vérifier la configuration Next.js

Votre `next.config.ts` est déjà correctement configuré pour la production avec PWA.

---

## 🐙 Étape 2 : Configuration GitHub

### 2.1 Créer un nouveau repository

1. Allez sur [GitHub](https://github.com)
2. Cliquez sur **New Repository** (bouton vert en haut à droite)
3. Configurez votre repository :
   - **Repository name** : `tage-mage-tracker` (ou le nom de votre choix)
   - **Description** : "Application de suivi de préparation Tage Mage"
   - **Visibility** : Private (recommandé) ou Public
   - ⚠️ **NE COCHEZ PAS** "Initialize with README" (vous avez déjà un projet)
4. Cliquez sur **Create repository**

### 2.2 Pousser votre code sur GitHub

Ouvrez un terminal dans le dossier `tage-mage-tracker` et exécutez :

```bash
# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Créer le premier commit
git commit -m "Initial commit - Tage Mage Prep Tracker"

# Ajouter le repository GitHub comme remote
git remote add origin https://github.com/VOTRE_USERNAME/tage-mage-tracker.git

# Pousser le code sur GitHub
git branch -M main
git push -u origin main
```

⚠️ **Remplacez** `VOTRE_USERNAME` par votre nom d'utilisateur GitHub !

### 2.3 Vérifier que le code est bien sur GitHub

Rafraîchissez la page de votre repository GitHub, vous devriez voir tous vos fichiers.

---

## 🎯 Étape 3 : Déploiement sur Vercel

### 3.1 Créer un compte Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **Sign Up**
3. Choisissez **Continue with GitHub**
4. Autorisez Vercel à accéder à votre compte GitHub

### 3.2 Importer votre projet

1. Une fois connecté à Vercel, cliquez sur **Add New...** → **Project**
2. Vous verrez la liste de vos repositories GitHub
3. Trouvez `tage-mage-tracker` et cliquez sur **Import**

### 3.3 Configurer le projet

#### Configuration de base

Dans l'écran de configuration :

1. **Framework Preset** : Next.js (détecté automatiquement)
2. **Root Directory** : `./tage-mage-tracker` 
   - ⚠️ **Important** : Cliquez sur "Edit" et spécifiez `tage-mage-tracker` car votre projet est dans un sous-dossier
3. **Build and Output Settings** : Laisser par défaut
   - Build Command : `next build`
   - Output Directory : `.next`
   - Install Command : `npm install`

#### Variables d'environnement

Cliquez sur **Environment Variables** et ajoutez :

| Name | Value | Where to find it |
|------|-------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Dashboard Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1...` | Dashboard Supabase → Settings → API → Project API keys → anon public |

Pour ajouter chaque variable :
1. Tapez le **nom** de la variable (ex: `NEXT_PUBLIC_SUPABASE_URL`)
2. Collez la **valeur** depuis votre Supabase
3. Sélectionnez les environnements : **Production**, **Preview**, **Development**
4. Cliquez sur **Add**

### 3.4 Déployer

1. Après avoir ajouté toutes les variables d'environnement
2. Cliquez sur le bouton **Deploy** (en bas)
3. ⏳ Attendez quelques minutes pendant le build...
4. 🎉 Félicitations ! Votre app est en ligne !

---

## 🗄️ Étape 4 : Configuration Supabase pour la Production

### 4.1 Ajouter l'URL de production aux URL autorisées

1. Allez sur votre [Dashboard Supabase](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Authentication** → **URL Configuration**
4. Ajoutez les URLs suivantes :

**Site URL** :
```
https://votre-app.vercel.app
```

**Redirect URLs** (une par ligne) :
```
https://votre-app.vercel.app/auth/callback
https://*.vercel.app/auth/callback
```

⚠️ **Remplacez** `votre-app` par le nom de domaine donné par Vercel !

### 4.2 Configurer les politiques de stockage (Storage)

Si vous utilisez le stockage Supabase pour les images :

1. Allez dans **Storage** → Votre bucket (ex: "error-images")
2. Vérifiez que les politiques RLS sont bien configurées
3. Référez-vous à `FIX_STORAGE_RLS.md` si nécessaire

---

## ✅ Étape 5 : Vérifications Post-Déploiement

### 5.1 Tester l'application

1. Ouvrez l'URL fournie par Vercel (ex: `https://votre-app.vercel.app`)
2. Testez l'inscription/connexion
3. Vérifiez que vous pouvez :
   - ✅ Créer un test
   - ✅ Ajouter des erreurs
   - ✅ Ajouter des notions
   - ✅ Voir les graphiques
   - ✅ Uploader des images

### 5.2 Vérifier le mode PWA

1. Ouvrez l'application sur mobile
2. Vous devriez voir une notification pour "Ajouter à l'écran d'accueil"
3. Testez le mode offline

### 5.3 Vérifier les logs

Dans le dashboard Vercel :
- Allez dans votre projet
- Cliquez sur **Deployments**
- Cliquez sur le dernier déploiement
- Consultez les **Runtime Logs** pour vérifier qu'il n'y a pas d'erreurs

---

## 🔄 Étape 6 : Déploiements Futurs

### Mode automatique (recommandé)

Par défaut, Vercel est configuré en mode automatique :

1. Chaque fois que vous faites un `git push` sur la branche `main`
2. Vercel détecte automatiquement le changement
3. Un nouveau déploiement est lancé automatiquement
4. Vous recevez une notification quand c'est terminé

### Déploiement manuel depuis Vercel

Si vous voulez redéployer sans changer le code :

1. Allez sur votre dashboard Vercel
2. Sélectionnez votre projet
3. Cliquez sur **Deployments**
4. Cliquez sur les 3 points ⋮ du dernier déploiement
5. Cliquez sur **Redeploy**

---

## 🌐 Étape 7 : Configurer un Domaine Personnalisé (Optionnel)

### 7.1 Ajouter un domaine

1. Dans le dashboard Vercel, allez dans votre projet
2. Cliquez sur **Settings** → **Domains**
3. Cliquez sur **Add Domain**
4. Entrez votre domaine (ex: `tage-mage.com`)
5. Suivez les instructions pour configurer vos DNS

### 7.2 Mettre à jour Supabase

N'oubliez pas d'ajouter votre nouveau domaine dans les **Redirect URLs** de Supabase !

---

## 🐛 Résolution des Problèmes Courants

### Erreur "Module not found"

**Solution** : Vérifiez que toutes les dépendances sont dans `package.json`

```bash
npm install
git add package.json package-lock.json
git commit -m "Fix dependencies"
git push
```

### Erreur "Root Directory not found"

**Solution** : Vérifiez que vous avez bien configuré `tage-mage-tracker` comme Root Directory dans les settings Vercel :
1. Settings → General → Root Directory → Edit → `tage-mage-tracker`

### Erreurs d'authentification Supabase

**Solution** :
1. Vérifiez que les variables d'environnement sont correctes dans Vercel
2. Vérifiez que l'URL Vercel est ajoutée dans Supabase → Authentication → URL Configuration
3. Vérifiez que le format est : `https://votre-app.vercel.app/auth/callback`

### Le PWA ne fonctionne pas

**Solution** :
1. Le PWA est désactivé en développement (c'est normal)
2. Vérifiez que `next-pwa` est dans les `devDependencies`
3. Le service worker est généré uniquement en production

### Images Supabase ne s'affichent pas

**Solution** :
1. Vérifiez les politiques RLS du bucket Storage
2. Vérifiez que le bucket est public ou que les politiques permettent l'accès
3. Consultez `FIX_STORAGE_RLS.md`

---

## 📊 Monitoring et Analytics

### Activer les Analytics Vercel (Optionnel)

1. Dans votre projet Vercel
2. Allez dans **Analytics**
3. Cliquez sur **Enable**
4. Gratuit jusqu'à 100k pages vues/mois

### Activer les Speed Insights (Optionnel)

1. Dans votre projet Vercel
2. Allez dans **Speed Insights**
3. Cliquez sur **Enable**
4. Suivez les instructions pour installer le package

---

## 🎯 Checklist Finale

Avant de dire que c'est terminé, vérifiez :

- [ ] ✅ Le code est sur GitHub
- [ ] ✅ Le projet est déployé sur Vercel
- [ ] ✅ Les variables d'environnement sont configurées
- [ ] ✅ L'URL Vercel est ajoutée dans Supabase
- [ ] ✅ L'authentification fonctionne
- [ ] ✅ Les fonctionnalités principales fonctionnent
- [ ] ✅ Le PWA est installable sur mobile
- [ ] ✅ Les images s'affichent correctement
- [ ] ✅ Pas d'erreurs dans les logs Vercel

---

## 📚 Ressources Utiles

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Next.js Deployment](https://nextjs.org/docs/deployment)
- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Support Vercel](https://vercel.com/support)

---

## 🆘 Besoin d'Aide ?

Si vous rencontrez des problèmes :

1. Consultez les logs dans Vercel Dashboard → Deployments → Runtime Logs
2. Vérifiez les issues GitHub de Next.js et Supabase
3. Consultez la documentation de Vercel
4. Contactez le support Vercel (très réactif !)

---

**Bon déploiement ! 🚀**


