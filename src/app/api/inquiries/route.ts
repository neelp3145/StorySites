import { NextRequest, NextResponse } from "next/server";
import { sql, type Inquiry } from "@/lib/db";
import { sendInquiryNotification } from "@/lib/email";

export const runtime = "nodejs";

type Body = {
  full_name?: string;
  email?: string;
  phone?: string | null;
  request_type?: string;
  service_type?: string;
  hosting_preference?: string | null;
  project_details?: string;
  contact_consent?: boolean | string;
  terms_acknowledged?: boolean | string;
  terms_version?: string | null;
  quote_displayed?: string | null;
  "bot-field"?: string | null;
  bot_field?: string | null;
};

function asBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (value == null) return false;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function clean(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s ? s : null;
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  let raw: Body = {};
  try {
    if (contentType.includes("application/json")) {
      raw = (await request.json()) as Body;
    } else {
      const form = await request.formData();
      raw = Object.fromEntries(form.entries()) as Body;
    }
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid body." }, { status: 400 });
  }

  const bot = clean(raw["bot-field"] ?? raw.bot_field);
  if (bot) {
    return NextResponse.json({
      ok: true,
      message:
        "Your request has been submitted. Thank you — we will review it and follow up.",
      id: null,
    });
  }

  const full_name = clean(raw.full_name);
  const email = clean(raw.email);
  const request_type = clean(raw.request_type);
  const service_type = clean(raw.service_type);
  const project_details = clean(raw.project_details);
  const contact_consent = asBool(raw.contact_consent);

  if (!full_name || !email || !request_type || !service_type || !project_details) {
    return NextResponse.json(
      { ok: false, message: "Missing required fields." },
      { status: 422 },
    );
  }
  if (!contact_consent) {
    return NextResponse.json(
      { ok: false, message: "contact_consent is required." },
      { status: 422 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, message: "Invalid email." }, { status: 422 });
  }

  const rows = await sql<Inquiry>(
    `insert into inquiries (
      full_name, email, phone, request_type, service_type, hosting_preference,
      project_details, contact_consent, terms_acknowledged, terms_version, quote_displayed
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    returning *`,
    [
      full_name,
      email,
      clean(raw.phone),
      request_type,
      service_type,
      clean(raw.hosting_preference),
      project_details,
      contact_consent,
      asBool(raw.terms_acknowledged),
      clean(raw.terms_version),
      clean(raw.quote_displayed),
    ],
  );

  const inquiry = rows[0];
  void sendInquiryNotification(inquiry);

  return NextResponse.json(
    {
      ok: true,
      message:
        "Your request has been submitted. Thank you — we will review it and follow up.",
      id: inquiry.id,
    },
    { status: 201 },
  );
}
