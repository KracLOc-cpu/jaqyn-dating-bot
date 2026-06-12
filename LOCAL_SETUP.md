# Local setup on personal Windows PC

This project is self-contained in one folder:

```text
dating-bot/
```

Copy this whole folder to your personal PC, but do not copy generated folders:

- `mini_app/node_modules/`
- `mini_app/dist/`
- any `__pycache__/`
- `mini_app/*.tsbuildinfo`

They are rebuilt automatically.

## 1. Install software

Install these on the personal PC:

1. Docker Desktop for Windows.
2. Git for Windows, optional but useful.
3. A code editor, for example VS Code.

Docker Desktop may ask to enable WSL 2 and reboot Windows. Accept it.

## 2. Copy project

Recommended path on the personal PC:

```text
C:\projects\dating-bot
```

The folder should contain:

```text
api/
bot/
db/
mini_app/
shared/
.env.example
alembic.ini
docker-compose.yml
docker-compose.prod.yml
requirements.txt
```

## 3. Create `.env`

In `C:\projects\dating-bot`, copy:

```powershell
Copy-Item .env.example .env
```

Set local values:

```env
BOT_TOKEN=<your_bot_token>
BOT_MODE=polling
MINI_APP_URL=
ENV=local

VITE_API_URL=http://localhost:8000
VITE_USE_MOCKS=true
```

For local Docker testing, keep:

```env
S3_ENDPOINT=http://minio:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

## 4. Start Docker

Open Docker Desktop and wait until it says Docker is running.

Then open PowerShell in `C:\projects\dating-bot`:

```powershell
docker-compose --env-file .env -f docker-compose.yml up -d --build
```

## 5. Check services

API:

```powershell
curl http://localhost:8000/health
```

Mini App:

```text
http://localhost:8080
```

MinIO:

```text
http://localhost:9001
```

Login/password are from `.env`:

```env
MINIO_ROOT_USER
MINIO_ROOT_PASSWORD
```

## 6. Check bot

Open Telegram and send:

```text
/start
```

to your bot.

In local mode `MINI_APP_URL` is empty, so the Telegram Mini App button may not appear. This is normal until we have a real HTTPS URL or a tunnel.

## 7. Useful commands

Show containers:

```powershell
docker-compose --env-file .env -f docker-compose.yml ps
```

Logs:

```powershell
docker-compose --env-file .env -f docker-compose.yml logs -f api
docker-compose --env-file .env -f docker-compose.yml logs -f bot
```

Stop:

```powershell
docker-compose --env-file .env -f docker-compose.yml down
```

Stop and delete local DB/storage:

```powershell
docker-compose --env-file .env -f docker-compose.yml down -v
```

Use `down -v` only when you are okay with deleting local test data.

## 8. What we will test together

1. Docker stack starts.
2. API health returns ok.
3. Bot answers `/start`.
4. Mini App opens locally.
5. Then we decide how to expose Mini App through HTTPS for real Telegram testing.
