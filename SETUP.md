# 🚀 Setup Instructions

## Prerequisites

- Node.js 18+ and npm
- A Supabase account
- Google OAuth credentials (optional, but required for auth)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (takes ~2 minutes)
3. Note your project URL and anon key from Settings → API

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Database Migration

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run the SQL

This will create:
- `tests` table (for TD and mock exams)
- `errors` table (for mistake tracking)
- `notions` table (for spaced repetition)
- `notion_reviews` table (review history)
- All necessary RLS policies

### 5. Create Storage Bucket for Images

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `error-images`
4. Set to **Public** bucket
5. Click "Create bucket"

### 6. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Application type: Web application
6. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
7. Copy Client ID and Client Secret

Then in Supabase:
1. Go to Authentication → Providers
2. Enable Google
3. Paste your Client ID and Client Secret
4. Save

### 7. Create PWA Icons

You need to create two PNG icons in the `public` folder:

**icon-192.png** (192x192 pixels)
- Simple, recognizable logo
- Solid background color
- High contrast

**icon-512.png** (512x512 pixels)
- Same design as 192px version
- Higher resolution

**Quick way using an online tool:**
1. Go to [realfavicongenerator.net](https://realfavicongenerator.net)
2. Upload your logo
3. Generate and download the icons
4. Rename them to `icon-192.png` and `icon-512.png`
5. Place them in the `public` folder

**Or use this placeholder SVG as a starting point:**
- Open `public/icon-192.svg` in a graphics editor
- Export as PNG at 192x192 and 512x512

### 8. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see the login page. Click "Continue with Google" to sign in.

### 9. Build for Production

```bash
npm run build
npm start
```

The PWA service worker will be active in production mode.

## 🧪 Testing PWA Features

### Test Offline Mode
1. Open DevTools (F12)
2. Go to Application → Service Workers
3. Check "Offline"
4. Reload the page - it should still work

### Test Installation
1. In Chrome: Look for the install icon in the address bar
2. Or: Menu → "Install Tage Mage Tracker"
3. The app should open in standalone mode

### Test on Mobile
1. Deploy to a hosting service (Vercel, Netlify, etc.)
2. Open the URL on your phone
3. Add to home screen
4. Launch from home screen - should feel like a native app

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Or use the [Vercel GitHub integration](https://vercel.com/new) for automatic deployments.

**Important:** Add your environment variables in Vercel project settings!

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

## 🐛 Troubleshooting

### "Auth session missing" error
- Make sure you've configured Google OAuth correctly
- Check that the redirect URI matches exactly
- Clear cookies and try again

### Images not uploading
- Check that the `error-images` bucket exists
- Verify it's set to Public
- Check browser console for CORS errors

### Service worker not registering
- Service workers only work on HTTPS (or localhost)
- Check that next-pwa is installed correctly
- Look for errors in DevTools → Console

### Database queries failing
- Verify RLS policies are enabled
- Check that you're signed in
- Look at the Network tab for failed requests

## 📞 Need Help?

Check the main [README.md](./README.md) for more information about the app features and structure.

