import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGINS = new Set([
  "https://storysite-entry.netlify.app",
  "http://localhost:8888",
  "http://127.0.0.1:8888",
  "http://localhost:3999",
  "http://127.0.0.1:3999",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
]);

function corsHeaders(origin) {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://storysite-entry.netlify.app";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

function asBool(value) {
  if (typeof value === "boolean") return value;
  if (value == null) return false;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function clean(value, max = 2000) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  return s.slice(0, max);
}

export async function handler(event) {
  const origin = event.headers.origin || event.headers.Origin || "";
  const headers = corsHeaders(origin);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, message: "Method not allowed." }),
    };
  }

  const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
  // Prefer service role so insert+.select() is not blocked by RLS.
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  ).trim();

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        ok: false,
        message: "Inquiry service is not configured yet.",
      }),
    };
  }

  let raw = {};
  try {
    const contentType = event.headers["content-type"] || event.headers["Content-Type"] || "";
    if (contentType.includes("application/json")) {
      raw = JSON.parse(event.body || "{}");
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      raw = Object.fromEntries(new URLSearchParams(event.body || ""));
    } else {
      raw = JSON.parse(event.body || "{}");
    }
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, message: "Invalid body." }),
    };
  }

  // Honeypot — pretend success
  if (clean(raw["bot-field"] ?? raw.bot_field, 100)) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        message:
          "Your request has been submitted. Thank you — we will review it and follow up.",
        id: null,
      }),
    };
  }

  const full_name = clean(raw.full_name, 200);
  const email = clean(raw.email, 320);
  const request_type = clean(raw.request_type, 120);
  const service_type = clean(raw.service_type, 120);
  const project_details = clean(raw.project_details, 10000);
  const contact_consent = asBool(raw.contact_consent);

  if (!full_name || !email || !request_type || !service_type || !project_details) {
    return {
      statusCode: 422,
      headers,
      body: JSON.stringify({ ok: false, message: "Missing required fields." }),
    };
  }
  if (!contact_consent) {
    return {
      statusCode: 422,
      headers,
      body: JSON.stringify({ ok: false, message: "contact_consent is required." }),
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      statusCode: 422,
      headers,
      body: JSON.stringify({ ok: false, message: "Invalid email." }),
    };
  }

  const row = {
    full_name,
    email,
    phone: clean(raw.phone, 50),
    request_type,
    service_type,
    hosting_preference: clean(raw.hosting_preference, 120),
    project_details,
    contact_consent,
    terms_acknowledged: asBool(raw.terms_acknowledged),
    terms_version: clean(raw.terms_version, 80),
    quote_displayed: clean(raw.quote_displayed, 255),
    status: "new",
  };

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.from("inquiries").insert(row).select("id").single();
    if (error) {
      console.error("Supabase insert failed", error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          ok: false,
          message: "Could not save your request. Please try again.",
        }),
      };
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        ok: true,
        message:
          "Your request has been submitted. Thank you — we will review it and follow up.",
        id: data?.id ?? null,
      }),
    };
  } catch (error) {
    console.error("Inquiry handler error", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        message: "Could not save your request. Please try again.",
      }),
    };
  }
}
