from __future__ import annotations

import asyncio
import logging
from email.message import EmailMessage

import aiosmtplib

from app.core.config import Settings
from app.models import Inquiry

logger = logging.getLogger(__name__)


def _build_message(settings: Settings, inquiry: Inquiry) -> EmailMessage:
    subject = f"[StorySites] New inquiry from {inquiry.full_name}"
    text = f"""New StorySites inquiry received.

Name: {inquiry.full_name}
Email: {inquiry.email}
Phone: {inquiry.phone or "—"}
Request type: {inquiry.request_type}
StorySite type: {inquiry.service_type}
Hosting: {inquiry.hosting_preference or "—"}
Terms version: {inquiry.terms_version or "—"}
Quote shown: {inquiry.quote_displayed or "—"}
Consent: contact={inquiry.contact_consent}, terms={inquiry.terms_acknowledged}

Project details:
{inquiry.project_details}

Inquiry ID: {inquiry.id}
"""
    html = f"""<html><body>
<h2>New StorySites inquiry</h2>
<ul>
  <li><strong>Name:</strong> {inquiry.full_name}</li>
  <li><strong>Email:</strong> {inquiry.email}</li>
  <li><strong>Phone:</strong> {inquiry.phone or "—"}</li>
  <li><strong>Request type:</strong> {inquiry.request_type}</li>
  <li><strong>StorySite type:</strong> {inquiry.service_type}</li>
  <li><strong>Hosting:</strong> {inquiry.hosting_preference or "—"}</li>
  <li><strong>Terms version:</strong> {inquiry.terms_version or "—"}</li>
  <li><strong>Quote shown:</strong> {inquiry.quote_displayed or "—"}</li>
</ul>
<p><strong>Project details</strong></p>
<pre style="white-space:pre-wrap;font-family:system-ui,sans-serif">{inquiry.project_details}</pre>
<p>Inquiry ID: {inquiry.id}</p>
</body></html>"""

    msg = EmailMessage()
    msg["From"] = settings.smtp_from
    msg["To"] = settings.notify_to
    msg["Subject"] = subject
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")
    return msg


async def send_inquiry_notification(settings: Settings, inquiry: Inquiry) -> None:
    if not settings.smtp_configured:
        logger.info("SMTP not configured; skipping notification for inquiry %s", inquiry.id)
        return

    message = _build_message(settings, inquiry)
    try:
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_username or None,
            password=settings.smtp_password or None,
            start_tls=settings.smtp_use_tls,
        )
        logger.info("Notification sent for inquiry %s", inquiry.id)
    except Exception:
        logger.exception("Failed to send notification for inquiry %s", inquiry.id)


def send_inquiry_notification_sync(settings: Settings, inquiry: Inquiry) -> None:
    """Fire-and-forget wrapper safe to call from sync request handlers."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        asyncio.run(send_inquiry_notification(settings, inquiry))
        return
    loop.create_task(send_inquiry_notification(settings, inquiry))
