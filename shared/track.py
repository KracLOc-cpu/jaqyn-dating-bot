"""Запись продуктовых событий (метрики пилота).

Использование: await track(db, "swipe", user_id=..., liked=True).
Пишет в ту же транзакцию, что и бизнес-действие — не делает отдельный commit.
Никогда не роняет основную операцию: ошибка трекинга только логируется.
"""
from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Event

logger = logging.getLogger("shared.track")

# Словарь событий (не enum — чтобы добавление не требовало миграции):
#   profile_created   {gender}
#   onboarding_done   {gender}
#   feed_opened       {strict, similar, city}
#   feed_empty        {city}
#   feed_similar      {count}      — показали «похожих» (индикатор дефицита анкет)
#   swipe             {liked}
#   match             {with}
#   report / block    {target}
#   referral_activated {referrer, friend}


async def track(db: AsyncSession, event: str, user_id: int | None = None, **meta) -> None:
    try:
        db.add(Event(user_id=user_id, event=event, meta=meta))
        await db.flush()
    except Exception as e:  # noqa: BLE001 — метрики не должны ломать продукт
        logger.warning("track(%s) failed: %s", event, e)
