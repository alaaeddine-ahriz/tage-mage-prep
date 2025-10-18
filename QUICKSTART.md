# 🚀 Quick Start Guide

Get your Tage Mage Tracker PWA up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is fine)
- Google OAuth credentials (optional for later)

## Step 1: Clone & Install (2 minutes)

```bash
cd tage-mage-tracker
npm install
```

## Step 2: Set Up Supabase (2 minutes)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for it to initialize (~2 minutes)
3. Copy your project URL and anon key from Settings → API

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 3: Create Database Tables (1 minute)

1. In Supabase Dashboard, go to SQL Editor
2. Copy-paste the entire content of `supabase/migrations/001_initial_schema.sql`
3. Click "Run"

You should see: ✅ Success

## Step 4: Create Image Storage Bucket (30 seconds)

1. In Supabase Dashboard, go to Storage
2. Click "New bucket"
3. Name: `error-images`
4. Make it **Public**
5. Click "Create"

## Step 5: Run the App! (30 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You'll see the login page, but auth won't work yet without Google OAuth.

## Step 6: Set Up Google OAuth (Optional, 3 minutes)

### 6.1 Get Google Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: **Web application**
6. Authorized redirect URIs: `https://xxxxx.supabase.co/auth/v1/callback`
   (Replace xxxxx with your Supabase project ID)
7. Copy Client ID and Client Secret

### 6.2 Configure in Supabase

1. Supabase Dashboard → Authentication → Providers
2. Enable **Google**
3. Paste Client ID and Client Secret
4. Save

### 6.3 Test Login

1. Reload [http://localhost:3000](http://localhost:3000)
2. Click "Continue with Google"
3. Sign in with your Google account
4. You're in! 🎉

## What's Next?

### Add Your First Test

1. Go to the Tests page
2. Click "+ Ajouter un test"
3. Fill in:
   - Date: today
   - Type: TD
   - Subtest: Calcul
   - Score: 12/15
4. Click "Enregistrer"

Your first test is logged! You'll see it in the dashboard.

### Log Your First Error

1. Go to Errors page
2. Click "+ Ajouter une erreur"
3. Take/upload a photo of a question you got wrong
4. Select subtest and add details
5. Click "Enregistrer"

### Create Your First Notion

1. Go to Notions page
2. Click "+ Ajouter une notion"
3. Example:
   - Subtest: Calcul
   - Title: "Table de 13"
   - Description: "13×1=13, 13×2=26, ..."
4. Click "Créer"

## PWA Features

### Install on Mobile

**iPhone/iPad:**
1. Open in Safari
2. Tap Share button
3. "Add to Home Screen"

**Android:**
1. Open in Chrome
2. Tap menu
3. "Add to Home Screen"

### Test Offline Mode

1. Open DevTools (F12)
2. Go to Application → Service Workers
3. Check "Offline"
4. Try using the app - it still works!
5. Add a test while offline
6. Go back online - it syncs automatically

## Troubleshooting

### Can't sign in
- Make sure Google OAuth is set up correctly
- Check that redirect URI matches exactly
- Clear cookies and try again

### Database errors
- Verify the migration ran successfully
- Check Supabase logs in the Dashboard

### Images not uploading
- Ensure `error-images` bucket exists
- Make sure it's set to Public
- Check browser console for errors

## Deploy to Production

### Vercel (Easiest)

```bash
npm install -g vercel
vercel
```

Don't forget to add environment variables in Vercel dashboard!

### Other Platforms

Works on Netlify, Railway, Render, etc. Just make sure to:
1. Set environment variables
2. Build command: `npm run build`
3. Start command: `npm start`

## Need More Help?

- Check [README.md](./README.md) for full documentation
- See [SETUP.md](./SETUP.md) for detailed setup instructions
- Open an issue on GitHub if you're stuck

---

Happy studying! 📚✨


