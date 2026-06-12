"""Анти-флуд на Redis.

Скользящий счётчик на пользователя: не более LIMIT апдейтов за WINDOW секунд.
При превышении апдейт тихо отбрасывается (один раз предупреждаем).
Защищает от спам-кликов и автоматизированного флуда.
"""
from __future__ import annotations

from typing import Any, Awaitable, Callable

from aiogram import BaseMiddleware
from aiogram.types import CallbackQuery, Message, TelegramObject
from redis.asyncio import Redis


class ThrottleMiddleware(BaseMiddleware):
    def __init__(self, redis: Redis, limit: int = 20, window: int = 10) -> None:
        self.redis = redis
        self.limit = limit
        self.window = window

    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        user = data.get("event_from_user")
        if user is None:
            return await handler(event, data)

        key = f"throttle:{user.id}"
        count = await self.redis.incr(key)
        if count == 1:
            await self.redis.expire(key, self.window)

        if count > self.limit:
            # Предупреждаем единожды (на отметке limit+1), дальше молчим.
            if count == self.limit + 1:
                if isinstance(event, Message):
                    await event.answer("Слишком много действий. Подожди немного 🙏")
                elif isinstance(event, CallbackQuery):
                    await event.answer("Слишком быстро, подожди немного", show_alert=False)
            return None

        return await handler(event, data)
