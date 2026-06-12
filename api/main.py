"""FastAPI приложение для Mini App."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.notify import close_bot
from api.routers import admin, matches, moderation, photos, profiles, swipes
from api.telegram_webhook import close_telegram_webhook, router as telegram_router, setup_telegram_webhook
from shared.config import settings
from shared.s3 import ensure_bucket


@asynccontextmanager
async def lifespan(app: FastAPI):
    # MinIO стартует с пустым стораджем — создаём бакет при первом запуске.
    try:
        ensure_bucket()
    except Exception as e:  # noqa: BLE001 — не валим API, если сторадж ещё не готов
        print(f"[warn] ensure_bucket failed: {e}")
    await setup_telegram_webhook()
    yield
    await close_telegram_webhook()
    await close_bot()


app = FastAPI(title="Dating Bot API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "env": settings.env}


app.include_router(profiles.router)
app.include_router(swipes.router)
app.include_router(matches.router)
app.include_router(photos.router)
app.include_router(moderation.router)
app.include_router(admin.router)
app.include_router(telegram_router)
