import {
  customerFromPortalBody,
  customerToPortal,
  getSupabaseAdmin,
  json,
  toDbCustomerStatus,
} from "../lib/supabase.mjs";

function pathId(event) {
  const raw =
    event.path ||
    event.rawUrl ||
    (event.headers && (event.headers["x-forwarded-url"] || "")) ||
    "";
  const match = String(raw).match(/\/api\/admin\/customers\/([^/?#]+)/);
  if (match) return decodeURIComponent(match[1]);
  if (event.queryStringParameters?.id) return event.queryStringParameters.id;
  return null;
}

export async function handler(event) {
  const origin = event.headers.origin || event.headers.Origin || "";

  if (event.httpMethod === "OPTIONS") {
    return json(204, {}, origin);
  }

  try {
    const supabase = getSupabaseAdmin();

    if (event.httpMethod === "GET") {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("List customers failed", error);
        return json(500, { ok: false, message: error.message }, origin);
      }

      return json(
        200,
        { ok: true, customers: (data || []).map(customerToPortal) },
        origin
      );
    }

    if (event.httpMethod === "POST") {
      let body = {};
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return json(400, { ok: false, message: "Invalid JSON body." }, origin);
      }

      let row;
      try {
        row = customerFromPortalBody(body);
      } catch (err) {
        return json(err.statusCode || 422, { ok: false, message: err.message }, origin);
      }

      const { data, error } = await supabase
        .from("customers")
        .insert(row)
        .select("*")
        .single();

      if (error) {
        console.error("Create customer failed", error);
        return json(500, { ok: false, message: error.message }, origin);
      }

      return json(201, { ok: true, customer: customerToPortal(data) }, origin);
    }

    if (event.httpMethod === "PATCH") {
      const id = pathId(event);
      if (!id) {
        return json(400, { ok: false, message: "Missing customer id." }, origin);
      }

      let body = {};
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return json(400, { ok: false, message: "Invalid JSON body." }, origin);
      }

      const patch = { updated_at: new Date().toISOString() };
      if (body.name != null || body.full_name != null) {
        patch.full_name = String(body.name || body.full_name).trim();
      }
      if (body.email != null) patch.email = String(body.email).trim();
      if (body.phone != null) patch.phone = String(body.phone).trim() || null;
      if (body.service != null || body.service_type != null) {
        patch.service_type = String(body.service || body.service_type).trim();
      }
      if (body.status != null) patch.status = toDbCustomerStatus(body.status);
      if (body.notes != null) patch.notes = String(body.notes);

      const { data, error } = await supabase
        .from("customers")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        console.error("Update customer failed", error);
        return json(500, { ok: false, message: error.message }, origin);
      }

      return json(200, { ok: true, customer: customerToPortal(data) }, origin);
    }

    if (event.httpMethod === "DELETE") {
      const id = pathId(event);
      if (!id) {
        return json(400, { ok: false, message: "Missing customer id." }, origin);
      }
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) {
        console.error("Delete customer failed", error);
        return json(500, { ok: false, message: error.message }, origin);
      }
      return json(200, { ok: true }, origin);
    }

    return json(405, { ok: false, message: "Method not allowed." }, origin);
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("admin-customers error", error);
    return json(
      status,
      {
        ok: false,
        message:
          status === 503
            ? "Customer admin API is not configured yet."
            : error.message || "Server error",
      },
      origin
    );
  }
}
