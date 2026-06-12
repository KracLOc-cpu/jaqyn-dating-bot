"""Главное меню и просмотр своей анкеты."""
from __future__ import annotations

from datetime import datetime

from aiogram import Router
from aiogram.types import CallbackQuery, Message
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from bot.keyboards.inline import main_menu_kb
from bot.constants import INTENTION_LABELS, NATIONALITY_LABELS, LANGUAGE_LABELS
from db.models import Profile
from shared.config import settings

router = Router()


async def send_main_menu(message: Message, text: str = "Главное меню") -> None:
    await message.answer(text, reply_markup=main_menu_kb(settings.mini_app_url or None))


def _format_profile(p: Profile) -> str:
    age = datetime.now().year - p.birth_year
    pref = (
        ", ".join(NATIONALITY_LABELS.get(x, x) for x in p.pref_nat)
        if p.pref_nat
        else "не важно"
    )
    langs = ", ".join(LANGUAGE_LABELS.get(x, x) for x in p.languages) or "—"
    return (
        f"<b>{p.name}</b>, {age}\n"
        f"📍 {p.city}\n"
        f"🎯 {INTENTION_LABELS.get(p.intention, p.intention)}\n"
        f"🗣 {langs}\n"
        f"👀 ищу: {pref}\n"
        f"\n{p.bio or '—'}"
    )


@router.callback_query(lambda c: c.data == "menu:profile")
async def show_profile(call: CallbackQuery, session: AsyncSession) -> None:
    profile = await session.get(Profile, call.from_user.id)
    if profile is None:
        await call.answer("Анкета не найдена. Напиши /start", show_alert=True)
        return
    await call.message.answer(_format_profile(profile))
    await call.answer()
