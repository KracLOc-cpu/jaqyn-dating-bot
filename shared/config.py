"""Единый источник конфигурации для api и bot.

Читает переменные окружения (.env в local, реальные env в prod).
Всё в одном месте — чтобы не плодить os.getenv по коду.
"""
from __future__ import annotations

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── App ──
    env: str = Field(default="local")
    cors_origins: str = Field(default="*")

    # ── Telegram ──
    bot_token: str
    bot_mode: str = Field(default="polling")  # polling | webhook
    webhook_url: str = Field(default="")
    webhook_secret: str = Field(default="")
    mini_app_url: str = Field(default="")
    admin_telegram_ids: str = Field(default="")

    # ── PostgreSQL ──
    postgres_db: str
    postgres_user: str
    postgres_password: str
    postgres_host: str = Field(default="postgres")
    postgres_port: int = Field(default=5432)
    database_dsn: str = Field(default="", alias="DATABASE_URL")

    # ── Redis ──
    use_redis: bool = Field(default=True)
    redis_dsn: str = Field(default="", alias="REDIS_URL")
    redis_host: str = Field(default="redis")
    redis_port: int = Field(default=6379)
    onboarding_ttl: int = Field(default=86400)

    # ── S3 / object storage ──
    s3_endpoint: str
    s3_region: str = Field(default="auto")
    s3_bucket: str = Field(default="dating-photos")
    s3_access_key: str
    s3_secret_key: str
    signed_url_ttl: int = Field(default=3600)

    # ── Moderation ──
    # Пилот/тест: фото сразу approved, чтобы лента наполнялась без ручной модерации.
    # Перед публичным запуском поставить False и включить нормальную проверку.
    auto_approve_photos: bool = Field(default=False)

    # ── Derived ──
    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_url(self) -> str:
        if self.database_dsn:
            dsn = self.database_dsn
            if dsn.startswith("postgresql://"):
                return dsn.replace("postgresql://", "postgresql+asyncpg://", 1)
            if dsn.startswith("postgres://"):
                return dsn.replace("postgres://", "postgresql+asyncpg://", 1)
            return dsn
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def redis_url(self) -> str:
        if self.redis_dsn:
            return self.redis_dsn
        return f"redis://{self.redis_host}:{self.redis_port}/0"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def admin_ids(self) -> set[int]:
        raw = self.admin_telegram_ids.strip()
        if not raw:
            return set()
        return {int(x) for x in raw.split(",") if x.strip()}

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()  # type: ignore[call-arg]
