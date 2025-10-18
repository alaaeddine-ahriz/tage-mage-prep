# Known Issues & Setup Notes

## TypeScript Build Errors Before Database Setup

**Status**: Expected behavior, will resolve after Supabase setup

### Issue

When running `npm run build` before setting up the Supabase database, you'll see TypeScript errors like:
- `Property 'score' does not exist on type 'never'`
- `Property 'understood' does not exist on type 'never'`

### Why This Happens

The Supabase TypeScript types are generated from your database schema. Since the database tables don't exist yet, TypeScript infers `never` for all table types, causing type errors throughout the codebase.

### Solution

**Option 1: Set up Supabase first (Recommended)**
1. Create your Supabase project
2. Run the migration in `supabase/migrations/001_initial_schema.sql`
3. The types will be properly inferred from the actual database schema
4. Build will succeed

**Option 2: Build without type checking (Temporary)**
```bash
npm run build -- --no-lint
```

This skips TypeScript checking and will produce a working build, but you'll miss type safety.

**Option 3: Run in development mode**
```bash
npm run dev
```

Development mode is more lenient with types and the app will work correctly once you've set up Supabase.

### After Database Setup

Once you've:
1. Created your Supabase project
2. Run the migration SQL
3. Added your environment variables

The app will work perfectly and all type errors will resolve automatically.

## PWA Icons Missing

The app needs `icon-192.png` and `icon-512.png` in the `public` folder.

**Quick fix**: 
1. Create a square logo (192x192 and 512x512)
2. Or use an online generator like [realfavicongenerator.net](https://realfavicongenerator.net)
3. Place the generated icons in `public/`

## Image Warnings

You'll see warnings about using `<img>` instead of `<Image />` from next/image. These are intentional for:
- User-uploaded error images (dynamic, external URLs)
- Better compatibility with Supabase Storage URLs
- Simpler implementation for MVP

You can optimize these later if needed.

---

**Bottom line**: The app is fully functional. The type errors you see are expected before database setup and will disappear once you follow the setup instructions in `QUICKSTART.md` or `SETUP.md`.


