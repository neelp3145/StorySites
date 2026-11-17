import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  ).trim();

  if (!supabaseUrl || !supabaseKey) {
    const err = new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    err.statusCode = 503;
    throw err;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const STATUS_TO_PORTAL = {
  new: "New",
  contacted: "Contacted",
  proposal_sent: "Proposal Sent",
  converted: "Converted",
  closed: "Closed",
};

const STATUS_TO_DB = {
  New: "new",
  Contacted: "contacted",
  "Proposal Sent": "proposal_sent",
  Converted: "converted",
  Closed: "closed",
};

export function toPortalStatus(value) {
  if (!value) return "New";
  const raw = String(value).trim();
  if (STATUS_TO_PORTAL[raw.toLowerCase()]) return STATUS_TO_PORTAL[raw.toLowerCase()];
  if (STATUS_TO_DB[raw]) return raw;
  return raw;
}

export function toDbStatus(value) {
  if (!value) return "new";
  const raw = String(value).trim();
  if (STATUS_TO_DB[raw]) return STATUS_TO_DB[raw];
  const lower = raw.toLowerCase().replace(/\s+/g, "_");
  if (STATUS_TO_PORTAL[lower]) return lower;
  return lower;
}

export function inquiryToPortal(row) {
  const details = [row.project_details, row.notes].filter(Boolean).join("\n\n");
  return {
    id: String(row.id),
    name: row.full_name,
    email: row.email,
    phone: row.phone || "",
    service: row.service_type,
    request_type: row.request_type,
    hosting: row.hosting_preference || "",
    status: toPortalStatus(row.status),
    date: (row.created_at || "").toString().slice(0, 10),
    notes: details,
    project_details: row.project_details || "",
    quote_displayed: row.quote_displayed || "",
  };
}

export function json(statusCode, body, origin = "") {
  const allowed = new Set([
    "https://storysites-mgmt-portal.netlify.app",
    "https://storysite-entry.netlify.app",
    "http://localhost:8888",
    "http://127.0.0.1:8888",
    "http://localhost:8890",
    "http://127.0.0.1:8890",
  ]);
  const allow = origin && allowed.has(origin) ? origin : "*";
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": allow,
      "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify(body),
  };
}
