from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class InquiryStatus(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    closed = "closed"


class Inquiry(Base):
    __tablename__ = "inquiries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    request_type: Mapped[str] = mapped_column(String(120), nullable=False)
    service_type: Mapped[str] = mapped_column(String(120), nullable=False)
    hosting_preference: Mapped[str | None] = mapped_column(String(120), nullable=True)
    project_details: Mapped[str] = mapped_column(Text, nullable=False)
    contact_consent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    terms_acknowledged: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    terms_version: Mapped[str | None] = mapped_column(String(80), nullable=True)
    quote_displayed: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[InquiryStatus] = mapped_column(
        Enum(InquiryStatus, name="inquiry_status", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=InquiryStatus.new,
        server_default=InquiryStatus.new.value,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
