"""Свайпы и логика мэтча.

Лайк → если есть встречный лайк → создаём Match (нормализованный) → уведомляем
обоих и раскрываем контакт. Контакт НЕ раскрывается при одностороннем лайке.
"""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from sqlalchemy import or_, select

from api.deps import DbDep, OnboardedProfile
from api.notify import send_match
from api.schemas import SwipeIn, SwipeResult
from db.models import Block, Match, Profile, Swipe, User
from shared.track import track

router = APIRouter(prefix="/swipes", tags=["swipes"])


@router.post("", response_model=SwipeResult)
async def create_swipe(
    db: DbDep, me: OnboardedProfile, body: SwipeIn, bg: BackgroundTasks
):
    mid = me.user_id
    if body.swiped_id == mid:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "cannot swipe yourself")

    target = await db.get(User, body.swiped_id)
    if target is None or target.is_banned:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "user not found")

    # Блокировка в любую сторону → нельзя.
    blocked = await db.scalar(
        select(Block).where(
            or_(
                (Block.blocker_id == mid) & (Block.blocked_id == body.swiped_id),
                (Block.blocker_id == body.swiped_id) & (Block.blocked_id == mid),
            )
        )
    )
    if blocked is not None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "blocked")

    # Upsert свайпа.
    swipe = await db.get(Swipe, (mid, body.swiped_id))
    if swipe is None:
        db.add(Swipe(swiper_id=mid, swiped_id=body.swiped_id, liked=body.liked))
    else:
        swipe.liked = body.liked
    await db.flush()
    await track(db, "swipe", user_id=mid, liked=body.liked)

    if not body.liked:
        return SwipeResult(matched=False)

    # Есть ли встречный лайк?
    reciprocal = await db.get(Swipe, (body.swiped_id, mid))
    if reciprocal is None or not reciprocal.liked:
        return SwipeResult(matched=False)

    # Мэтч! Создаём, если ещё нет.
    u1, u2 = Match.normalize(mid, body.swiped_id)
    existing = await db.scalar(
        select(Match).where(Match.user1_id == u1, Match.user2_id == u2)
    )
    if existing is None:
        db.add(Match(user1_id=u1, user2_id=u2))
        await db.flush()
        await track(db, "match", user_id=mid, partner=body.swiped_id)
        me_user = await db.get(User, mid)
        me_profile = me  # OnboardedProfile
        target_profile = await db.get(Profile, body.swiped_id)
        # Уведомление — после коммита (BackgroundTasks), с примитивами.
        bg.add_task(
            send_match,
            mid, me_profile.name, me_user.username,
            body.swiped_id, target_profile.name if target_profile else target.first_name,
            target.username,
        )

    return SwipeResult(matched=True, contact_username=target.username)
