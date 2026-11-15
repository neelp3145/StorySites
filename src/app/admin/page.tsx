import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated, expectedAdmin } from "@/lib/admin-auth";
import { sql, type Inquiry } from "@/lib/db";
import { cookies } from "next/headers";
import { adminCookieName } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


async function logoutAction() {
  "use server";
  const jar = await cookies();
  jar.delete(adminCookieName());
  redirect("/admin/login");
}

export default async function AdminListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const params = await searchParams;
  const status = params.status;
  const inquiries =
    status && ["new", "contacted", "closed"].includes(status)
      ? await sql<Inquiry>(
          "select * from inquiries where status = $1 order by created_at desc",
          [status],
        )
      : await sql<Inquiry>("select * from inquiries order by created_at desc");

  const admin = expectedAdmin()?.username ?? "";
  const active = status || "all";

  return (
    <div className="admin-shell">
      <header>
        <div style={{ fontWeight: 700 }}>StorySites</div>
        <div className="actions">
          <span className="muted">{admin}</span>
          <form action={logoutAction}>
            <button type="submit" className="secondary">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main>
        <h1>Inquiries</h1>
        <div className="filters">
          <Link href="/admin" className={active === "all" ? "active" : ""}>
            All
          </Link>
          {["new", "contacted", "closed"].map((s) => (
            <Link
              key={s}
              href={`/admin?status=${s}`}
              className={active === s ? "active" : ""}
            >
              {s}
            </Link>
          ))}
        </div>
        <div className="card">
          {inquiries.length === 0 ? (
            <p className="muted">No inquiries yet. Sample data mode is active until Postgres is attached.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((item) => (
                  <tr key={item.id}>
                    <td className="muted">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td>
                      <Link href={`/admin/inquiries/${item.id}`}>
                        <strong>{item.full_name}</strong>
                      </Link>
                      <br />
                      <span className="muted">{item.email}</span>
                    </td>
                    <td>
                      {item.request_type}
                      <br />
                      <span className="muted">{item.service_type}</span>
                    </td>
                    <td>
                      <span className={`badge ${item.status}`}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
