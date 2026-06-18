# SERVICES.md — карта сервисов проекта Jaqyn

> Где что живёт и как подключиться. **Секретов здесь НЕТ** — репозиторий публичный.
> Сами значения (пароли, токены, ключи) → в `CREDENTIALS.local.md` (только на ПК,
> не коммитится). Если файла нет — спроси владельца проекта.

## Топология

```
Vercel (Mini App, React+Vite)
   └─ VITE_API_URL ─► Render (FastAPI, Docker)
                         ├─ DATABASE_URL ─► Supabase Postgres
                         └─ S3_* ─────────► Cloudflare R2 (фото)
Telegram bot webhook ─► тот же сервис на Render
```

## Сервисы

| Сервис | Назначение | Дашборд | Идентификатор |
|--------|-----------|---------|---------------|
| **GitHub** | Код | https://github.com/KracLOc-cpu/jaqyn-dating-bot | публичный репо, ветка `main` |
| **Supabase** | Postgres БД | https://supabase.com/dashboard/project/tinfgusdxchnuthfuiwh | project ref `tinfgusdxchnuthfuiwh`, регион `ap-northeast-1` |
| **Render** | Бэкенд (API + bot webhook) | https://dashboard.render.com | сервис `jaqyn-dating-bot`, Docker, free |
| **Vercel** | Mini App (фронт) | https://vercel.com/dashboard | проект `jaqyn-dating-bot`, root `mini_app` |
| **Cloudflare R2** | Хранилище фото | https://dash.cloudflare.com | бакет `jaqyn-photos` (создаётся) |
| **Telegram BotFather** | Бот и Mini App кнопка | https://t.me/BotFather | `/mybots` → Jaqyn |

## Боевые URL

- Бэкенд: `https://jaqyn-dating-bot.onrender.com` (health: `/health`)
- Фронт: `https://jaqyn-dating-bot.vercel.app`

## Переменные окружения

**Render (бэкенд)** — значения см. `CREDENTIALS.local.md`:

```
DATABASE_URL            # Supabase session pooler, порт 5432
BOT_TOKEN               # из BotFather
BOT_MODE=webhook
WEBHOOK_URL             # = боевой URL Render
WEBHOOK_SECRET          # случайная строка
MINI_APP_URL            # = боевой URL Vercel
CORS_ORIGINS            # = боевой URL Vercel
ENV=prod
USE_REDIS=false
AUTO_APPROVE_PHOTOS=true   # пилот: фото сразу в ленту (см. AGENTS.md идея №2)
POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB   # дубликат для Settings (можно из DATABASE_URL)
S3_ENDPOINT             # https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=jaqyn-photos
S3_ACCESS_KEY / S3_SECRET_KEY   # R2 API token
SIGNED_URL_TTL=3600
ADMIN_TELEGRAM_IDS      # telegram id владельца
```

**Vercel (фронт)**:

```
VITE_API_URL=https://jaqyn-dating-bot.onrender.com
VITE_USE_MOCKS=false
```

## Где менять что

- Схема БД / SQL → миграции Alembic (`db/migrations/`), Render гонит `alembic upgrade head` на старте.
- Env бэкенда → Render → Environment → Save → Manual Deploy.
- Env фронта → задаются в `vercel.json` (`env`) или Vercel → Settings → Environment Variables.
- Mini App кнопка/URL → BotFather → Bot Settings.

_Источник истины по значениям секретов — Render env (для рантайма) и `CREDENTIALS.local.md` (для агентов на ПК)._
