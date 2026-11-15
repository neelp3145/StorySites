import { redirect } from "next/navigation";
import {
  adminCookieValue,
  expectedAdmin,
  isAdminAuthenticated,
  isAdminConfigured,
} from "@/lib/admin-auth";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


async function loginAction(formData: FormData) {
  "use server";
  const admin = expectedAdmin();
  if (!admin) {
    redirect("/admin/login?error=config");
  }

  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  if (username === admin.username && password === admin.password) {
    const cookie = adminCookieValue(username);
    if (!cookie) {
      redirect("/admin/login?error=config");
    }
    const jar = await cookies();
    jar.set(cookie.name, cookie.value, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    redirect("/admin");
  }
  redirect("/admin/login?error=1");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdminAuthenticated()) redirect("/admin");
  const params = await searchParams;
  const configured = isAdminConfigured();

  return (
    <div className="admin-shell">
      <header>
        <div style={{ fontWeight: 700 }}>StorySites</div>
      </header>
      <main>
        <div className="card" style={{ maxWidth: 420, margin: "2rem auto" }}>
          <h1 style={{ marginTop: 0 }}>Admin login</h1>
          <p className="muted">Sign in to review StorySites inquiries.</p>
          {!configured ? (
            <p className="error">
              Admin access is not configured. Set SECRET_KEY, ADMIN_USERNAME, and
              ADMIN_PASSWORD in app secrets, then republish.
            </p>
          ) : null}
          {params.error === "1" ? (
            <p className="error">Invalid username or password.</p>
          ) : null}
          {params.error === "config" ? (
            <p className="error">Admin access is not configured.</p>
          ) : null}
          <form action={loginAction}>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                autoComplete="username"
                required
                disabled={!configured}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={!configured}
              />
            </div>
            <button type="submit" disabled={!configured}>
              Sign in
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
