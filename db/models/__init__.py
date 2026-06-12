"""Импорт всех моделей в одном месте — нужен Alembic для autogenerate."""
from db.base import Base
from db.models.user import User
from db.models.profile import Profile
from db.models.photo import Photo, PhotoModeration
from db.models.swipe import Swipe
from db.models.match import Match
from db.models.block import Block
from db.models.report import Report, ReportStatus
from db.models.event import Event

__all__ = [
    "Base",
    "User",
    "Profile",
    "Photo",
    "PhotoModeration",
    "Swipe",
    "Match",
    "Block",
    "Report",
    "ReportStatus",
    "Event",
]
