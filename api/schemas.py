"""Pydantic-схемы запросов и ответов API."""
from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


# ── Профили ──
class ProfileCard(BaseModel):
    """Карточка кандидата в ленте."""
    user_id: int
    name: str
    age: int
    city: str
    intention: str
    nationality: str | None
    languages: list[str]
    bio: str | None
    photos: list[str]  # signed URL'ы (TTL = photos_ttl)
    photos_ttl: int
    # строгие кандидаты закончились — анкета из «похожих» (сняты мои
    # культурные/языковые предпочтения; чужие границы не нарушаются)
    is_similar: bool = False


class MeProfile(BaseModel):
    user_id: int
    name: str
    gender: str
    looking_for: str
    birth_year: int
    city: str
    nationality: str | None
    pref_nat: list[str]
    languages: list[str]
    intention: str
    bio: str | None
    age_min: int
    age_max: int
    is_active: bool
    onboarding_done: bool


class ProfileCreate(BaseModel):
    """Создание анкеты из Mini App (онбординг). Фото грузятся отдельно (/photos)."""
    name: str = Field(min_length=2, max_length=50)
    gender: Literal["male", "female"]
    looking_for: Literal["male", "female", "both"]
    birth_year: int = Field(ge=1940)  # верхняя граница (текущий год) — в эндпоинте
    city: str = Field(min_length=2, max_length=60)
    nationality: str | None = None
    pref_nat: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    intention: Literal["serious", "marriage", "open"]
    bio: str | None = Field(default=None, max_length=500)
    age_min: int = Field(default=16, ge=16, le=99)
    age_max: int = Field(default=99, ge=16, le=99)


class ProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=50)
    city: str | None = Field(default=None, min_length=2, max_length=60)
    looking_for: str | None = None
    nationality: str | None = None
    pref_nat: list[str] | None = None
    languages: list[str] | None = None
    intention: str | None = None
    bio: str | None = Field(default=None, max_length=500)
    age_min: int | None = Field(default=None, ge=16, le=99)
    age_max: int | None = Field(default=None, ge=16, le=99)
    is_active: bool | None = None


# ── Свайпы / мэтчи ──
class SwipeIn(BaseModel):
    swiped_id: int
    liked: bool


class SwipeResult(BaseModel):
    matched: bool
    contact_username: str | None = None  # раскрывается только при мэтче


class MatchOut(BaseModel):
    user_id: int
    name: str
    username: str | None
    photo: str | None
    matched_at: datetime


# ── Фото ──
class PresignIn(BaseModel):
    content_type: Literal["image/jpeg", "image/png", "image/webp"] = "image/jpeg"


class PresignOut(BaseModel):
    storage_key: str
    url: str
    fields: dict
    ttl: int


class PhotoConfirmIn(BaseModel):
    storage_key: str


class PhotoOut(BaseModel):
    id: UUID
    url: str
    display_order: int
    moderation_status: str


# ── Модерация (пользовательская) ──
class ReportIn(BaseModel):
    reported_id: int
    reason: str = Field(min_length=1, max_length=500)


class BlockIn(BaseModel):
    blocked_id: int


# ── Admin ──
class ReportAdminOut(BaseModel):
    id: UUID
    reporter_id: int
    reported_id: int
    reason: str
    status: str
    moderator_note: str | None
    created_at: datetime


class ReportPatch(BaseModel):
    status: str
    moderator_note: str | None = None


class PhotoModerationPatch(BaseModel):
    moderation_status: str  # approved | rejected | pending


class OkResponse(BaseModel):
    ok: bool = True
