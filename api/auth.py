"""Валидация Telegram Mini App initData.

Mini App присылает строку initData (query string). Подлинность проверяется
HMAC-SHA256 по алгоритму Telegram:

  secret_key  = HMAC_SHA256(key="WebAppData", msg=bot_token)
  data_check  = "\\n".join(sorted "key=value" кроме hash)
  valid       ⇔ HMAC_SHA256(key=secret_key, msg=data_check).hex == hash

Это доказывает, что данные подписаны нашим ботом и не подделаны.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from urllib.parse import parse_qsl

from shared.config import settings

# Максимальный возраст initData (защита от replay). 24 часа.
MAX_AUTH_AGE = 86400


@dataclass
class TelegramUser:
    id: int
    first_name: str
    username: str | None = None
    last_name: str | None = None


class InitDataError(Exception):
    """initData отсутствует, просрочен или подпись неверна."""


def _secret_key(bot_token: str) -> bytes:
    return hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()


def validate_init_data(init_data: str, *, bot_token: str | None = None) -> TelegramUser:
    """Проверить подпись и вернуть пользователя. Бросает InitDataError при провале."""
    if not init_data:
        raise InitDataError("empty init data")

    token = bot_token or settings.bot_token
    pairs = dict(parse_qsl(init_data, strict_parsing=False))

    received_hash = pairs.pop("hash", None)
    if not received_hash:
        raise InitDataError("no hash")

    data_check_string = "\n".join(f"{k}={pairs[k]}" for k in sorted(pairs))
    calculated = hmac.new(
        _secret_key(token), data_check_string.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(calculated, received_hash):
        raise InitDataError("bad signature")

    # Защита от повторного использования старого initData.
    auth_date = pairs.get("auth_date")
    if auth_date and auth_date.isdigit():
        if time.time() - int(auth_date) > MAX_AUTH_AGE:
            raise InitDataError("init data expired")

    user_raw = pairs.get("user")
    if not user_raw:
        raise InitDataError("no user")

    try:
        u = json.loads(user_raw)
        return TelegramUser(
            id=int(u["id"]),
            first_name=u.get("first_name", ""),
            username=u.get("username"),
            last_name=u.get("last_name"),
        )
    except (ValueError, KeyError) as e:
        raise InitDataError(f"bad user payload: {e}") from e
