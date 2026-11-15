from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from itsdangerous import BadSignature, URLSafeSerializer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.models import Inquiry, InquiryStatus

router = APIRouter(tags=["admin"])
templates = Jinja2Templates(directory="app/templates")

SESSION_COOKIE = "storysites_admin"


def _serializer(settings: Settings) -> URLSafeSerializer:
    return URLSafeSerializer(settings.secret_key, salt="admin-session")


def _set_session(response: RedirectResponse, settings: Settings, username: str) -> None:
    token = _serializer(settings).dumps({"u": username})
    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 12,
    )


def _clear_session(response: RedirectResponse) -> None:
    response.delete_cookie(SESSION_COOKIE)


def _require_admin(request: Request, settings: Settings) -> Optional[str]:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    try:
        data = _serializer(settings).loads(token)
        username = data.get("u")
    except BadSignature:
        return None
    if username != settings.admin_username:
        return None
    return username


@router.get("/admin/login", response_class=HTMLResponse)
def login_page(request: Request, settings: Settings = Depends(get_settings)):
    if _require_admin(request, settings):
        return RedirectResponse("/admin", status_code=303)
    return templates.TemplateResponse(
        request,
        "login.html",
        {"error": None, "app_name": settings.app_name},
    )


@router.post("/admin/login", response_class=HTMLResponse)
def login_submit(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    settings: Settings = Depends(get_settings),
):
    if username == settings.admin_username and password == settings.admin_password:
        response = RedirectResponse("/admin", status_code=303)
        _set_session(response, settings, username)
        return response
    return templates.TemplateResponse(
        request,
        "login.html",
        {"error": "Invalid username or password.", "app_name": settings.app_name},
        status_code=401,
    )


@router.post("/admin/logout")
def logout():
    response = RedirectResponse("/admin/login", status_code=303)
    _clear_session(response)
    return response


@router.get("/admin", response_class=HTMLResponse)
def admin_list(
    request: Request,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    admin = _require_admin(request, settings)
    if not admin:
        return RedirectResponse("/admin/login", status_code=303)

    stmt = select(Inquiry).order_by(Inquiry.created_at.desc())
    active_filter = status_filter or "all"
    if status_filter and status_filter in InquiryStatus.__members__:
        stmt = stmt.where(Inquiry.status == InquiryStatus(status_filter))

    inquiries = db.scalars(stmt).all()
    return templates.TemplateResponse(
        request,
        "list.html",
        {
            "inquiries": inquiries,
            "status_filter": active_filter,
            "statuses": [s.value for s in InquiryStatus],
            "admin": admin,
            "app_name": settings.app_name,
        },
    )


@router.get("/admin/inquiries/{inquiry_id}", response_class=HTMLResponse)
def admin_detail(
    request: Request,
    inquiry_id: int,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    admin = _require_admin(request, settings)
    if not admin:
        return RedirectResponse("/admin/login", status_code=303)

    inquiry = db.get(Inquiry, inquiry_id)
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    return templates.TemplateResponse(
        request,
        "detail.html",
        {
            "inquiry": inquiry,
            "statuses": [s.value for s in InquiryStatus],
            "admin": admin,
            "app_name": settings.app_name,
            "saved": False,
        },
    )


@router.post("/admin/inquiries/{inquiry_id}", response_class=HTMLResponse)
def admin_update(
    request: Request,
    inquiry_id: int,
    status_value: str = Form(..., alias="status"),
    notes: str = Form(""),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    admin = _require_admin(request, settings)
    if not admin:
        return RedirectResponse("/admin/login", status_code=303)

    inquiry = db.get(Inquiry, inquiry_id)
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    if status_value not in InquiryStatus.__members__:
        raise HTTPException(status_code=400, detail="Invalid status")

    inquiry.status = InquiryStatus(status_value)
    inquiry.notes = notes.strip() or None
    db.commit()
    db.refresh(inquiry)

    return templates.TemplateResponse(
        request,
        "detail.html",
        {
            "inquiry": inquiry,
            "statuses": [s.value for s in InquiryStatus],
            "admin": admin,
            "app_name": settings.app_name,
            "saved": True,
        },
    )
