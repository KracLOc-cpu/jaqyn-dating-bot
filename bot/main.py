"""Точка входа бота (aiogram 3).

FSM-состояния и данные онбординга хранятся в Redis (RedisStorage) с TTL —
переживают рестарт и разрыв, пользователь продолжает с того же шага.

BOT_MODE=polling (local) | webhook (prod, реализуется при деплое).
"""
from __future__ import annotations

import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.fsm.storage.redis import RedisStorage
from redis.asyncio import Redis

from bot.handlers import menu, start
from bot.middlewares.db import DbSessionMiddleware
from bot.middlewares.throttle import ThrottleMiddleware
from shared.config import settings
from shared.s3 import ensure_bucket

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bot")


def build_dispatcher(redis: Redis | None = None) -> Dispatcher:
    storage = (
        RedisStorage(
            redis=redis,
            state_ttl=settings.onboarding_ttl,
            data_ttl=settings.onboarding_ttl,
        )
        if redis is not None
        else MemoryStorage()
    )
    dp = Dispatcher(storage=storage)

    if redis is not None:
        # Анти-флуд — внешним слоем, до открытия сессии БД.
        throttle = ThrottleMiddleware(redis)
        dp.message.middleware(throttle)
        dp.callback_query.middleware(throttle)

    # Сессия БД на каждый апдейт.
    dp.message.middleware(DbSessionMiddleware())
    dp.callback_query.middleware(DbSessionMiddleware())

    dp.include_router(start.router)
    dp.include_router(menu.router)
    return dp


async def run() -> None:
    try:
        ensure_bucket()
    except Exception as e:  # noqa: BLE001
        logger.warning("ensure_bucket failed: %s", e)

    redis = Redis.from_url(settings.redis_url) if settings.use_redis else None
    bot = Bot(
        token=settings.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = build_dispatcher(redis)

    if settings.bot_mode == "webhook":
        logger.warning("webhook mode is not implemented yet — running polling")

    logger.info("Bot starting in POLLING mode")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(run())
