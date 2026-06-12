"""Админ-ручки. Все требуют telegram_id ∈ ADMIN_TELEGRAM_IDS (get_current_admin)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select

from api.deps import CurrentAdmin, DbDep
from api.schemas import OkResponse, PhotoModerationPatch, ReportAdminOut, ReportPatch
from db.models import Event, Match, Photo, PhotoModeration, Profile, Report, ReportStatus, User

router = APIRouter(prefix="/admin", tags=["admin"])

_TERMINAL = {ReportStatus.dismissed.value, ReportStatus.action_taken.value}


@router.get("/reports", response_model=list[ReportAdminOut])
async def list_reports(
    db: DbDep,
    _: CurrentAdmin,
    status_filter: str = Query("open", alias="status"),
):
    stmt = select(Report).order_by(Report.created_at.desc())
    if status_filter != "all":
        stmt = stmt.where(Report.status == status_filter)
    rows = (await db.scalars(stmt)).all()
    return [ReportAdminOut.model_validate(r, from_attributes=True) for r in rows]


@router.patch("/reports/{report_id}", response_model=ReportAdminOut)
async def update_report(db: DbDep, _: CurrentAdmin, report_id: UUID, patch: ReportPatch):
    report = await db.get(Report, report_id)
    if report is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "report not found")
    valid = {s.value for s in ReportStatus}
    if patch.status not in valid:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"status must be one of {valid}")
    report.status = patch.status
    if patch.moderator_note is not None:
        report.moderator_note = patch.moderator_note
    report.resolved_at = datetime.now(timezone.utc) if patch.status in _TERMINAL else None
    await db.flush()
    return ReportAdminOut.model_validate(report, from_attributes=True)


@router.patch("/photos/{photo_id}", response_model=OkResponse)
async def moderate_photo(db: DbDep, _: CurrentAdmin, photo_id: UUID, patch: PhotoModerationPatch):
    photo = await db.get(Photo, photo_id)
    if photo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "photo not found")
    valid = {s.value for s in PhotoModeration}
    if patch.moderation_status not in valid:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"status must be one of {valid}")
    photo.moderation_status = patch.moderation_status
    return OkResponse()


@router.post("/users/{user_id}/ban", response_model=OkResponse)
async def ban_user(db: DbDep, _: CurrentAdmin, user_id: int):
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "user not found")
    user.is_banned = True
    return OkResponse()


@router.post("/users/{user_id}/unban", response_model=OkResponse)
async def unban_user(db: DbDep, _: CurrentAdmin, user_id: int):
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "user not found")
    user.is_banned = False
    return OkResponse()


@router.get("/stats")
async def stats(db: DbDep, _: CurrentAdmin, hours: int = Query(24, ge=1, le=720)):
    """Метрики пилота за последние `hours` часов + общие итоги.

    Главные сигналы: match_rate (взаимность), feed_empty/feed_similar
    (дефицит анкет), баланс полов в new_profiles.
    """
    since = datetime.now(timezone.utc) - timedelta(hours=hours)

    async def count_events(event: str) -> int:
        return (
            await db.scalar(
                select(func.count()).select_from(Event)
                .where(Event.event == event, Event.created_at >= since)
            )
        ) or 0

    # новые завершённые анкеты по полу (из meta события onboarding_done)
    gender_rows = (
        await db.execute(
            select(Event.meta["gender"].astext, func.count())
            .where(Event.event == "onboarding_done", Event.created_at >= since)
            .group_by(Event.meta["gender"].astext)
        )
    ).all()
    new_profiles = {g or "unknown": n for g, n in gender_rows}

    swipes = await count_events("swipe")
    likes = (
        await db.scalar(
            select(func.count()).select_from(Event).where(
                Event.event == "swipe",
                Event.created_at >= since,
                Event.meta["liked"].astext == "true",
            )
        )
    ) or 0
    matches = await count_events("match")

    dau = (
        await db.scalar(
            select(func.count(func.distinct(Event.user_id)))
            .where(Event.created_at >= since, Event.user_id.is_not(None))
        )
    ) or 0

    return {
        "period_hours": hours,
        "dau": dau,
        "new_profiles": new_profiles,
        "swipes": swipes,
        "likes": likes,
        "matches": matches,
        "match_rate": round(matches / likes, 3) if likes else None,
        "feed_opened": await count_events("feed_opened"),
        "feed_empty": await count_events("feed_empty"),
        "feed_similar": await count_events("feed_similar"),
        "referrals_activated": await count_events("referral_activated"),
        "reports": await count_events("report"),
        "blocks": await count_events("block"),
        "totals": {
            "users": (await db.scalar(select(func.count()).select_from(User))) or 0,
            "active_profiles": (
                await db.scalar(
                    select(func.count()).select_from(Profile)
                    .where(Profile.onboarding_done.is_(True), Profile.is_active.is_(True))
                )
            ) or 0,
            "matches": (await db.scalar(select(func.count()).select_from(Match))) or 0,
        },
    }
