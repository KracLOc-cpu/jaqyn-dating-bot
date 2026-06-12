"""/start — лаунчер Mini App.

Онбординг переехал в Mini App (Фаза 3.5). Бот теперь только:
  • проверяет @username (без него контакт после мэтча некому открыть);
  • upsert'ит User;
  • показывает меню с кнопкой запуска Mini App;
  • шлёт уведомления о мэтчах (api/notify.py из процесса API).
"""
from __future__ import annotations

from aiogram import Router
from aiogram.filters import CommandObject, CommandStart
from aiogram.types import Message
from sqlalchemy.ext.asyncio import AsyncSession

from bot.handlers.menu import send_main_menu
from db.models import User

router = Router()


def _parse_ref(args: str | None) -> int | None:
    """Реферальный deep link: /start ref_<telegram_id>."""
    if not args or not args.startswith("ref_"):
        return None
    try:
        return int(args[4:])
    except ValueError:
        return None


@router.message(CommandStart())
async def cmd_start(message: Message, session: AsyncSession, command: CommandObject) -> None:
    tg = message.from_user
    if tg is None:
        return

    # Без @username не пускаем — иначе после мэтча не с чем связать людей.
    if not tg.username:
        await message.answer(
            "Чтобы мы могли связать тебя с мэтчами, нужен <b>@username</b>.\n\n"
            "Открой настройки Telegram → Имя пользователя, задай его и возвращайся — /start"
        )
        return

    ref = _parse_ref(command.args)
    user = await session.get(User, tg.id)
    if user is None:
        # referred_by ставится только при первом контакте и не на самого себя
        session.add(User(
            telegram_id=tg.id, username=tg.username, first_name=tg.first_name or "",
            referred_by=ref if ref and ref != tg.id else None,
        ))
    else:
        user.username = tg.username
        user.first_name = tg.first_name or user.first_name
        if user.is_banned:
            await message.answer("Доступ к боту ограничён.")
            return

    await send_main_menu(message, "Добро пожаловать в Jaqyn 👋\nОткрой анкеты:")
