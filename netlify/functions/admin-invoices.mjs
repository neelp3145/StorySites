import { createAdminResourceHandler } from "../lib/admin-resource.mjs";
import {
  invoiceFromPortalBody,
  invoiceToPortal,
  resourceStatus,
} from "../lib/supabase.mjs";

export const handler = createAdminResourceHandler({
  table: "invoices",
  collectionKey: "invoices",
  pathSegment: "invoices",
  singularLabel: "invoice",
  toPortal: invoiceToPortal,
  fromPortalBody: invoiceFromPortalBody,
  patchFromBody(body) {
    const patch = { updated_at: new Date().toISOString() };
    if (body.name != null || body.customer_name != null) {
      patch.customer_name = String(body.name || body.customer_name).trim();
    }
    if (body.amount != null) patch.amount = Number(body.amount) || 0;
    if (body.status != null) patch.status = resourceStatus.invoices.toDb(body.status);
    if (body.due != null || body.due_date != null) {
      patch.due_date = body.due || body.due_date || null;
    }
    if (body.notes != null) patch.notes = String(body.notes);
    return patch;
  },
});
