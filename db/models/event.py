"""Продуктовые события (метрики пилота).

Append-only лог: свайпы, мэтчи, открытия ленты, пустая лента, онбординг.
Без FK на users — история должна переживать удаление анкеты/юзера.
Агрегируется ручкой GET /admin/stats.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True, index=True)
    event: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    meta: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
