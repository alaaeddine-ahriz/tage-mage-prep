# 🚀 Guide de Déploiement sur Vercel

Ce guide vous explique étape par étape comment déployer votre application Tage Mage Tracker sur Vercel.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :

1. ✅ Un compte [Vercel](https://vercel.com) (gratuit)
2. ✅ Un projet Supabase configuré avec :
   - Les migrations de base de données exécutées
   - Le bucket storage `error-images` créé
   - Google OAuth configuré
3. ✅ Un compte GitHub (recommandé pour le déploiement continu)

## 🎯 Méthode 1 : Déploiement via GitHub (Recommandé)

### Étape 1 : Créer un dépôt GitHub

1. Allez sur [GitHub](https://github.com) et créez un nouveau dépôt
2. Dans votre terminal, initialisez Git (si pas déjà fait) :

```bash
cd "/Users/alaaeddineahriz/Documents/Tage Mage/Prep Tracker/tage-mage-tracker"
git init
git add .
git commit -m "Initial commit"
```

3. Connectez votre dépôt local à GitHub :

```bash
git remote add origin https://github.com/votre-username/tage-mage-tracker.git
git branch -M main
git push -u origin main
```

### Étape 2 : Importer sur Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous
2. Cliquez sur **"Add New Project"** ou **"Import Project"**
3. Sélectionnez votre dépôt GitHub `tage-mage-tracker`
4. Vercel détectera automatiquement qu'il s'agit d'un projet Next.js

### Étape 3 : Configurer les Variables d'Environnement

Dans la section "Environment Variables", ajoutez :

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://votre-projet.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `votre_cle_anon_publique` |

**Comment obtenir ces valeurs :**
- Allez sur votre [Dashboard Supabase](https://supabase.com/dashboard)
- Sélectionnez votre projet
- Allez dans **Settings** → **API**
- Copiez "Project URL" et "anon public" key

### Étape 4 : Déployer

1. Cliquez sur **"Deploy"**
2. Attendez 2-3 minutes pendant que Vercel build votre application
3. Une fois terminé, vous recevrez une URL de production (ex: `tage-mage-tracker.vercel.app`)

### Étape 5 : Configurer l'URL de Callback Supabase

⚠️ **Important** : Ajoutez votre URL Vercel dans Supabase :

1. Allez sur [Dashboard Supabase](https://supabase.com/dashboard)
2. **Authentication** → **URL Configuration**
3. Ajoutez dans **"Redirect URLs"** :
   ```
   https://votre-app.vercel.app/auth/callback
   https://votre-app.vercel.app
   ```
4. Ajoutez dans **"Site URL"** :
   ```
   https://votre-app.vercel.app
   ```

### Étape 6 : Mettre à jour Google OAuth

Dans [Google Cloud Console](https://console.cloud.google.com) :

1. Allez dans **APIs & Services** → **Credentials**
2. Éditez votre OAuth 2.0 Client
3. Ajoutez dans **"Authorized redirect URIs"** :
   ```
   https://votre-projet.supabase.co/auth/v1/callback
   ```
4. Ajoutez dans **"Authorized JavaScript origins"** :
   ```
   https://votre-app.vercel.app
   ```

## 🎯 Méthode 2 : Déploiement Direct (Sans GitHub)

### Via Vercel CLI

1. Installez Vercel CLI :
```bash
npm install -g vercel
```

2. Connectez-vous :
```bash
vercel login
```

3. Déployez depuis le dossier du projet :
```bash
cd "/Users/alaaeddineahriz/Documents/Tage Mage/Prep Tracker/tage-mage-tracker"
vercel
```

4. Suivez les instructions et configurez les variables d'environnement quand demandé

5. Pour déployer en production :
```bash
vercel --prod
```

## ⚙️ Configuration Avancée

### Domaine Personnalisé

1. Dans Vercel, allez dans **Settings** → **Domains**
2. Ajoutez votre domaine personnalisé (ex: `tage-mage-tracker.com`)
3. Configurez les DNS selon les instructions Vercel
4. N'oubliez pas de mettre à jour les URLs dans Supabase et Google OAuth

### Variables d'Environnement par Environnement

Vercel permet de définir des variables pour chaque environnement :
- **Production** : Pour le site public
- **Preview** : Pour les pull requests
- **Development** : Pour le développement local

### Optimisations

Le projet est déjà optimisé pour Vercel avec :
- ✅ PWA avec caching intelligent
- ✅ Compression d'images côté client
- ✅ Next.js App Router
- ✅ API Routes optimisées

## 🔄 Déploiement Continu

Avec GitHub connecté :
- Chaque `push` sur `main` déploie automatiquement en production
- Chaque Pull Request crée un déploiement de preview
- URLs de preview : `tage-mage-tracker-git-branch-name.vercel.app`

## 📱 Tester la PWA

Une fois déployé :

### Sur Mobile (iOS/Android)
1. Ouvrez l'URL dans Safari (iOS) ou Chrome (Android)
2. Ajoutez à l'écran d'accueil
3. L'app s'ouvre en plein écran sans barre de navigation

### Sur Desktop
1. Ouvrez l'URL dans Chrome/Edge
2. Cliquez sur l'icône d'installation dans la barre d'adresse
3. L'app s'installe comme une application native

## 🐛 Dépannage

### Erreur de Build

Si le build échoue, vérifiez :
1. Que toutes les dépendances sont dans `package.json`
2. Qu'il n'y a pas d'erreurs TypeScript localement : `npm run build`
3. Les logs de build dans Vercel Dashboard

### Erreur de Connexion Supabase

Si l'authentification ne fonctionne pas :
1. Vérifiez que les variables d'environnement sont correctes
2. Vérifiez que les URLs de callback sont configurées dans Supabase
3. Vérifiez les logs dans Vercel → **Functions**

### Images non chargées

1. Vérifiez que le bucket `error-images` est public ou a les bonnes RLS policies
2. Vérifiez la configuration `next.config.ts` → `remotePatterns`

### PWA ne s'installe pas

1. L'app doit être servie en HTTPS (Vercel le fait automatiquement)
2. Vérifiez que `manifest.json` est accessible : `https://votre-app.vercel.app/manifest.json`
3. Vérifiez que les icônes (`icon-192.png` et `icon-512.png`) existent dans `/public`

## 📊 Monitoring

### Analytics Vercel

Vercel offre des analytics gratuits :
1. Allez dans votre projet → **Analytics**
2. Voyez les visiteurs, performance, etc.

### Logs en Temps Réel

Pour voir les logs :
1. Projet → **Functions**
2. Sélectionnez une fonction
3. Voyez les logs d'exécution

### Performance

Vercel affiche automatiquement :
- Core Web Vitals
- Temps de chargement
- Scores Lighthouse

## 🎉 Félicitations !

Votre application est maintenant en ligne ! 🚀

URL de production : `https://tage-mage-tracker.vercel.app` (ou votre domaine personnalisé)

### Prochaines Étapes

1. 📱 Installez la PWA sur votre téléphone
2. 🧪 Testez toutes les fonctionnalités en production
3. 📊 Configurez les analytics si nécessaire
4. 🔔 Configurez les notifications push (roadmap future)
5. 👥 Partagez avec d'autres étudiants du Tage Mage !

## 🆘 Besoin d'Aide ?

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Vercel Support](https://vercel.com/support)

---

Built with ❤️ for Tage Mage preparation

