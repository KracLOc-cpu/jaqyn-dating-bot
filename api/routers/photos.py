"""Фото профиля (путь Mini App).

Flow: presign → фронт грузит файл напрямую в S3 → confirm (сохраняем metadata,
статус pending). Чтение/удаление — только своих фото.
"""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from api.deps import CurrentUser, DbDep
from api.media import ttl
from api.schemas import OkResponse, PhotoConfirmIn, PhotoOut, PresignIn, PresignOut
from db.models import Photo, PhotoModeration
from shared import s3
from shared.config import settings

router = APIRouter(prefix="/photos", tags=["photos"])

MAX_PHOTOS = 3


async def _count(db: DbDep, user_id: int) -> int:
    return await db.scalar(select(func.count()).select_from(Photo).where(Photo.user_id == user_id))


@router.get("/me", response_model=list[PhotoOut])
async def my_photos(db: DbDep, user: CurrentUser):
    rows = (
        await db.scalars(
            select(Photo).where(Photo.user_id == user.telegram_id).order_by(Photo.display_order)
        )
    ).all()
    return [
        PhotoOut(
            id=p.id,
            url=s3.presign_download(p.storage_key),
            display_order=p.display_order,
            moderation_status=p.moderation_status,
        )
        for p in rows
    ]


@router.post("/presign", response_model=PresignOut)
async def presign(db: DbDep, user: CurrentUser, body: PresignIn):
    if await _count(db, user.telegram_id) >= MAX_PHOTOS:
        raise HTTPException(status.HTTP_409_CONFLICT, f"max {MAX_PHOTOS} photos")
    ext = s3.ext_for_content_type(body.content_type)
    key = s3.make_key(user.telegram_id, ext)
    post = s3.presign_upload(key, body.content_type)
    return PresignOut(
        storage_key=key, url=post["url"], fields=post["fields"], ttl=settings.signed_url_ttl
    )


@router.post("/confirm", response_model=PhotoOut)
async def confirm(db: DbDep, user: CurrentUser, body: PhotoConfirmIn):
    # Ключ должен принадлежать этому пользователю (защита от подмены чужого пути).
    if not body.storage_key.startswith(f"photos/{user.telegram_id}/"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "key does not belong to you")
    if await _count(db, user.telegram_id) >= MAX_PHOTOS:
        raise HTTPException(status.HTTP_409_CONFLICT, f"max {MAX_PHOTOS} photos")
    if not s3.object_exists(body.storage_key):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "upload not found in storage")

    order = await _count(db, user.telegram_id)
    # В пилоте (AUTO_APPROVE_PHOTOS=true) фото сразу попадает в ленту; иначе ждёт модерации.
    status_value = (
        PhotoModeration.approved.value
        if settings.auto_approve_photos
        else PhotoModeration.pending.value
    )
    photo = Photo(
        user_id=user.telegram_id,
        storage_key=body.storage_key,
        display_order=order,
        moderation_status=status_value,
    )
    db.add(photo)
    await db.flush()
    return PhotoOut(
        id=photo.id,
        url=s3.presign_download(photo.storage_key),
        display_order=photo.display_order,
        moderation_status=photo.moderation_status,
    )


@router.delete("/{photo_id}", response_model=OkResponse)
async def delete_photo(db: DbDep, user: CurrentUser, photo_id: UUID):
    photo = await db.get(Photo, photo_id)
    if photo is None or photo.user_id != user.telegram_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "photo not found")
    s3.delete_object(photo.storage_key)
    await db.delete(photo)
    return OkResponse()
