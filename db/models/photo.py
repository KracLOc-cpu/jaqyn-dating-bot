"""Фото профиля. В БД хранится только storage_key (не публичный URL).

Публичный доступ — через signed URL, генерируется на лету (shared/s3.py).
В ленте показываются только фото со статусом approved.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, SmallInteger, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class PhotoModeration(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Photo(Base):
    __tablename__ = "photos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.telegram_id", ondelete="CASCADE"), nullable=False, index=True
    )
    storage_key: Mapped[str] = mapped_column(String, nullable=False)
    display_order: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    moderation_status: Mapped[str] = mapped_column(
        String(20), default=PhotoModeration.pending.value, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="photos")  # noqa: F821
