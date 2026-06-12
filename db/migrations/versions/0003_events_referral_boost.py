"""events table + users.referred_by + profiles.boost_until

Revision ID: 0003_events_referral_boost
Revises: 0002_age_min_default_16
Create Date: 2026-06-11
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003_events_referral_boost"
down_revision = "0002_age_min_default_16"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("event", sa.String(length=40), nullable=False),
        sa.Column("meta", postgresql.JSONB(), server_default="{}", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_events_user_id", "events", ["user_id"])
    op.create_index("ix_events_event", "events", ["event"])
    op.create_index("ix_events_created_at", "events", ["created_at"])

    op.add_column("users", sa.Column("referred_by", sa.BigInteger(), nullable=True))
    op.add_column("profiles", sa.Column("boost_until", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("profiles", "boost_until")
    op.drop_column("users", "referred_by")
    op.drop_table("events")
