from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import get_settings


settings = get_settings()

use_null_pool = "pooler.supabase.com" in settings.database_url or ":6543" in settings.database_url
connect_args: dict = {}
if use_null_pool:
    connect_args["prepare_threshold"] = None
elif settings.database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.database_url,
    pool_pre_ping=not settings.database_url.startswith("sqlite"),
    poolclass=NullPool if use_null_pool else None,
    connect_args=connect_args,
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    # Import models so metadata is populated, then create missing tables.
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
