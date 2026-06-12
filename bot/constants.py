"""Справочники для онбординга.

⚠️ Списки ниже — СТАРТОВЫЕ, под пилот в Казахстане. Их нужно согласовать с
владельцем продукта и при необходимости расширить/локализовать. Значения в
скобках (value) сохраняются в БД, подписи (label) показываются пользователю.

Национальность пользователь указывает СВОЮ свободным текстом (приватный параметр).
Списки здесь — только для multiselect "кого хочешь видеть" (pref_nat) и языков.
"""
from __future__ import annotations

# Кого готов видеть (pref_nat). value → в БД, label → в кнопке.
NATIONALITY_OPTIONS: list[tuple[str, str]] = [
    ("kazakh", "Қазақ"),
    ("russian", "Русский / Орыс"),
    ("uzbek", "Өзбек"),
    ("uyghur", "Ұйғыр"),
    ("tatar", "Татар"),
    ("korean", "Кәріс"),
    ("turk", "Түрік"),
    ("azerbaijani", "Әзірбайжан"),
    ("other", "Басқа / Другое"),
]

# Языки общения (multiselect).
LANGUAGE_OPTIONS: list[tuple[str, str]] = [
    ("kk", "Қазақша"),
    ("ru", "Русский"),
    ("en", "English"),
    ("tr", "Türkçe"),
]

# Намерения.
INTENTION_OPTIONS: list[tuple[str, str]] = [
    ("serious", "Серьёзные отношения"),
    ("marriage", "Брак"),
    ("open", "Открыт(а) к общению"),
]

GENDER_OPTIONS: list[tuple[str, str]] = [
    ("male", "Мужской"),
    ("female", "Женский"),
]

LOOKING_FOR_OPTIONS: list[tuple[str, str]] = [
    ("male", "Мужчин"),
    ("female", "Женщин"),
    ("both", "Всех"),
]

MAX_PHOTOS = 3
MIN_BIRTH_YEAR = 1940

# Быстрый доступ value → label
NATIONALITY_LABELS = dict(NATIONALITY_OPTIONS)
LANGUAGE_LABELS = dict(LANGUAGE_OPTIONS)
INTENTION_LABELS = dict(INTENTION_OPTIONS)
