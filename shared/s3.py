"""S3-совместимое хранилище фото.

Один и тот же код работает с MinIO (local) и Cloudflare R2 (prod) —
различие только в S3_ENDPOINT/ключах из конфига.

Фото приватные: публичных URL нет, доступ только через signed URL
с ограниченным TTL (settings.signed_url_ttl).

Два пути загрузки:
  * bot  → upload_bytes()    (бот скачал фото из Telegram, кладёт байты)
  * mini app → presign_upload() (фронт грузит напрямую в хранилище)
"""
from __future__ import annotations

import uuid
from functools import lru_cache

import boto3
from botocore.client import Config

from shared.config import settings


@lru_cache(maxsize=1)
def _client():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        config=Config(signature_version="s3v4"),
    )


def ensure_bucket() -> None:
    """Создать бакет, если его нет (нужно для свежего MinIO)."""
    client = _client()
    existing = {b["Name"] for b in client.list_buckets().get("Buckets", [])}
    if settings.s3_bucket not in existing:
        client.create_bucket(Bucket=settings.s3_bucket)


_EXT_BY_CONTENT_TYPE = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


def ext_for_content_type(content_type: str) -> str:
    return _EXT_BY_CONTENT_TYPE.get(content_type, "jpg")


def make_key(user_id: int, ext: str = "jpg") -> str:
    """Сгенерировать storage_key для нового фото."""
    return f"photos/{user_id}/{uuid.uuid4().hex}.{ext}"


def object_exists(key: str) -> bool:
    """Есть ли объект в хранилище (для подтверждения presigned-загрузки)."""
    from botocore.exceptions import ClientError

    try:
        _client().head_object(Bucket=settings.s3_bucket, Key=key)
        return True
    except ClientError:
        return False


def upload_bytes(key: str, data: bytes, content_type: str = "image/jpeg") -> None:
    """Загрузить байты в хранилище (путь бота)."""
    _client().put_object(
        Bucket=settings.s3_bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
    )


def presign_upload(key: str, content_type: str = "image/jpeg") -> dict:
    """Signed URL для прямой загрузки с фронта (путь Mini App).

    Возвращает url + поля для multipart POST.
    """
    return _client().generate_presigned_post(
        Bucket=settings.s3_bucket,
        Key=key,
        Fields={"Content-Type": content_type},
        Conditions=[
            {"Content-Type": content_type},
            ["content-length-range", 1, 10 * 1024 * 1024],  # до 10 МБ
        ],
        ExpiresIn=settings.signed_url_ttl,
    )


def presign_download(key: str) -> str:
    """Signed URL для просмотра фото. TTL = settings.signed_url_ttl.

    Фронт обязан запросить свежий URL после истечения (см. ТЗ).
    """
    return _client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": key},
        ExpiresIn=settings.signed_url_ttl,
    )


def delete_object(key: str) -> None:
    _client().delete_object(Bucket=settings.s3_bucket, Key=key)
