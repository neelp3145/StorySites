"""Local smoke test using SQLite (no Supabase required).

Usage (from repo root):
  source .venv/bin/activate
  python scripts/smoke_test.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.chdir(ROOT)

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///./smoke.db"
os.environ["SECRET_KEY"] = "smoke-test-secret"
os.environ["ADMIN_USERNAME"] = "admin"
os.environ["ADMIN_PASSWORD"] = "adminpass"
os.environ["CORS_ORIGINS"] = "http://testserver"
os.environ.pop("SMTP_HOST", None)
os.environ["NOTIFY_TO"] = ""

from app.core.config import get_settings

get_settings.cache_clear()

# Rebuild engine against SQLite before importing app routes that use it
import app.core.database as dbmod
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

engine = create_engine(
    "sqlite+pysqlite:///./smoke.db",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
dbmod.engine = engine
dbmod.SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

from app.core.database import Base
from app import models  # noqa: F401

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def main() -> None:
    health = client.get("/health")
    assert health.status_code == 200, health.text
    assert health.json()["database"] is True

    payload = {
        "full_name": "Test User",
        "email": "test@example.com",
        "phone": "555-0100",
        "request_type": "Request a StorySite",
        "service_type": "Personal / Professional StorySite",
        "hosting_preference": "StorySites managed hosting",
        "project_details": "Looking for a personal StorySite.",
        "contact_consent": True,
        "terms_acknowledged": True,
        "terms_version": "draft-2026-11-11-v1",
        "quote_displayed": "Starting at $249.99",
        "bot-field": "",
    }
    created = client.post("/api/inquiries", json=payload)
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["ok"] is True
    assert body["id"]

    honeypot = client.post(
        "/api/inquiries",
        json={**payload, "email": "spam@example.com", "bot-field": "spam"},
    )
    assert honeypot.status_code == 201
    assert honeypot.json().get("id") is None

    login = client.post(
        "/admin/login",
        data={"username": "admin", "password": "adminpass"},
        follow_redirects=False,
    )
    assert login.status_code == 303

    listing = client.get("/admin")
    assert listing.status_code == 200
    assert "Test User" in listing.text

    detail = client.get(f"/admin/inquiries/{body['id']}")
    assert detail.status_code == 200
    assert "Looking for a personal StorySite" in detail.text

    updated = client.post(
        f"/admin/inquiries/{body['id']}",
        data={"status": "contacted", "notes": "Reached out"},
    )
    assert updated.status_code == 200
    assert "Reached out" in updated.text
    assert "contacted" in updated.text

    print("smoke_test: all checks passed")


if __name__ == "__main__":
    main()
