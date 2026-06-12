"""Inline-клавиатуры онбординга.

Схема callback_data (префикс:значение):
  g:<value>          пол
  lf:<value>         кого ищет
  int:<value>        намерение
  pn:<value>         тоггл национальности | pn:__any__ | pn:__done__
  lang:<value>       тоггл языка        | lang:__done__
  skip:<field>       пропустить шаг (nationality, bio)
  photo:__done__     завершить добавление фото
"""
from __future__ import annotations

from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    WebAppInfo,
)
from aiogram.utils.keyboard import InlineKeyboardBuilder

from bot import constants

DONE = "__done__"
ANY = "__any__"


def _single(prefix: str, options: list[tuple[str, str]], per_row: int = 2) -> InlineKeyboardMarkup:
    b = InlineKeyboardBuilder()
    for value, label in options:
        b.button(text=label, callback_data=f"{prefix}:{value}")
    b.adjust(per_row)
    return b.as_markup()


def gender_kb() -> InlineKeyboardMarkup:
    return _single("g", constants.GENDER_OPTIONS)


def looking_for_kb() -> InlineKeyboardMarkup:
    return _single("lf", constants.LOOKING_FOR_OPTIONS, per_row=3)


def intention_kb() -> InlineKeyboardMarkup:
    return _single("int", constants.INTENTION_OPTIONS, per_row=1)


def nationality_kb() -> InlineKeyboardMarkup:
    """Своя национальность — single-select из того же словаря, что и pref_nat,
    плюс «Пропустить». Иначе фильтр в ленте не совпадёт по значениям."""
    b = InlineKeyboardBuilder()
    for value, label in constants.NATIONALITY_OPTIONS:
        b.button(text=label, callback_data=f"nat:{value}")
    b.adjust(2)
    tail = InlineKeyboardBuilder()
    tail.button(text="Пропустить", callback_data="skip:nationality")
    b.attach(tail)
    return b.as_markup()


def skip_kb(field: str) -> InlineKeyboardMarkup:
    b = InlineKeyboardBuilder()
    b.button(text="Пропустить", callback_data=f"skip:{field}")
    return b.as_markup()


def _multiselect(
    prefix: str,
    options: list[tuple[str, str]],
    selected: set[str],
    *,
    with_any: bool = False,
) -> InlineKeyboardMarkup:
    """Клавиатура множественного выбора: ✅ у выбранных + кнопка Готово."""
    b = InlineKeyboardBuilder()
    for value, label in options:
        mark = "✅ " if value in selected else ""
        b.button(text=f"{mark}{label}", callback_data=f"{prefix}:{value}")
    b.adjust(2)
    tail = InlineKeyboardBuilder()
    if with_any:
        tail.button(text="Не важно", callback_data=f"{prefix}:{ANY}")
    tail.button(text="Готово ➡️", callback_data=f"{prefix}:{DONE}")
    tail.adjust(2 if with_any else 1)
    b.attach(tail)
    return b.as_markup()


def pref_nat_kb(selected: set[str]) -> InlineKeyboardMarkup:
    return _multiselect("pn", constants.NATIONALITY_OPTIONS, selected, with_any=True)


def languages_kb(selected: set[str]) -> InlineKeyboardMarkup:
    return _multiselect("lang", constants.LANGUAGE_OPTIONS, selected)


def main_menu_kb(mini_app_url: str | None) -> InlineKeyboardMarkup:
    b = InlineKeyboardBuilder()
    if mini_app_url:
        # WebAppInfo открывает Mini App внутри Telegram.
        b.button(text="🔍 Смотреть анкеты", web_app=WebAppInfo(url=mini_app_url))
    b.button(text="✏️ Моя анкета", callback_data="menu:profile")
    b.adjust(1)
    return b.as_markup()
