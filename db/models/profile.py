"""Dating-анкета. 1:1 с User, но отдельная таблица.

Разделение даёт: проще скрывать/удалять анкету, не трогая Telegram identity;
чисто отделены чувствительные данные (национальность, языки, намерения).
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    SmallInteger,
    String,
    Text,
    func,
)
# postgresql.ARRAY (а не core ARRAY) — даёт .any() / .overlap() / .contains()
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


# Допустимые значения (валидируются на уровне бота/API, в БД — VARCHAR)
GENDERS = ("male", "female")
LOOKING_FOR = ("male", "female", "both")
INTENTIONS = ("serious", "marriage", "open")


class Profile(Base):
    __tablename__ = "profiles"

    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.telegram_id", ondelete="CASCADE"), primary_key=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)
    looking_for: Mapped[str] = mapped_column(String(10), nullable=False)
    birth_year: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    city: Mapped[str] = mapped_column(String, nullable=False)
    nationality: Mapped[str | None] = mapped_column(String, nullable=True)
    pref_nat: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    languages: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    intention: Mapped[str] = mapped_column(String(20), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    age_min: Mapped[int] = mapped_column(SmallInteger, default=16, nullable=False)
    age_max: Mapped[int] = mapped_column(SmallInteger, default=99, nullable=False)
    # PostGIS-ready, пока не используется
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    onboarding_done: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Буст видимости (награда за реферала): до этого момента анкета идёт первой в ленте.
    boost_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="profile")  # noqa: F821
