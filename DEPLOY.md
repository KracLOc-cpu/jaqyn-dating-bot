# Jaqyn Deploy / Runbook

## Local

1. Copy env:

```bash
cp .env.example .env
```

2. Fill at minimum:

```env
BOT_TOKEN=...
ADMIN_TELEGRAM_IDS=...
VITE_USE_MOCKS=true
VITE_API_URL=http://localhost:8000
```

3. Start stack:

```bash
docker-compose --env-file .env -f docker-compose.yml up -d --build
```

Local URLs:

- API: `http://localhost:8000/health`
- Mini App container: `http://localhost:8080`
- MinIO console: `http://localhost:9001`

For frontend-only development from `mini_app/`:

```bash
npm install
npm run dev
```

Use `VITE_USE_MOCKS=true` outside Telegram. Real API mode requires valid Telegram `initData`.

## Production

Required external values:

- `BOT_TOKEN`
- `API_DOMAIN`, for example `api.example.com`
- `MINI_APP_DOMAIN`, for example `app.example.com`
- `MINI_APP_URL=https://<MINI_APP_DOMAIN>`
- `WEBHOOK_URL=https://<API_DOMAIN>`
- `ACME_EMAIL`
- Cloudflare R2 credentials: `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- `ADMIN_TELEGRAM_IDS`
- strong `POSTGRES_PASSWORD`
- strong `WEBHOOK_SECRET`

For a free test deployment, see `FREE_TEST_DEPLOY.md`.

Important production env:

```env
ENV=prod
BOT_MODE=webhook
VITE_USE_MOCKS=false
VITE_API_URL=https://api.example.com
CORS_ORIGINS=https://app.example.com
```

Start:

```bash
docker-compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Checks:

```bash
curl https://api.example.com/health
curl https://app.example.com
```

## Telegram Setup

In BotFather:

1. Set the bot domain / Mini App URL to `https://<MINI_APP_DOMAIN>`.
2. Ensure the bot opens the Mini App button with `MINI_APP_URL`.
3. Use HTTPS only. Telegram Mini Apps with real auth cannot be tested fully on plain local HTTP.

## Storage Notes

For local MinIO, frontend direct upload goes to the presigned URL returned by API.
For production R2, configure bucket CORS to allow the Mini App origin:

```json
[
  {
    "AllowedOrigins": ["https://app.example.com"],
    "AllowedMethods": ["GET", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

Without storage CORS, `/photos/presign` can succeed while browser upload to R2 fails.
