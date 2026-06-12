"""Список мэтчей с раскрытыми контактами."""
from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import or_, select

from api.deps import DbDep, OnboardedProfile
from api.media import main_photo_url
from api.schemas import MatchOut
from db.models import Match, Profile, User

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("", response_model=list[MatchOut])
async def list_matches(db: DbDep, me: OnboardedProfile):
    mid = me.user_id
    rows = (
        await db.scalars(
            select(Match)
            .where(or_(Match.user1_id == mid, Match.user2_id == mid))
            .order_by(Match.created_at.desc())
        )
    ).all()

    out: list[MatchOut] = []
    for m in rows:
        other_id = m.user2_id if m.user1_id == mid else m.user1_id
        other = await db.get(User, other_id)
        profile = await db.get(Profile, other_id)
        if other is None:
            continue
        out.append(
            MatchOut(
                user_id=other_id,
                name=profile.name if profile else other.first_name,
                username=other.username,
                photo=await main_photo_url(db, other_id),
                matched_at=m.created_at,
            )
        )
    return out
