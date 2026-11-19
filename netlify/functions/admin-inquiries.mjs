import {
  getSupabaseAdmin,
  inquiryToPortal,
  json,
  toDbStatus,
} from "../lib/supabase.mjs";

function pathId(event) {
  const raw =
    event.path ||
    event.rawUrl ||
    (event.headers && (event.headers["x-forwarded-url"] || "")) ||
    "";
  const match = String(raw).match(/\/api\/admin\/inquiries\/([^/?#]+)/);
  if (match) return decodeURIComponent(match[1]);
  // Netlify may pass the splat in query when redirected
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
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("List inquiries failed", error);
        return json(500, { ok: false, message: error.message }, origin);
      }

      return json(
        200,
        {
          ok: true,
          inquiries: (data || []).map(inquiryToPortal),
        },
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

      const full_name = String(body.name || body.full_name || "").trim();
      const email = String(body.email || "").trim();
      const service_type = String(body.service || body.service_type || "").trim();
      const project_details = String(body.notes || body.project_details || "").trim() || "Created from management portal";
      if (!full_name || !email || !service_type) {
        return json(
          422,
          { ok: false, message: "name, email, and service are required." },
          origin
        );
      }

      const row = {
        full_name,
        email,
        phone: body.phone ? String(body.phone).trim() : null,
        request_type: String(body.request_type || "General inquiry").trim(),
        service_type,
        hosting_preference: body.hosting ? String(body.hosting).trim() : null,
        project_details,
        contact_consent: true,
        terms_acknowledged: true,
        terms_version: body.terms_version || null,
        quote_displayed: body.quote_displayed || null,
        status: toDbStatus(body.status || "New"),
        notes: body.notes != null ? String(body.notes) : null,
      };

      const { data, error } = await supabase
        .from("inquiries")
        .insert(row)
        .select("*")
        .single();

      if (error) {
        console.error("Create inquiry failed", error);
        return json(500, { ok: false, message: error.message }, origin);
      }

      return json(201, { ok: true, inquiry: inquiryToPortal(data) }, origin);
    }

    if (event.httpMethod === "PATCH") {
      const id = pathId(event);
      if (!id) {
        return json(400, { ok: false, message: "Missing inquiry id." }, origin);
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
      if (body.service != null || body.service_type != null) {
        patch.service_type = String(body.service || body.service_type).trim();
      }
      if (body.date != null) {
        // portal date field is display-only for inquiries; ignore on update
      }
      if (body.status != null) patch.status = toDbStatus(body.status);
      if (body.notes != null) patch.notes = String(body.notes);

      const { data, error } = await supabase
        .from("inquiries")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        console.error("Update inquiry failed", error);
        return json(500, { ok: false, message: error.message }, origin);
      }

      return json(200, { ok: true, inquiry: inquiryToPortal(data) }, origin);
    }

    if (event.httpMethod === "DELETE") {
      const id = pathId(event);
      if (!id) {
        return json(400, { ok: false, message: "Missing inquiry id." }, origin);
      }
      const { error } = await supabase.from("inquiries").delete().eq("id", id);
      if (error) {
        console.error("Delete inquiry failed", error);
        return json(500, { ok: false, message: error.message }, origin);
      }
      return json(200, { ok: true }, origin);
    }

    return json(405, { ok: false, message: "Method not allowed." }, origin);
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("admin-inquiries error", error);
    return json(
      status,
      {
        ok: false,
        message:
          status === 503
            ? "Inquiry admin API is not configured yet."
            : error.message || "Server error",
      },
      origin
    );
  }
}
