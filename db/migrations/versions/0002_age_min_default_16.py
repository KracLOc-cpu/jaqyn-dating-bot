"""Set profile age_min default to 16.

Revision ID: 0002_age_min_default_16
Revises: 0001_initial
Create Date: 2026-06-11
"""
from __future__ import annotations

from alembic import op


revision = "0002_age_min_default_16"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE profiles ALTER COLUMN age_min SET DEFAULT 16")
    op.execute("UPDATE profiles SET age_min = 16 WHERE age_min = 18")


def downgrade() -> None:
    op.execute("UPDATE profiles SET age_min = 18 WHERE age_min = 16")
    op.execute("ALTER TABLE profiles ALTER COLUMN age_min SET DEFAULT 18")
