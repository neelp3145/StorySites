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

const CUSTOMER_STATUS_TO_PORTAL = {
  prospect: "Prospect",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

const CUSTOMER_STATUS_TO_DB = {
  Prospect: "prospect",
  Active: "active",
  Completed: "completed",
  Archived: "archived",
};

export function toPortalCustomerStatus(value) {
  if (!value) return "Prospect";
  const raw = String(value).trim();
  if (CUSTOMER_STATUS_TO_PORTAL[raw.toLowerCase()]) {
    return CUSTOMER_STATUS_TO_PORTAL[raw.toLowerCase()];
  }
  if (CUSTOMER_STATUS_TO_DB[raw]) return raw;
  return raw;
}

export function toDbCustomerStatus(value) {
  if (!value) return "prospect";
  const raw = String(value).trim();
  if (CUSTOMER_STATUS_TO_DB[raw]) return CUSTOMER_STATUS_TO_DB[raw];
  const lower = raw.toLowerCase();
  if (CUSTOMER_STATUS_TO_PORTAL[lower]) return lower;
  return lower;
}

export function customerToPortal(row) {
  return {
    id: String(row.id),
    name: row.full_name,
    email: row.email,
    phone: row.phone || "",
    service: row.service_type,
    status: toPortalCustomerStatus(row.status),
    notes: row.notes || "",
    inquiry_id: row.inquiry_id != null ? String(row.inquiry_id) : null,
    date: (row.created_at || "").toString().slice(0, 10),
  };
}

export function customerFromPortalBody(body = {}) {
  const full_name = String(body.name || body.full_name || "").trim();
  const email = String(body.email || "").trim();
  const service_type = String(body.service || body.service_type || "").trim();
  if (!full_name || !email || !service_type) {
    const err = new Error("name, email, and service are required.");
    err.statusCode = 422;
    throw err;
  }
  const row = {
    full_name,
    email,
    phone: body.phone ? String(body.phone).trim() : null,
    service_type,
    status: toDbCustomerStatus(body.status),
    notes: body.notes != null ? String(body.notes) : null,
    updated_at: new Date().toISOString(),
  };
  if (body.inquiry_id != null && body.inquiry_id !== "") {
    row.inquiry_id = Number(body.inquiry_id);
  }
  return row;
}

function mapStatus(toPortal, toDb, fallbackPortal, fallbackDb) {
  return {
    toPortal(value) {
      if (!value) return fallbackPortal;
      const raw = String(value).trim();
      if (toPortal[raw.toLowerCase()]) return toPortal[raw.toLowerCase()];
      if (toDb[raw]) return raw;
      return raw;
    },
    toDb(value) {
      if (!value) return fallbackDb;
      const raw = String(value).trim();
      if (toDb[raw]) return toDb[raw];
      const lower = raw.toLowerCase().replace(/\s+/g, "_");
      if (toPortal[lower]) return lower;
      return lower;
    },
  };
}

const projectStatus = mapStatus(
  {
    not_started: "Not Started",
    in_development: "In Development",
    customer_review: "Customer Review",
    completed: "Completed",
    on_hold: "On Hold",
  },
  {
    "Not Started": "not_started",
    "In Development": "in_development",
    "Customer Review": "customer_review",
    Completed: "completed",
    "On Hold": "on_hold",
  },
  "Not Started",
  "not_started"
);

const invoiceStatus = mapStatus(
  {
    draft: "Draft",
    sent: "Sent",
    unpaid: "Unpaid",
    paid: "Paid",
    overdue: "Overdue",
    cancelled: "Cancelled",
  },
  {
    Draft: "draft",
    Sent: "sent",
    Unpaid: "unpaid",
    Paid: "paid",
    Overdue: "overdue",
    Cancelled: "cancelled",
  },
  "Draft",
  "draft"
);

const hostingStatus = mapStatus(
  {
    active: "Active",
    renewal_due: "Renewal Due",
    expired: "Expired",
    cancelled: "Cancelled",
  },
  {
    Active: "active",
    "Renewal Due": "renewal_due",
    Expired: "expired",
    Cancelled: "cancelled",
  },
  "Active",
  "active"
);

export function projectToPortal(row) {
  return {
    id: String(row.id),
    name: row.customer_name,
    service: row.service_type,
    status: projectStatus.toPortal(row.status),
    due: row.due_date || "",
    notes: row.notes || "",
    customer_id: row.customer_id != null ? String(row.customer_id) : null,
  };
}

export function projectFromPortalBody(body = {}) {
  const customer_name = String(body.name || body.customer_name || "").trim();
  const service_type = String(body.service || body.service_type || "").trim();
  if (!customer_name || !service_type) {
    const err = new Error("name and service are required.");
    err.statusCode = 422;
    throw err;
  }
  return {
    customer_name,
    service_type,
    status: projectStatus.toDb(body.status),
    due_date: body.due || body.due_date || null,
    notes: body.notes != null ? String(body.notes) : null,
    updated_at: new Date().toISOString(),
  };
}

export function invoiceToPortal(row) {
  return {
    id: String(row.id),
    name: row.customer_name,
    amount: Number(row.amount) || 0,
    status: invoiceStatus.toPortal(row.status),
    due: row.due_date || "",
    notes: row.notes || "",
    customer_id: row.customer_id != null ? String(row.customer_id) : null,
  };
}

export function invoiceFromPortalBody(body = {}) {
  const customer_name = String(body.name || body.customer_name || "").trim();
  if (!customer_name) {
    const err = new Error("name is required.");
    err.statusCode = 422;
    throw err;
  }
  return {
    customer_name,
    amount: Number(body.amount) || 0,
    status: invoiceStatus.toDb(body.status),
    due_date: body.due || body.due_date || null,
    notes: body.notes != null ? String(body.notes) : null,
    updated_at: new Date().toISOString(),
  };
}

export function hostingToPortal(row) {
  return {
    id: String(row.id),
    name: row.customer_name,
    site: row.site_url,
    renewal: row.renewal_date || "",
    status: hostingStatus.toPortal(row.status),
    notes: row.notes || "",
    customer_id: row.customer_id != null ? String(row.customer_id) : null,
  };
}

export function hostingFromPortalBody(body = {}) {
  const customer_name = String(body.name || body.customer_name || "").trim();
  const site_url = String(body.site || body.site_url || "").trim();
  if (!customer_name || !site_url) {
    const err = new Error("name and site are required.");
    err.statusCode = 422;
    throw err;
  }
  return {
    customer_name,
    site_url,
    renewal_date: body.renewal || body.renewal_date || null,
    status: hostingStatus.toDb(body.status),
    notes: body.notes != null ? String(body.notes) : null,
    updated_at: new Date().toISOString(),
  };
}

export const resourceStatus = {
  projects: projectStatus,
  invoices: invoiceStatus,
  hosting: hostingStatus,
};

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
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify(body),
  };
}
