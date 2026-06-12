"""Уведомления о мэтче.

Раскрытие контакта происходит ТОЛЬКО здесь — после взаимного лайка.
До этого @username никому не показывается (ключевой принцип продукта).

Функция вызывается из логики мэтча (Фаза 3 — API свайпов). Принимает bot и
двух пользователей; каждому шлёт уведомление со ссылкой на @username другого.
"""
from __future__ import annotations

import logging

from aiogram import Bot

from db.models import User

logger = logging.getLogger("bot.notifications")


def _contact_line(other: User) -> str:
    if other.username:
        return f"Напиши первым: @{other.username}"
    # На /start мы не пускаем без username, но подстраховка не повредит.
    return "У собеседника пока не указан @username — попроси его установить."


async def notify_match(bot: Bot, a: User, b: User) -> None:
    """Уведомить обоих участников о новом мэтче."""
    name_a = a.first_name
    name_b = b.first_name
    try:
        await bot.send_message(
            a.telegram_id,
            f"🎉 У тебя мэтч с {name_b}!\n{_contact_line(b)}",
        )
        await bot.send_message(
            b.telegram_id,
            f"🎉 У тебя мэтч с {name_a}!\n{_contact_line(a)}",
        )
    except Exception as e:  # noqa: BLE001 — один из пользователей мог заблокировать бота
        logger.warning("notify_match failed: %s", e)
