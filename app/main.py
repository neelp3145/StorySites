from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import text

from app.api import admin, inquiries
from app.core.config import get_settings
from app.core.database import engine, init_db
from app.core.limiter import limiter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

app = FastAPI(title=settings.app_name, debug=settings.debug)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inquiries.router)
app.include_router(admin.router)


@app.on_event("startup")
def on_startup() -> None:
    try:
        init_db()
        logger.info("Database ready (%s)", settings.database_url.split("://", 1)[0])
    except Exception:
        logger.exception("Failed to initialize database")


@app.get("/health")
def health() -> JSONResponse:
    db_ok = False
    detail = "ok"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception as exc:
        detail = str(exc)
        logger.exception("Health check DB failure")
    status_code = 200 if db_ok else 503
    return JSONResponse(
        status_code=status_code,
        content={"status": "ok" if db_ok else "degraded", "database": db_ok, "detail": detail},
    )


@app.get("/api")
def api_root() -> dict:
    return {
        "name": settings.app_name,
        "docs": "/docs",
        "health": "/health",
        "admin": "/admin",
        "submit": "POST /api/inquiries",
    }


@app.get("/")
def landing() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")


if FRONTEND_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR)), name="frontend-assets")


@app.get("/api-config.js")
def api_config() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "api-config.js", media_type="application/javascript")


TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"
admin.templates.env.loader.searchpath = [str(TEMPLATES_DIR)]
