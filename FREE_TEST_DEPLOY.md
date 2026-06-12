# Free test deploy: Vercel + Supabase + Render + Cloudflare R2

Goal: let friends open the Telegram bot and test the real Mini App flow on phones.

Free-test architecture:

```text
Telegram bot
  -> Vercel Mini App
  -> Render FastAPI + Telegram webhook
  -> Supabase Postgres
  -> Cloudflare R2 photos
```

## What is free here

- Vercel Hobby: Mini App frontend.
- Supabase Free: PostgreSQL database.
- Render Free: one web service for FastAPI + Telegram webhook.
- Cloudflare R2 Free tier: photo storage for a small test.

Render Free can sleep after inactivity. First request after sleep may be slow.

## 0. Important token note

The current bot token was pasted into chat during development. It is okay for a
small private test, but before public launch revoke it in BotFather and use a new one.

## 1. Supabase

1. Create a Supabase project.
2. Open Project Settings -> Database.
3. Copy the Postgres connection string.
4. Use the pooled/transaction connection if Supabase recommends it.
5. This becomes Render env:

```env
DATABASE_URL=postgresql://...
```

The app converts `postgresql://` to `postgresql+asyncpg://` automatically.

## 2. Cloudflare R2

1. Create an R2 bucket, for example `jaqyn-photos-test`.
2. Create R2 API token / access keys.
3. Render env:

```env
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=jaqyn-photos-test
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```

4. Configure bucket CORS:

```json
[
  {
    "AllowedOrigins": ["https://YOUR-VERCEL-DOMAIN.vercel.app"],
    "AllowedMethods": ["GET", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

Without R2 CORS, photo upload from the phone browser will fail even if API works.

## 3. Render backend

1. Push this project to GitHub.
2. In Render, create a new Blueprint from the repository.
3. Render will read `render.yaml`.
4. Set env variables:

```env
BOT_TOKEN=<bot token>
BOT_MODE=webhook
USE_REDIS=false
ENV=prod

DATABASE_URL=<Supabase database URL>

S3_ENDPOINT=<R2 endpoint>
S3_REGION=auto
S3_BUCKET=<R2 bucket>
S3_ACCESS_KEY=<R2 access key>
S3_SECRET_KEY=<R2 secret key>

WEBHOOK_URL=https://YOUR-RENDER-SERVICE.onrender.com
MINI_APP_URL=https://YOUR-VERCEL-DOMAIN.vercel.app
CORS_ORIGINS=https://YOUR-VERCEL-DOMAIN.vercel.app
ADMIN_TELEGRAM_IDS=<your telegram id>
```

After deploy, check:

```text
https://YOUR-RENDER-SERVICE.onrender.com/health
```

Expected:

```json
{"status":"ok","env":"prod"}
```

## 4. Vercel Mini App

1. In Vercel, import the same GitHub repository.
2. Set Root Directory to:

```text
mini_app
```

3. Set env variables:

```env
VITE_USE_MOCKS=false
VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

4. Deploy.

Vercel URL becomes:

```text
https://YOUR-VERCEL-DOMAIN.vercel.app
```

Update Render env after this:

```env
MINI_APP_URL=https://YOUR-VERCEL-DOMAIN.vercel.app
CORS_ORIGINS=https://YOUR-VERCEL-DOMAIN.vercel.app
```

Redeploy Render after changing env.

## 5. BotFather

In BotFather:

1. Open your bot settings.
2. Set Mini App / Web App URL to:

```text
https://YOUR-VERCEL-DOMAIN.vercel.app
```

If BotFather asks for domain, use the Vercel domain.

## 6. Test checklist

1. Open bot in Telegram.
2. Send `/start`.
3. Tap Mini App button.
4. Complete onboarding.
5. Upload 1 photo.
6. Confirm it reaches moderation/profile.
7. Ask 1-2 friends to create profiles.
8. Test swipe -> match -> username reveal.

## Known free-test limitations

- Render Free sleeps; first request after idle can be slow.
- With `USE_REDIS=false`, bot anti-flood/FSM persistence is disabled. For this test it is acceptable because onboarding is in Mini App.
- R2 CORS must be correct for photo upload from phones.
- Telegram real `initData` exists only when opened inside Telegram, not in a normal browser.
