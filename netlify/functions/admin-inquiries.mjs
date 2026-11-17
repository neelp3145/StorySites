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
