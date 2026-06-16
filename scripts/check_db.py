"""Check database connectivity and Alembic revision.

Usage:
    python scripts/check_db.py
"""
from __future__ import annotations

import asyncio

from sqlalchemy import text

from db.session import engine
from shared.config import settings


def _masked_url(url: str) -> str:
    if "@" not in url or "://" not in url:
        return url
    scheme, rest = url.split("://", 1)
    credentials, host = rest.split("@", 1)
    user = credentials.split(":", 1)[0]
    return f"{scheme}://{user}:***@{host}"


async def main() -> None:
    print(f"database_url={_masked_url(settings.database_url)}")
    async with engine.connect() as conn:
        result = await conn.execute(text("select current_database(), current_user"))
        database_name, user_name = result.one()
        print(f"connected=true database={database_name} user={user_name}")

        table_result = await conn.execute(text("select to_regclass('public.alembic_version')"))
        if table_result.scalar_one() is None:
            revisions = []
        else:
            revision_result = await conn.execute(text("select version_num from alembic_version"))
            revisions = [row[0] for row in revision_result]
        print(f"alembic_versions={revisions or []}")


if __name__ == "__main__":
    asyncio.run(main())
