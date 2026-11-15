from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import get_settings


settings = get_settings()

# Transaction-mode pooler (Supabase :6543) does not support persistent prepared statements.
use_null_pool = "pooler.supabase.com" in settings.database_url or ":6543" in settings.database_url
connect_args: dict = {}
if use_null_pool:
    # psycopg3: disable prepared statements for PgBouncer transaction mode
    connect_args["prepare_threshold"] = None

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
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
