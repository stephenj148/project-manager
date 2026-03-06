# Project Manager

Personal project tracker with tasks, check-ins, and push notifications. PWA-ready.

## Setup

### 1. Install dependencies

Open this folder in Cursor and run in the terminal:

```bash
npm install
```

### 2. Set up Supabase

1. Go to your Supabase project dashboard
2. Open the SQL editor and run everything in `supabase/schema.sql`
3. Copy your project URL and anon key from **Settings → API**

### 3. Generate VAPID keys (for push notifications)

In the terminal:

```bash
npx web-push generate-vapid-keys
```

Copy the output — you'll need both keys.

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase dashboard
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase dashboard
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase dashboard (Settings → API → service_role)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — from step 3
- `VAPID_PRIVATE_KEY` — from step 3
- `VAPID_SUBJECT` — `mailto:your@email.com`
- `CRON_SECRET` — any random string (e.g. output of `openssl rand -hex 20`)

### 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000

### 6. Deploy to Vercel

```bash
npx vercel
```

Add all `.env.local` variables to your Vercel project (Settings → Environment Variables).
Also add `CRON_SECRET` as a Vercel env var — the cron jobs use it for auth.

Point `projects.stephenjanus.com` to the Vercel deployment.

### 7. PWA icons

Add two PNG icons to `public/`:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)

Any simple logo or screenshot works. Without these, the PWA install prompt may not appear on iOS.

## Install on phone

- **iPhone**: Open in Safari → Share button → "Add to Home Screen"
- **Android**: Chrome menu → "Install app"

Once installed, push notifications will work.

## Cron jobs

Vercel runs two cron jobs daily (configured in `vercel.json`):
- `9am` — check-in reminder: "Any updates on your projects?"
- `8am` — due date sweep: alerts for upcoming deadlines

Frequency and due-date alert preferences are configurable in the app under **Settings**.
