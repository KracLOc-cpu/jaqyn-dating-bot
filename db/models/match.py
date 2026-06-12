"""Взаимный матч. Хранится как неориентированная пара:
user1_id = min(a, b), user2_id = max(a, b) — нормализация исключает дубли.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base


class Match(Base):
    __tablename__ = "matches"
    __table_args__ = (UniqueConstraint("user1_id", "user2_id", name="uq_match_pair"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user1_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.telegram_id", ondelete="CASCADE"), nullable=False, index=True
    )
    user2_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.telegram_id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    @staticmethod
    def normalize(a: int, b: int) -> tuple[int, int]:
        """Вернуть (user1_id, user2_id) в нормализованном порядке."""
        return (a, b) if a < b else (b, a)
