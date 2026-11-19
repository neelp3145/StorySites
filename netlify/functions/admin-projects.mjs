import { createAdminResourceHandler } from "../lib/admin-resource.mjs";
import {
  projectFromPortalBody,
  projectToPortal,
  resourceStatus,
} from "../lib/supabase.mjs";

export const handler = createAdminResourceHandler({
  table: "projects",
  collectionKey: "projects",
  pathSegment: "projects",
  singularLabel: "project",
  toPortal: projectToPortal,
  fromPortalBody: projectFromPortalBody,
  patchFromBody(body) {
    const patch = { updated_at: new Date().toISOString() };
    if (body.name != null || body.customer_name != null) {
      patch.customer_name = String(body.name || body.customer_name).trim();
    }
    if (body.service != null || body.service_type != null) {
      patch.service_type = String(body.service || body.service_type).trim();
    }
    if (body.status != null) patch.status = resourceStatus.projects.toDb(body.status);
    if (body.due != null || body.due_date != null) {
      patch.due_date = body.due || body.due_date || null;
    }
    if (body.notes != null) patch.notes = String(body.notes);
    return patch;
  },
});
