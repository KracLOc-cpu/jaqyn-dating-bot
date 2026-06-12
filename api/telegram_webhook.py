"""Telegram webhook endpoint hosted inside FastAPI.

This lets the free test deployment run API and bot launcher in one Render web
service instead of a separate paid/background worker.
"""
from __future__ import annotations

from aiogram import Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import Update
from fastapi import APIRouter, Header, HTTPException, Request, status
from redis.asyncio import Redis

from bot.main import build_dispatcher
from shared.config import settings

router = APIRouter(tags=["telegram"])

_bot: Bot | None = None
_redis: Redis | None = None
_dp = None


async def setup_telegram_webhook() -> None:
    global _bot, _dp, _redis
    if settings.bot_mode != "webhook":
        return

    _bot = Bot(
        token=settings.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    _redis = Redis.from_url(settings.redis_url) if settings.use_redis else None
    _dp = build_dispatcher(_redis)

    if settings.webhook_url:
        url = f"{settings.webhook_url.rstrip('/')}/telegram/webhook"
        await _bot.set_webhook(
            url=url,
            secret_token=settings.webhook_secret or None,
            drop_pending_updates=True,
        )


async def close_telegram_webhook() -> None:
    global _bot, _dp, _redis
    if _bot is not None:
        await _bot.session.close()
    if _redis is not None:
        await _redis.aclose()
    _bot = None
    _dp = None
    _redis = None


@router.post("/telegram/webhook")
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
) -> dict[str, bool]:
    if settings.webhook_secret and x_telegram_bot_api_secret_token != settings.webhook_secret:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "bad webhook secret")
    if _bot is None or _dp is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "telegram webhook is not configured")

    data = await request.json()
    update = Update.model_validate(data, context={"bot": _bot})
    await _dp.feed_update(_bot, update)
    return {"ok": True}
