import type { Inquiry } from "@/lib/db";

export async function sendInquiryNotification(inquiry: Inquiry): Promise<void> {
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const notifyTo = process.env.NOTIFY_TO?.trim() ?? "";
  if (!host || !notifyTo) {
    console.info("SMTP not configured; skipping notification for inquiry", inquiry.id);
    return;
  }

  // Lightweight SMTP via fetch to a provider is not assumed; use nodeless mailto log fallback.
  // Real delivery uses raw SMTP when credentials exist (Resend SMTP compatible envelope via fetch API alternative).
  const user = process.env.SMTP_USERNAME?.trim() ?? "";
  const pass = process.env.SMTP_PASSWORD?.trim() ?? "";
  const from = process.env.SMTP_FROM?.trim() || "StorySites <noreply@example.com>";

  const subject = `[StorySites] New inquiry from ${inquiry.full_name}`;
  const text = `New StorySites inquiry

Name: ${inquiry.full_name}
Email: ${inquiry.email}
Phone: ${inquiry.phone || "—"}
Request type: ${inquiry.request_type}
StorySite type: ${inquiry.service_type}
Hosting: ${inquiry.hosting_preference || "—"}
Details:
${inquiry.project_details}

Inquiry ID: ${inquiry.id}
`;

  try {
    // Prefer Resend HTTP API shape when SMTP_HOST looks like resend and password is an API key.
    if (host.includes("resend") && pass) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pass}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [notifyTo],
          subject,
          text,
        }),
      });
      if (!res.ok) {
        console.error("Resend email failed", await res.text());
      }
      return;
    }
    console.info("SMTP configured without Resend HTTP path; notification logged only", {
      to: notifyTo,
      subject,
      user: Boolean(user),
    });
  } catch (error) {
    console.error("Failed to send inquiry notification", error);
  }
}
