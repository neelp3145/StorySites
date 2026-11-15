import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { expectedAdmin, isAdminAuthenticated } from "@/lib/admin-auth";
import { sql, type Inquiry } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


async function updateAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") || "");
  const notes = String(formData.get("notes") || "").trim();
  if (!["new", "contacted", "closed"].includes(status)) {
    redirect(`/admin/inquiries/${id}`);
  }
  await sql(
    "update inquiries set status = $1, notes = $2, updated_at = now() where id = $3",
    [status, notes || null, id],
  );
  redirect(`/admin/inquiries/${id}?saved=1`);
}

export default async function InquiryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const { id } = await params;
  const { saved } = await searchParams;
  const rows = await sql<Inquiry>("select * from inquiries where id = $1", [
    Number(id),
  ]);
  const inquiry = rows[0];
  if (!inquiry) notFound();

  return (
    <div className="admin-shell">
      <header>
        <div style={{ fontWeight: 700 }}>StorySites</div>
        <span className="muted">{expectedAdmin()?.username ?? ""}</span>
      </header>
      <main>
        <p>
          <Link href="/admin">← All inquiries</Link>
        </p>
        {saved ? <p className="ok">Saved.</p> : null}
        <div className="card">
          <h1 style={{ marginTop: 0 }}>{inquiry.full_name}</h1>
          <span className={`badge ${inquiry.status}`}>{inquiry.status}</span>
          <dl className="meta">
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
            </dd>
            <dt>Phone</dt>
            <dd>{inquiry.phone || "—"}</dd>
            <dt>Request</dt>
            <dd>{inquiry.request_type}</dd>
            <dt>StorySite type</dt>
            <dd>{inquiry.service_type}</dd>
            <dt>Hosting</dt>
            <dd>{inquiry.hosting_preference || "—"}</dd>
            <dt>Terms version</dt>
            <dd>{inquiry.terms_version || "—"}</dd>
            <dt>Quote shown</dt>
            <dd>{inquiry.quote_displayed || "—"}</dd>
            <dt>Created</dt>
            <dd>{new Date(inquiry.created_at).toLocaleString()}</dd>
          </dl>
          <h2>Project details</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{inquiry.project_details}</p>
        </div>
        <div className="card" style={{ marginTop: "1rem" }}>
          <h2 style={{ marginTop: 0 }}>Update</h2>
          <form action={updateAction}>
            <input type="hidden" name="id" value={inquiry.id} />
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={inquiry.status}>
                {["new", "contacted", "closed"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="notes">Internal notes</label>
              <textarea id="notes" name="notes" defaultValue={inquiry.notes || ""} />
            </div>
            <button type="submit">Save</button>
          </form>
        </div>
      </main>
    </div>
  );
}
