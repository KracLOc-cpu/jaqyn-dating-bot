"""Отправка уведомлений из процесса API.

API и бот — разные процессы. Чтобы уведомить о мэтче, API использует тот же
BOT_TOKEN и шлёт сообщения через aiogram Bot (singleton). Контакт (@username)
раскрывается ТОЛЬКО здесь — после взаимного лайка.

Вызывается через BackgroundTasks (после коммита транзакции), поэтому принимает
примитивы, а не ORM-объекты (сессия к тому моменту закрыта).
"""
from __future__ import annotations

import logging

from aiogram import Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from shared.config import settings

logger = logging.getLogger("api.notify")

_bot: Bot | None = None


def _get_bot() -> Bot:
    global _bot
    if _bot is None:
        _bot = Bot(
            token=settings.bot_token,
            default=DefaultBotProperties(parse_mode=ParseMode.HTML),
        )
    return _bot


async def close_bot() -> None:
    global _bot
    if _bot is not None:
        await _bot.session.close()
        _bot = None


def _contact_line(username: str | None) -> str:
    if username:
        return f"Напиши первым: @{username}"
    return "У собеседника не указан @username — попроси его установить."


async def send_match(
    a_id: int, a_name: str, a_username: str | None,
    b_id: int, b_name: str, b_username: str | None,
) -> None:
    bot = _get_bot()
    try:
        await bot.send_message(a_id, f"🎉 У тебя мэтч с {b_name}!\n{_contact_line(b_username)}")
        await bot.send_message(b_id, f"🎉 У тебя мэтч с {a_name}!\n{_contact_line(a_username)}")
    except Exception as e:  # noqa: BLE001 — кто-то мог заблокировать бота
        logger.warning("send_match failed: %s", e)


async def send_boost(referrer_id: int, friend_name: str, hours: int) -> None:
    """Награда за реферала: друг завершил анкету → буст видимости рефереру."""
    bot = _get_bot()
    try:
        await bot.send_message(
            referrer_id,
            f"🚀 {friend_name} заполнил(а) анкету по твоему приглашению!\n"
            f"Твоя анкета будет показываться чаще ближайшие {hours} ч.",
        )
    except Exception as e:  # noqa: BLE001
        logger.warning("send_boost failed: %s", e)
