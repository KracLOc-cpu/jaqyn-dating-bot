# Handoff for next Codex session

## Project

Telegram dating bot / Mini App: **Jaqyn**

GitHub repository:

```text
https://github.com/KracLOc-cpu/jaqyn-dating-bot
```

Local project path on this machine:

```text
\\efc-nhd.efc.net\muradil.sattarov\Рабочий стол\клауд\dating-bot
```

Current branch:

```text
main
```

## User context

The user wants a free/cheap test deployment and does not want to learn DevOps details.
Explain steps very simply, avoid jargon where possible, and do as much as possible directly.

The user is okay with using:

- GitHub
- Supabase
- Render
- Vercel
- Cloudflare R2

The user previously pasted a Telegram bot token in chat. Do **not** print it back.
Before public launch, recommend rotating/regenerating the token in BotFather.

## Current implementation status

Backend:

- FastAPI API exists.
- aiogram bot exists.
- SQLAlchemy async models exist.
- Alembic migrations exist.
- API Dockerfile and Render setup exist.
- API can run bot webhook inside the FastAPI service for free Render deployment.
- Redis can be disabled for free Render test using `USE_REDIS=false`.
- Database config supports `DATABASE_URL`.
- `DATABASE_URL` is automatically converted from `postgresql://` / `postgres://`
  to `postgresql+asyncpg://`.
- `scripts/check_db.py` exists to test database connection and Alembic revision.

Frontend:

- React + Vite Mini App exists in `mini_app`.
- Vercel config exists in `mini_app/vercel.json`.
- Dockerfile exists for local/prod container use, but free test should use Vercel.

Deploy docs:

- `FREE_TEST_DEPLOY.md`
- `DEPLOY.md`
- `LOCAL_SETUP.md`

Recent commits already pushed:

- `6d6653a Initial Jaqyn dating bot MVP`
- `e71d210 Document free test deployment targets`
- `f9225c9 Add Supabase database check script`

## Supabase status

Supabase project ref:

```text
tinfgusdxchnuthfuiwh
```

We stopped because the user could not find `DATABASE_URL`.

Important: project ref alone is **not enough** to connect. Need the Postgres connection string.

In Supabase Dashboard:

1. Open the project.
2. Click **Connect**.
3. Choose **Session pooler**.
4. Copy the connection string.
5. Replace `[YOUR-PASSWORD]` with the database password.

Expected shape:

```text
postgres://postgres.tinfgusdxchnuthfuiwh:<DB_PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

Use this in env as:

```env
DATABASE_URL=postgres://postgres.tinfgusdxchnuthfuiwh:<DB_PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

Prefer **Session pooler** on port `5432`, not transaction pooler on port `6543`,
because asyncpg/prepared statements can be painful with transaction pooling.

If user does not know the database password:

- Supabase Dashboard -> Project Settings -> Database
- Reset database password
- Use the new password in the connection string

Do not ask for Supabase account password or Gmail password.

## Local check after getting DATABASE_URL

If Python dependencies are installed locally:

```bash
python scripts/check_db.py
alembic upgrade head
python scripts/check_db.py
```

If local dependencies are not installed, do not waste time on corporate machine.
Render will run `alembic upgrade head` on startup through `api/entrypoint.sh`.

## Free deploy target

Goal:

```text
Vercel Mini App
    -> Render FastAPI backend
        -> Supabase Postgres
        -> Cloudflare R2 photos
Telegram bot webhook
    -> same Render FastAPI backend
```

## Render backend env vars

Create Render web service/Blueprint from:

```text
https://github.com/KracLOc-cpu/jaqyn-dating-bot
```

Required env vars:

```env
BOT_TOKEN=<telegram bot token>
BOT_MODE=webhook
WEBHOOK_URL=https://<render-service-url>
WEBHOOK_SECRET=<random long string>
MINI_APP_URL=https://<vercel-app-url>
ENV=prod
USE_REDIS=false
DATABASE_URL=<supabase session pooler URL>
S3_ENDPOINT=https://<cloudflare-account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=<r2-bucket-name>
S3_ACCESS_KEY=<r2-access-key-id>
S3_SECRET_KEY=<r2-secret-access-key>
SIGNED_URL_TTL=3600
CORS_ORIGINS=https://<vercel-app-url>
ADMIN_TELEGRAM_IDS=<user telegram id if known>
```

`POSTGRES_*` values can remain placeholders if `DATABASE_URL` is set.

## Vercel frontend env vars

Import GitHub repo in Vercel.

Use:

```text
Root Directory: mini_app
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

Env vars:

```env
VITE_API_URL=https://<render-service-url>
VITE_USE_MOCKS=false
```

After Vercel URL exists, update Render:

```env
MINI_APP_URL=https://<vercel-app-url>
CORS_ORIGINS=https://<vercel-app-url>
```

Then redeploy Render.

## Cloudflare R2

Current code expects S3-compatible object storage with presigned upload.
Use Cloudflare R2 for test/prod.

Need from user/account:

- Cloudflare Account ID
- R2 bucket name
- R2 Access Key ID
- R2 Secret Access Key

R2 bucket CORS must allow Vercel app origin for browser upload.

Example CORS:

```json
[
  {
    "AllowedOrigins": ["https://<vercel-app-url>"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## Telegram setup

After Vercel URL is ready:

1. Open BotFather.
2. `/mybots`
3. Choose Jaqyn bot.
4. Bot Settings -> Menu Button / Web App depending on BotFather UI.
5. Set Mini App URL to the Vercel URL.

Backend webhook will be set automatically by FastAPI lifespan when Render starts,
if `BOT_MODE=webhook` and `WEBHOOK_URL` are correct.

## Things to verify

Backend:

```bash
curl https://<render-service-url>/health
```

Expected:

```json
{"status":"ok"}
```

Database:

- Render logs should show migrations completed.
- If possible, run `scripts/check_db.py` with the same `DATABASE_URL`.

Frontend:

- Open Vercel URL.
- In normal browser outside Telegram, some Telegram-authenticated API calls may fail.
- For realistic test, open through Telegram Mini App.

Bot:

- Send `/start` to the bot.
- It should answer and/or show Mini App button.

## Safety notes

- Do not commit `.env`.
- Do not print secrets in final answers.
- If the user shares secrets in chat for speed, use them but remind them to rotate/delete after test.
- The Telegram bot token was already exposed in chat earlier; rotate before public release.

