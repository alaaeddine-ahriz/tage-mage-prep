# 📘 Tage Mage Tracker - PWA

A progressive web app for tracking Tage Mage exam preparation with tests, errors, and spaced repetition for notions.

## 🚀 Features

- ✅ **Tests & Scores**: Track your performance on practice tests (TD) and mock exams
- ✅ **Error Tracking**: Log mistakes with photos, categorize, and review them
- ✅ **Spaced Repetition**: Master concepts with an intelligent review system
- ✅ **Offline First**: Works without internet, syncs when back online
- ✅ **Dark Mode**: Full theme support
- ✅ **PWA**: Installable on iOS, Android, and Desktop

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth (Google OAuth)
- **UI**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **PWA**: next-pwa
- **Image Compression**: browser-image-compression

## 📦 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

Create a `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Database Migrations

Execute the SQL in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor.

### 4. Configure Google OAuth

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)
4. Set authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

### 5. Create Storage Bucket

In Supabase Dashboard → Storage:
1. Create a new bucket named `error-images`
2. Set it to **Public** (or configure RLS policies)

### 6. Generate PWA Icons

You need to create two icon files in the `public` folder:
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)

These should be square icons with your app logo/branding.

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 PWA Installation

### iOS (iPhone/iPad)
1. Open the app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"

### Android
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen"

### Desktop (Chrome/Edge)
1. Click the install icon in the address bar
2. Or: Menu → "Install Tage Mage Tracker"

## 🗂️ Project Structure

```
tage-mage-tracker/
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Main app pages
│   │   ├── page.tsx         # Dashboard
│   │   ├── tests/           # Tests & scores
│   │   ├── errors/          # Error tracking
│   │   └── notions/         # Spaced repetition
│   └── auth/callback/       # OAuth callback
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── forms/               # Form components
│   ├── charts/              # Chart components
│   └── layout/              # Navigation components
├── lib/
│   ├── supabase/            # Supabase clients
│   ├── utils/               # Utility functions
│   └── types/               # TypeScript types
└── supabase/
    └── migrations/          # Database schema
```

## 🎯 Usage

### Adding a Test
1. Go to Tests page
2. Click "Ajouter un test"
3. Fill in: date, type (TD/Blanc), subtest, score
4. Submit (takes < 10 seconds)

### Logging an Error
1. Go to Errors page
2. Click "Ajouter une erreur"
3. Take/upload photo of the question
4. Add subtest, category, correct answer, and explanation
5. Submit

### Reviewing a Notion
1. Go to Notions page
2. Click on a notion that's due for review
3. Read the notion description
4. Click "Oublié" or "Je sais"
5. The system automatically schedules the next review

## 🔒 Security

- All data is protected with Row Level Security (RLS)
- Users can only access their own data
- Authentication required for all protected routes
- Image uploads are compressed client-side before upload

## 📊 Spaced Repetition Algorithm

| Level | Interval |
|-------|----------|
| 0     | 1 day    |
| 1     | 3 days   |
| 2     | 7 days   |
| 3     | 14 days  |
| 4     | 30 days  |
| 5     | 90 days  |

## 🚧 Roadmap

- [ ] Push notifications for daily reminders
- [ ] Data export (CSV/PDF)
- [ ] Quiz mode for notions
- [ ] Advanced statistics and analytics
- [ ] Collaborative study groups

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

Built with ❤️ for Tage Mage preparation
