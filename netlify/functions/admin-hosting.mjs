import { createAdminResourceHandler } from "../lib/admin-resource.mjs";
import {
  hostingFromPortalBody,
  hostingToPortal,
  resourceStatus,
} from "../lib/supabase.mjs";

export const handler = createAdminResourceHandler({
  table: "hosting",
  collectionKey: "hosting",
  pathSegment: "hosting",
  singularLabel: "hosting",
  toPortal: hostingToPortal,
  fromPortalBody: hostingFromPortalBody,
  patchFromBody(body) {
    const patch = { updated_at: new Date().toISOString() };
    if (body.name != null || body.customer_name != null) {
      patch.customer_name = String(body.name || body.customer_name).trim();
    }
    if (body.site != null || body.site_url != null) {
      patch.site_url = String(body.site || body.site_url).trim();
    }
    if (body.status != null) patch.status = resourceStatus.hosting.toDb(body.status);
    if (body.renewal != null || body.renewal_date != null) {
      patch.renewal_date = body.renewal || body.renewal_date || null;
    }
    if (body.notes != null) patch.notes = String(body.notes);
    return patch;
  },
});
