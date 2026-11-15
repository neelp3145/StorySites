from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.models import InquiryStatus


def _as_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    if isinstance(value, (int, float)):
        return bool(value)
    return str(value).strip().lower() in {"1", "true", "yes", "on", "checked"}


class InquiryCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=50)
    request_type: str = Field(..., min_length=1, max_length=120)
    service_type: str = Field(..., min_length=1, max_length=120)
    hosting_preference: Optional[str] = Field(default=None, max_length=120)
    project_details: str = Field(..., min_length=1, max_length=10000)
    contact_consent: bool
    terms_acknowledged: bool = False
    terms_version: Optional[str] = Field(default=None, max_length=80)
    quote_displayed: Optional[str] = Field(default=None, max_length=255)
    bot_field: Optional[str] = Field(default=None, alias="bot-field")

    model_config = {"populate_by_name": True, "extra": "ignore"}

    @field_validator("full_name", "request_type", "service_type", "project_details", mode="before")
    @classmethod
    def strip_required(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("phone", "hosting_preference", "terms_version", "quote_displayed", mode="before")
    @classmethod
    def empty_to_none(cls, v: Any) -> Any:
        if v is None:
            return None
        if isinstance(v, str) and not v.strip():
            return None
        return v.strip() if isinstance(v, str) else v

    @field_validator("contact_consent", "terms_acknowledged", mode="before")
    @classmethod
    def parse_bool(cls, v: Any) -> bool:
        return _as_bool(v)

    @model_validator(mode="after")
    def require_consent(self) -> InquiryCreate:
        if not self.contact_consent:
            raise ValueError("contact_consent is required")
        return self


class InquiryOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str]
    request_type: str
    service_type: str
    hosting_preference: Optional[str]
    project_details: str
    contact_consent: bool
    terms_acknowledged: bool
    terms_version: Optional[str]
    quote_displayed: Optional[str]
    status: InquiryStatus
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InquiryUpdate(BaseModel):
    status: Optional[InquiryStatus] = None
    notes: Optional[str] = Field(default=None, max_length=10000)


class InquirySubmitResponse(BaseModel):
    ok: bool = True
    message: str = "Your request has been submitted. Thank you — we will review it and follow up."
    id: Optional[int] = None
