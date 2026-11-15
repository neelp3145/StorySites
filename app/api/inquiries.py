from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.limiter import limiter
from app.models import Inquiry
from app.schemas import InquiryCreate, InquirySubmitResponse
from app.services.email import send_inquiry_notification

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["inquiries"])


def _form_to_dict(form: Any) -> dict[str, Any]:
    data: dict[str, Any] = {}
    for key in form.keys():
        if key in {"form-name"}:
            continue
        data[key] = form.get(key)
    return data


@router.post(
    "/inquiries",
    response_model=InquirySubmitResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit(get_settings().rate_limit)
async def create_inquiry(
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> InquirySubmitResponse:
    content_type = (request.headers.get("content-type") or "").lower()

    try:
        if "application/json" in content_type:
            raw = await request.json()
            if not isinstance(raw, dict):
                raise HTTPException(status_code=400, detail="Invalid JSON body.")
            payload = InquiryCreate.model_validate(raw)
        else:
            form = await request.form()
            payload = InquiryCreate.model_validate(_form_to_dict(form))
    except ValidationError as exc:
        logger.info("Inquiry validation failed: %s", exc.errors())
        raise HTTPException(status_code=422, detail=exc.errors()) from exc

    if payload.bot_field:
        logger.info("Honeypot triggered; dropping submission")
        return InquirySubmitResponse()

    inquiry = Inquiry(
        full_name=payload.full_name,
        email=str(payload.email),
        phone=payload.phone,
        request_type=payload.request_type,
        service_type=payload.service_type,
        hosting_preference=payload.hosting_preference,
        project_details=payload.project_details,
        contact_consent=payload.contact_consent,
        terms_acknowledged=payload.terms_acknowledged,
        terms_version=payload.terms_version,
        quote_displayed=payload.quote_displayed,
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)

    background.add_task(send_inquiry_notification, settings, inquiry)

    return InquirySubmitResponse(id=inquiry.id)
