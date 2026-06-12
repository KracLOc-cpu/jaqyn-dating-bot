"""Пользовательская модерация: жалобы и блокировки (доступно любому юзеру)."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from sqlalchemy.dialects.postgresql import insert as pg_insert

from api.deps import CurrentUser, DbDep
from api.schemas import BlockIn, OkResponse, ReportIn
from db.models import Block, Report, User
from shared.track import track

router = APIRouter(tags=["moderation"])


@router.post("/reports", response_model=OkResponse)
async def create_report(db: DbDep, user: CurrentUser, body: ReportIn):
    if body.reported_id == user.telegram_id:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "cannot report yourself")
    if await db.get(User, body.reported_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "user not found")
    db.add(Report(reporter_id=user.telegram_id, reported_id=body.reported_id, reason=body.reason))
    await track(db, "report", user_id=user.telegram_id, target=body.reported_id)
    return OkResponse()


@router.post("/blocks", response_model=OkResponse)
async def create_block(db: DbDep, user: CurrentUser, body: BlockIn):
    if body.blocked_id == user.telegram_id:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "cannot block yourself")
    if await db.get(User, body.blocked_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "user not found")
    # Идемпотентно: повторный блок не падает.
    stmt = (
        pg_insert(Block)
        .values(blocker_id=user.telegram_id, blocked_id=body.blocked_id)
        .on_conflict_do_nothing(index_elements=["blocker_id", "blocked_id"])
    )
    await db.execute(stmt)
    await track(db, "block", user_id=user.telegram_id, target=body.blocked_id)
    return OkResponse()
