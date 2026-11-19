import { getSupabaseAdmin, json } from "./supabase.mjs";

/**
 * Shared CRUD handler factory for portal admin resources.
 */
export function createAdminResourceHandler({
  table,
  collectionKey,
  pathSegment,
  toPortal,
  fromPortalBody,
  patchFromBody,
  singularLabel,
}) {
  function pathId(event) {
    const raw =
      event.path ||
      event.rawUrl ||
      (event.headers && (event.headers["x-forwarded-url"] || "")) ||
      "";
    const match = String(raw).match(
      new RegExp(`/api/admin/${pathSegment}/([^/?#]+)`)
    );
    if (match) return decodeURIComponent(match[1]);
    if (event.queryStringParameters?.id) return event.queryStringParameters.id;
    return null;
  }

  return async function handler(event) {
    const origin = event.headers.origin || event.headers.Origin || "";

    if (event.httpMethod === "OPTIONS") {
      return json(204, {}, origin);
    }

    try {
      const supabase = getSupabaseAdmin();

      if (event.httpMethod === "GET") {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .order("created_at", { ascending: false });
        if (error) {
          console.error(`List ${table} failed`, error);
          return json(500, { ok: false, message: error.message }, origin);
        }
        return json(
          200,
          { ok: true, [collectionKey]: (data || []).map(toPortal) },
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
          row = fromPortalBody(body);
        } catch (err) {
          return json(
            err.statusCode || 422,
            { ok: false, message: err.message },
            origin
          );
        }
        const { data, error } = await supabase
          .from(table)
          .insert(row)
          .select("*")
          .single();
        if (error) {
          console.error(`Create ${table} failed`, error);
          return json(500, { ok: false, message: error.message }, origin);
        }
        return json(
          201,
          { ok: true, [singularLabel]: toPortal(data) },
          origin
        );
      }

      if (event.httpMethod === "PATCH") {
        const id = pathId(event);
        if (!id) {
          return json(
            400,
            { ok: false, message: `Missing ${singularLabel} id.` },
            origin
          );
        }
        let body = {};
        try {
          body = JSON.parse(event.body || "{}");
        } catch {
          return json(400, { ok: false, message: "Invalid JSON body." }, origin);
        }
        const patch = patchFromBody(body);
        const { data, error } = await supabase
          .from(table)
          .update(patch)
          .eq("id", id)
          .select("*")
          .single();
        if (error) {
          console.error(`Update ${table} failed`, error);
          return json(500, { ok: false, message: error.message }, origin);
        }
        return json(
          200,
          { ok: true, [singularLabel]: toPortal(data) },
          origin
        );
      }

      if (event.httpMethod === "DELETE") {
        const id = pathId(event);
        if (!id) {
          return json(
            400,
            { ok: false, message: `Missing ${singularLabel} id.` },
            origin
          );
        }
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) {
          console.error(`Delete ${table} failed`, error);
          return json(500, { ok: false, message: error.message }, origin);
        }
        return json(200, { ok: true }, origin);
      }

      return json(405, { ok: false, message: "Method not allowed." }, origin);
    } catch (error) {
      const status = error.statusCode || 500;
      console.error(`admin-${pathSegment} error`, error);
      return json(
        status,
        {
          ok: false,
          message:
            status === 503
              ? `${singularLabel} admin API is not configured yet.`
              : error.message || "Server error",
        },
        origin
      );
    }
  };
}
