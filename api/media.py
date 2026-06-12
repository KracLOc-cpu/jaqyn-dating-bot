"""Хелперы для выдачи signed URL фото.

Фото приватные — наружу отдаём только временные signed URL (TTL = SIGNED_URL_TTL).
Фронт обязан перезапрашивать URL после истечения (см. ТЗ для Mini App).
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Photo, PhotoModeration
from shared import s3
from shared.config import settings


async def photo_urls(
    session: AsyncSession, user_id: int, *, approved_only: bool
) -> list[str]:
    """Signed URL фото пользователя в порядке display_order."""
    stmt = select(Photo).where(Photo.user_id == user_id)
    if approved_only:
        stmt = stmt.where(Photo.moderation_status == PhotoModeration.approved.value)
    stmt = stmt.order_by(Photo.display_order)
    rows = (await session.scalars(stmt)).all()
    return [s3.presign_download(p.storage_key) for p in rows]


async def main_photo_url(session: AsyncSession, user_id: int) -> str | None:
    urls = await photo_urls(session, user_id, approved_only=True)
    return urls[0] if urls else None


def ttl() -> int:
    return settings.signed_url_ttl
