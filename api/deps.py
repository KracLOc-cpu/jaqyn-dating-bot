"""FastAPI-зависимости: сессия БД, текущий пользователь, проверка админа.

Авторизация — через заголовок X-Telegram-Init-Data (initData Mini App).
"""
from __future__ import annotations

from typing import Annotated, AsyncGenerator

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import InitDataError, validate_init_data
from db.models import Profile, User
from db.session import AsyncSessionLocal
from shared.config import settings


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


DbDep = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    db: DbDep,
    x_telegram_init_data: Annotated[str | None, Header()] = None,
) -> User:
    """Валидирует initData и upsert'ит User из него.

    Онбординг идёт в Mini App, поэтому пользователь может прийти в API раньше,
    чем нажмёт /start в боте — создаём User здесь. На каждом запросе освежаем
    username/first_name (в Telegram они меняются)."""
    if not x_telegram_init_data:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "missing init data")
    try:
        tg = validate_init_data(x_telegram_init_data)
    except InitDataError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"invalid init data: {e}") from e

    user = await db.get(User, tg.id)
    if user is None:
        user = User(telegram_id=tg.id, username=tg.username, first_name=tg.first_name or "")
        db.add(user)
        await db.flush()
    else:
        if tg.username != user.username:
            user.username = tg.username
        if tg.first_name:
            user.first_name = tg.first_name

    if user.is_banned:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "banned")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_onboarded_profile(db: DbDep, user: CurrentUser) -> Profile:
    """Гарантирует, что у пользователя завершён онбординг (нужно для ленты/свайпов)."""
    profile = await db.get(Profile, user.telegram_id)
    if profile is None or not profile.onboarding_done:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "onboarding not completed")
    return profile


OnboardedProfile = Annotated[Profile, Depends(get_onboarded_profile)]


async def get_current_admin(user: CurrentUser) -> User:
    """Поверх авторизации — проверка, что telegram_id в ADMIN_TELEGRAM_IDS."""
    if user.telegram_id not in settings.admin_ids:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "admin only")
    return user


CurrentAdmin = Annotated[User, Depends(get_current_admin)]
